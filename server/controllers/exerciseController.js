import Exercise from '../models/Exercise.js';
import Session from '../models/Session.js';

// GET /api/exercises
// Lista los ejercicios del usuario autenticado.
// Admite filtros opcionales por query string: grupoMuscular, tipo, search (por nombre).
export const list = async (req, res, next) => {
  try {
    const filter = { userId: req.user._id };

    if (req.query.grupoMuscular) {
      filter.grupoMuscular = req.query.grupoMuscular;
    }
    if (req.query.tipo) {
      filter.tipo = req.query.tipo;
    }
    if (req.query.search) {
      // Escapa caracteres especiales para que no se interpreten como regex.
      const safeSearch = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.nombre = { $regex: safeSearch, $options: 'i' };
    }

    const exercises = await Exercise.find(filter).sort({ nombre: 1 });

    res.status(200).json({ exercises });
  } catch (error) {
    next(error);
  }
};

// GET /api/exercises/:id
// Devuelve un ejercicio concreto del usuario autenticado.
// 404 (en lugar de 403) para no revelar la existencia de IDs ajenos.
export const getOne = async (req, res, next) => {
  try {
    const exercise = await Exercise.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!exercise) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Ejercicio no encontrado',
      });
    }

    res.status(200).json({ exercise });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Ejercicio no encontrado',
      });
    }
    next(error);
  }
};

// POST /api/exercises
// Crea un nuevo ejercicio. El tracking se deriva en el middleware pre('save').
export const create = async (req, res, next) => {
  try {
    const { nombre, grupoMuscular, tipo } = req.body;

    const exercise = new Exercise({
      userId: req.user._id,
      nombre,
      grupoMuscular,
      tipo,
    });
    await exercise.save();

    res.status(201).json({ exercise });
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

// PUT /api/exercises/:id
// Actualiza un ejercicio. Si cambian grupoMuscular o tipo, el middleware
// recalcula tracking. Usamos findOne+save() en lugar de findOneAndUpdate
// para garantizar la ejecución del middleware pre('save').
export const update = async (req, res, next) => {
  try {
    const exercise = await Exercise.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!exercise) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Ejercicio no encontrado',
      });
    }

    const { nombre, grupoMuscular, tipo } = req.body;
    if (nombre !== undefined) exercise.nombre = nombre;
    if (grupoMuscular !== undefined) exercise.grupoMuscular = grupoMuscular;
    if (tipo !== undefined) exercise.tipo = tipo;

    await exercise.save();

    res.status(200).json({ exercise });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Ejercicio no encontrado',
      });
    }
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

// DELETE /api/exercises/:id
// Borra un ejercicio y cascada: elimina ese ejercicio de todas las sesiones que
// lo referencien (sin borrar las sesiones enteras). Decisión de producto: si el
// usuario borra un ejercicio, no quiere que aparezca en su progreso histórico.
export const remove = async (req, res, next) => {
  try {
    const result = await Exercise.deleteOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Ejercicio no encontrado',
      });
    }

    // Cascada: quitar el subdocumento del ejercicio de todas las sesiones del usuario.
    // $pull elimina elementos del array que cumplan el filtro.
    await Session.updateMany(
      { userId: req.user._id },
      { $pull: { ejercicios: { exerciseId: req.params.id } } }
    );

    res.status(204).send();
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Ejercicio no encontrado',
      });
    }
    next(error);
  }
};