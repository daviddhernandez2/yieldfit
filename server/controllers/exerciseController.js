import Exercise from '../models/Exercise.js';

// GET /api/exercises
// Lista los ejercicios del usuario autenticado.
// Admite filtros opcionales por query string: grupoMuscular, tipo, search (por nombre).
export const list = async (req, res, next) => {
  try {
    // Filtro base: solo ejercicios del usuario actual. Esto garantiza ownership.
    const filter = { userId: req.user._id };

    // Filtros opcionales recibidos en la URL como query params.
    if (req.query.grupoMuscular) {
      filter.grupoMuscular = req.query.grupoMuscular;
    }
    if (req.query.tipo) {
      filter.tipo = req.query.tipo;
    }
    if (req.query.search) {
      // Búsqueda por nombre case-insensitive con regex.
      // El método escape garantiza que caracteres especiales del usuario
      // no se interpreten como sintaxis de regex.
      const safeSearch = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.nombre = { $regex: safeSearch, $options: 'i' };
    }

    // Orden alfabético por defecto. El frontend puede reordenar localmente si lo necesita.
    const exercises = await Exercise.find(filter).sort({ nombre: 1 });

    res.status(200).json({ exercises });
  } catch (error) {
    next(error);
  }
};

// GET /api/exercises/:id
// Devuelve un ejercicio concreto del usuario autenticado.
// Si el ejercicio no existe o pertenece a otro usuario, devolvemos 404
// (en lugar de 403) para no revelar la existencia de IDs ajenos.
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
    // CastError de Mongoose: el id de la URL no tiene formato ObjectId válido.
    // También devolvemos 404 para mantener coherencia y no filtrar información.
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
// Crea un nuevo ejercicio en el catálogo del usuario.
// El campo tracking se deriva automáticamente del middleware pre('save').
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
// Actualiza un ejercicio del usuario. Solo se modifican los campos enviados.
// Si la actualización afecta a grupoMuscular o tipo, el middleware recalcula tracking.
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

    // Solo actualizamos los campos enviados. El resto permanece intacto.
    // No usamos findOneAndUpdate porque queremos que se ejecuten los
    // middlewares pre('save') del modelo (en concreto, la derivación de tracking).
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
// Borra un ejercicio del catálogo del usuario.
// Las sesiones que lo referencien mantienen sus datos gracias a los snapshots
// (nombreSnapshot y trackingSnapshot) que guarda el modelo Session.
export const remove = async (req, res, next) => {
  try {
    const result = await Exercise.deleteOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    // deletedCount es 0 si el ejercicio no existía o pertenecía a otro usuario.
    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Ejercicio no encontrado',
      });
    }

    // 204 No Content: borrado correcto sin cuerpo de respuesta.
    // Es la convención REST para deletes exitosos.
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