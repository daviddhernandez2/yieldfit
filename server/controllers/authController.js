import User from '../models/User.js';
import Exercise from '../models/Exercise.js';
import { signToken } from '../utils/jwt.js';
import { exercisePresets } from '../data/exercisePresets.js';

// Deriva el tracking igual que el middleware pre('save') del modelo Exercise
// Lo replicamos aquí porque insertMany NO ejecuta los middlewares de save()
const derivarTracking = (grupoMuscular, tipo) => {
  if (grupoMuscular === 'Cardio' && tipo === 'Cardio') {
    return 'tiempo_distancia';
  }
  return '1RM';
};

// Clona los ejercicios preestablecidos al catálogo del nuevo usuario
// Una sola operación bulk (insertMany) en lugar de 55 saves
const clonarPresetsAUsuario = async (userId) => {
  const documentos = exercisePresets.map((preset) => ({
    userId,
    nombre: preset.nombre,
    grupoMuscular: preset.grupoMuscular,
    tipo: preset.tipo,
    tracking: derivarTracking(preset.grupoMuscular, preset.tipo),
    esPreset: true,
  }));

  await Exercise.insertMany(documentos);
};

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { email, password, nombreCompleto, fechaNacimiento, peso, altura, genero } = req.body;

    const existingUser = await User.findOne({ email: email?.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Ya existe una cuenta con ese email',
      });
    }

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

    // Clonar los ejercicios preestablecidos al catálogo del nuevo usuario
    await clonarPresetsAUsuario(user._id);

    const token = signToken(user._id);

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      token,
      user,
    });
  } catch (error) {
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
export const me = async (req, res, next) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (error) {
    next(error);
  }
};