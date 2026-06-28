import Workout from '../models/Workout.js';
import Exercise from '../models/Exercise.js';

// Comprueba que todos los exerciseIds existan y pertenezcan al usuario.
// Recibe la lista de objetos {exerciseId, numSeries, ...} del workout.
// Extrae los exerciseId únicos y consulta de una vez con countDocuments.
const verificarOwnershipDeEjercicios = async (ejercicios, userId) => {
  if (!ejercicios || ejercicios.length === 0) {
    return true;
  }

  // Usamos Set para deduplicar: si el usuario repite un ejercicio en la rutina
  // (válido), solo necesitamos verificarlo una vez.
  const exerciseIds = [...new Set(ejercicios.map((e) => String(e.exerciseId)))];

  const count = await Exercise.countDocuments({
    _id: { $in: exerciseIds },
    userId,
  });

  return count === exerciseIds.length;
};

// Asigna el campo orden a cada ejercicio según su posición en el array.
// El servidor es la fuente de verdad del orden: ignora lo que envíe el cliente.
const reasignarOrden = (ejercicios) => {
  return ejercicios.map((ej, index) => ({
    ...ej,
    orden: index,
  }));
};

// GET /api/workouts
// Devuelve todas las rutinas del usuario, ordenadas por fecha de creación descendente.
export const list = async (req, res, next) => {
  try {
    const workouts = await Workout.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ workouts });
  } catch (error) {
    next(error);
  }
};

// GET /api/workouts/:id
// Devuelve una rutina concreta del usuario. 404 si no existe o es ajena.
export const getOne = async (req, res, next) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!workout) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Rutina no encontrada',
      });
    }

    res.status(200).json({ workout });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Rutina no encontrada',
      });
    }
    next(error);
  }
};

// POST /api/workouts
// Crea una nueva rutina. Valida ownership de los ejercicios y reasigna el orden.
// El modelo exige al menos 1 ejercicio (validación a nivel de schema).
export const create = async (req, res, next) => {
  try {
    const { nombre, ejercicios = [] } = req.body;

    const ownershipOk = await verificarOwnershipDeEjercicios(ejercicios, req.user._id);
    if (!ownershipOk) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Alguno de los ejercicios no existe o no pertenece al usuario',
      });
    }

    // Reasignamos orden según el índice. Si el cliente envía orden, se sobrescribe.
    const ejerciciosOrdenados = reasignarOrden(ejercicios);

    const workout = new Workout({
      userId: req.user._id,
      nombre,
      ejercicios: ejerciciosOrdenados,
    });
    await workout.save();

    res.status(201).json({ workout });
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

// PUT /api/workouts/:id
// Actualiza una rutina. Si se modifican ejercicios, se revalida ownership y se reasigna orden.
export const update = async (req, res, next) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!workout) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Rutina no encontrada',
      });
    }

    const { nombre, ejercicios } = req.body;

    if (ejercicios !== undefined) {
      const ownershipOk = await verificarOwnershipDeEjercicios(ejercicios, req.user._id);
      if (!ownershipOk) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Alguno de los ejercicios no existe o no pertenece al usuario',
        });
      }
      workout.ejercicios = reasignarOrden(ejercicios);
    }

    if (nombre !== undefined) workout.nombre = nombre;

    await workout.save();

    res.status(200).json({ workout });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Rutina no encontrada',
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

// DELETE /api/workouts/:id
// Borra una rutina del usuario. Las sesiones existentes basadas en ella no se ven
// afectadas porque las sesiones guardan snapshots independientes de la rutina.
export const remove = async (req, res, next) => {
  try {
    const result = await Workout.deleteOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Rutina no encontrada',
      });
    }

    res.status(204).send();
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Rutina no encontrada',
      });
    }
    next(error);
  }
};