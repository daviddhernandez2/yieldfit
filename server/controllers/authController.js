import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { clonarPresetsAUsuario } from '../utils/presets.js';

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

    // El token se emite también en el registro para que el cliente quede logueado
    // automáticamente sin necesidad de una segunda petición a /login.
    const token = signToken(user._id);

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      token,
      user,
    });
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

    const token = signToken(user._id);

    res.status(200).json({
      message: 'Login correcto',
      token,
      user,
    });
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