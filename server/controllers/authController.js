import User from '../models/User.js';
import Exercise from '../models/Exercise.js';
import { signToken } from '../utils/jwt.js';
import { exercisePresets } from '../data/exercisePresets.js';

// Replica la lógica del middleware pre('save') del modelo Exercise.
// Es necesario duplicarla porque insertMany NO ejecuta los middlewares
// de documento. Se sacrifica DRY a cambio de poder usar la operación bulk.
const derivarTracking = (grupoMuscular, tipo) => {
  if (grupoMuscular === 'Cardio' && tipo === 'Cardio') {
    return 'tiempo_distancia';
  }
  return '1RM';
};

// Clona el catálogo de ejercicios preset al nuevo usuario en una única
// operación bulk. Más eficiente que recorrer la lista con save() individuales.
const clonarPresetsAUsuario = async (userId) => {
  const documentos = exercisePresets.map((preset) => ({
    userId,
    nombre: preset.nombre,
    grupoMuscular: preset.grupoMuscular,
    tipo: preset.tipo,
    tracking: derivarTracking(preset.grupoMuscular, preset.tipo),
  }));

  await Exercise.insertMany(documentos);
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

    // El middleware pre('save') del modelo User hashea la contraseña automáticamente.
    const user = new User({
      email,
      password,
      nombreCompleto,
      fechaNacimiento,
      peso,
      altura,
      genero,
    });
    await user.save();

    // Una vez creado el usuario, se le copia el catálogo inicial.
    // Si esto fallara, el usuario quedaría creado sin ejercicios. Decisión consciente:
    // no es crítico, podría reintentar el clonado desde un script de mantenimiento.
    await clonarPresetsAUsuario(user._id);

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