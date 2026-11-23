import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import {
  DURACION_RENOVACION_MS,
  emitirRenovacion,
  revocarRenovacion,
  rotarRenovacion,
} from '../utils/refreshToken.js';
import { clonarPresetsAUsuario } from '../utils/presets.js';
import { registrarAcceso } from '../utils/ultimoAcceso.js';
import { borrarUsuarioYDatos } from '../utils/borrarCuenta.js';

// ---------------------------------------------------------------------------
// Cookie del token de renovación (bloque 11, DECISIONS.md 0037)
//   - httpOnly: JavaScript no puede leerla; un XSS no puede robarla.
//   - secure (en producción): solo viaja por HTTPS.
//   - sameSite 'lax': no viaja en peticiones POST desde otros sitios (protege de CSRF).
//     yieldfit.app y api.yieldfit.app son el mismo sitio, así que sí viaja desde la app.
//   - path '/api/auth': solo se envía a /refresh y /logout, no en cada petición a la API.
const COOKIE_RENOVACION = 'yieldfit_renovacion';
const opcionesCookie = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
});

// La cabecera Cookie llega como texto ("a=1; b=2"). Se lee a mano en vez de añadir
// cookie-parser: solo hace falta una cookie en dos rutas.
const leerCookie = (req, nombre) => {
  const par = (req.headers.cookie ?? '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${nombre}=`));
  return par ? decodeURIComponent(par.slice(nombre.length + 1)) : null;
};

const ponerCookieRenovacion = (res, token) =>
  res.cookie(COOKIE_RENOVACION, token, { ...opcionesCookie(), maxAge: DURACION_RENOVACION_MS });

const quitarCookieRenovacion = (res) => res.clearCookie(COOKIE_RENOVACION, opcionesCookie());

// Login y registro acaban igual: token de acceso en el cuerpo (el cliente lo guarda en
// memoria) y token de renovación en la cookie, de una familia nueva. Los dos cuentan como
// acceso (bloque 11b).
const responderConSesion = async (res, status, message, user) => {
  await registrarAcceso(user);
  ponerCookieRenovacion(res, await emitirRenovacion(user._id));
  res.status(status).json({ message, token: signToken(user._id), user });
};

// POST /api/auth/register
// Crea un nuevo usuario, le clona los ejercicios preset y devuelve token JWT.
export const register = async (req, res, next) => {
  try {
    const { email, password, nombreCompleto, fechaNacimiento, peso, altura, genero } = req.body;

    // Comprobación de email único antes de intentar guardar.
    // Evita un error 500 por violación de índice único en MongoDB.
    const existingUser = await User.findOne({ email: email?.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Ya existe una cuenta con ese email',
      });
    }

    // Creación del usuario + clonado del catálogo de ejercicios preset dentro
    // de una transacción de MongoDB: o se completan las dos operaciones, o no
    // se completa ninguna. Antes se hacían por separado y un fallo en el
    // clonado dejaba usuarios creados sin ejercicios; con la transacción esa
    // situación ya no puede ocurrir.
    const session = await mongoose.startSession();
    let user;
    try {
      await session.withTransaction(async () => {
        // El middleware pre('save') del modelo User hashea la contraseña automáticamente.
        user = new User({
          email,
          password,
          nombreCompleto,
          fechaNacimiento,
          peso,
          altura,
          genero,
        });
        await user.save({ session });

        await clonarPresetsAUsuario(user._id, session);
      });
    } finally {
      await session.endSession();
    }

    // La sesión se abre también en el registro, para que el cliente quede dentro sin
    // necesidad de una segunda petición a /login.
    await responderConSesion(res, 201, 'Usuario registrado correctamente', user);
  } catch (error) {
    // Errores de validación de Mongoose: devolvemos los mensajes de cada campo
    // que ha fallado para que el frontend pueda mostrarlos junto a su input.
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Datos no válidos',
        details: messages,
      });
    }
    next(error);
  }
};

// Hash de una contraseña que nadie tiene, con el mismo coste que los de verdad (10). Se
// compara contra él cuando el email no existe, para que esa respuesta tarde lo mismo que
// la de una contraseña incorrecta (bloque 11). Antes, un email inexistente respondía antes
// porque se saltaba bcrypt, y midiendo el tiempo se podía saber qué emails están registrados.
const HASH_FALSO = bcrypt.hashSync('contraseña-que-ningún-usuario-tiene', 10);

// POST /api/auth/login
// Verifica credenciales y devuelve un nuevo token JWT.
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email y contraseña son obligatorios',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Decisión de seguridad: devolvemos el mismo mensaje para "email no existe" y
    // "contraseña incorrecta" para evitar enumeración de usuarios. Un atacante
    // no debería poder descubrir qué emails están registrados probando logins.
    if (!user) {
      await bcrypt.compare(password, HASH_FALSO); // mismo tiempo que si existiera
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Credenciales incorrectas',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Credenciales incorrectas',
      });
    }

    await responderConSesion(res, 200, 'Login correcto', user);
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh
// Con la cookie de renovación, devuelve un token de acceso nuevo y cambia la cookie por la
// siguiente de su familia (cada token de renovación sirve una vez). El cliente lo llama al
// abrir la app (el token de acceso no sobrevive a una recarga: vive en memoria) y cuando una
// petición recibe 401 porque el de acceso ha caducado.
export const refresh = async (req, res, next) => {
  try {
    const rotado = await rotarRenovacion(leerCookie(req, COOKIE_RENOVACION));
    const user = rotado && (await User.findById(rotado.userId));
    if (!user) {
      quitarCookieRenovacion(res);
      return res.status(401).json({ error: 'Unauthorized', message: 'La sesión ha caducado. Vuelve a iniciar sesión.' });
    }
    await registrarAcceso(user);
    ponerCookieRenovacion(res, rotado.token);
    res.status(200).json({ token: signToken(user._id), user });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
// Cierra la sesión de ESTE dispositivo: invalida su token de renovación (y su familia) y
// borra la cookie. El token de acceso que tenga el cliente caduca solo en 15 minutos como
// mucho; el cliente lo olvida al momento.
export const logout = async (req, res, next) => {
  try {
    await revocarRenovacion(leerCookie(req, COOKIE_RENOVACION));
    quitarCookieRenovacion(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
// Devuelve los datos del usuario autenticado. Requiere middleware requireAuth.
// El propio middleware ya ha cargado el usuario en req.user, así que aquí solo
// hay que serializarlo. El método toJSON del modelo User elimina la contraseña.
export const me = async (req, res, next) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/auth/me  { password }
// Borra la cuenta del usuario autenticado y TODOS sus datos (bloque 11b). Requiere
// requireAuth y vuelve a pedir la contraseña: quien encuentre la sesión abierta en un
// dispositivo ajeno no puede borrar la cuenta. Tiene su propio límite de intentos.
export const deleteMe = async (req, res, next) => {
  try {
    const { password } = req.body ?? {};
    if (!password) {
      return res.status(400).json({ error: 'Validation Error', message: 'Escribe tu contraseña' });
    }

    // 403 y no 401: un 401 con token hace que el cliente renueve la sesión y repita la
    // petición, y al volver a fallar cerraría la sesión. Aquí la sesión es válida: lo que
    // falla es la confirmación.
    const isMatch = await req.user.comparePassword(password);
    if (!isMatch) {
      return res.status(403).json({ error: 'Forbidden', message: 'La contraseña no es correcta' });
    }

    const session = await mongoose.startSession();
    let borrados;
    try {
      await session.withTransaction(async () => {
        borrados = await borrarUsuarioYDatos(req.user._id, session);
      });
    } finally {
      await session.endSession();
    }

    // Solo números y el id, nada personal: sirve para comprobar en los logs que se borró todo.
    console.log(`Cuenta ${req.user._id} borrada:`, JSON.stringify(borrados));
    quitarCookieRenovacion(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
