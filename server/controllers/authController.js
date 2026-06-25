import User from '../models/User.js';

// POST /api/auth/register
// Crea un nuevo usuario en la base de datos
export const register = async (req, res, next) => {
  try {
    const { email, password, nombreCompleto, fechaNacimiento, peso, altura, genero } = req.body;

    // Comprobar si el email ya está registrado
    const existingUser = await User.findOne({ email: email?.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Ya existe una cuenta con ese email',
      });
    }

    // Crear el usuario (el middleware pre('save') hashea la contraseña)
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

    // Responder con el usuario creado (sin contraseña gracias a toJSON)
    res.status(201).json({
      message: 'Usuario registrado correctamente',
      user,
    });
  } catch (error) {
    // Errores de validación de Mongoose
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