import Session from '../models/Session.js';
import Exercise from '../models/Exercise.js';
import Workout from '../models/Workout.js';

// Verifica que el workoutId (si viene) pertenezca al usuario.
const verificarOwnershipDeWorkout = async (workoutId, userId) => {
  if (!workoutId) return true;
  const count = await Workout.countDocuments({ _id: workoutId, userId });
  return count === 1;
};

// Construye los subdocumentos sessionExercise rellenando los snapshots
// (nombre y tracking) leídos del estado actual de cada Exercise referenciado.
// Devuelve null si alguno de los exerciseId es ajeno o inexistente.
const construirEjerciciosConSnapshots = async (ejerciciosInput, userId) => {
  if (!ejerciciosInput || ejerciciosInput.length === 0) {
    return [];
  }

  // Recuperamos los ejercicios referenciados en una sola query.
  const exerciseIds = ejerciciosInput.map((e) => e.exerciseId);
  const ejerciciosDelUsuario = await Exercise.find({
    _id: { $in: exerciseIds },
    userId,
  });

  // Validación de ownership: todos los exerciseId deben pertenecer al usuario.
  if (ejerciciosDelUsuario.length !== new Set(exerciseIds.map(String)).size) {
    return null;
  }

  // Indexamos los ejercicios por _id para acceso O(1) al construir snapshots.
  const exercisesById = new Map(
    ejerciciosDelUsuario.map((ex) => [String(ex._id), ex])
  );

  // Construimos el array reasignando orden y rellenando los snapshots
  // a partir del Exercise actual. Los datos de sets (peso, reps...) vienen tal cual.
  return ejerciciosInput.map((ejInput, index) => {
    const exercise = exercisesById.get(String(ejInput.exerciseId));
    return {
      exerciseId: ejInput.exerciseId,
      nombreSnapshot: exercise.nombre,
      trackingSnapshot: exercise.tracking,
      descansoSegundos: ejInput.descansoSegundos,
      orden: index,
      sets: ejInput.sets || [],
    };
  });
};

// GET /api/sessions
// Devuelve las sesiones del usuario, ordenadas por fecha descendente.
// El frontend típicamente pagina o limita esta lista; aquí devolvemos todo.
export const list = async (req, res, next) => {
  try {
    const sessions = await Session.find({ userId: req.user._id }).sort({ fecha: -1 });
    res.status(200).json({ sessions });
  } catch (error) {
    next(error);
  }
};

// GET /api/sessions/:id
// Devuelve una sesión concreta del usuario.
export const getOne = async (req, res, next) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!session) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Sesión no encontrada',
      });
    }

    res.status(200).json({ session });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Sesión no encontrada',
      });
    }
    next(error);
  }
};

// POST /api/sessions
// Crea una nueva sesión. Valida ownership de workoutId (si viene) y de todos los
// exerciseId. Rellena los snapshots (nombre, tracking) leyendo el estado actual
// de cada Exercise. El modelo exige al menos 1 ejercicio.
export const create = async (req, res, next) => {
  try {
    const { workoutId, nombre, fecha, duracionSegundos, ejercicios = [] } = req.body;

    const workoutOk = await verificarOwnershipDeWorkout(workoutId, req.user._id);
    if (!workoutOk) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'La rutina indicada no existe o no pertenece al usuario',
      });
    }

    const ejerciciosConSnapshots = await construirEjerciciosConSnapshots(
      ejercicios,
      req.user._id
    );
    if (ejerciciosConSnapshots === null) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Alguno de los ejercicios no existe o no pertenece al usuario',
      });
    }

    const session = new Session({
      userId: req.user._id,
      workoutId,
      nombre,
      fecha,
      duracionSegundos,
      ejercicios: ejerciciosConSnapshots,
    });
    await session.save();

    res.status(201).json({ session });
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

// PUT /api/sessions/:id
// Actualiza una sesión. Si cambian los ejercicios, se recalculan snapshots con
// el estado actual de los Exercise. Decisión: la edición libre permite corregir
// errores históricos, pero los snapshots se refrescan a "ahora" en cada cambio
// del array ejercicios. Esto es consciente: una edición que modifica los
// ejercicios entiende que el usuario quiere actualizar el registro.
export const update = async (req, res, next) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!session) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Sesión no encontrada',
      });
    }

    const { workoutId, nombre, fecha, duracionSegundos, ejercicios } = req.body;

    if (workoutId !== undefined) {
      const workoutOk = await verificarOwnershipDeWorkout(workoutId, req.user._id);
      if (!workoutOk) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'La rutina indicada no existe o no pertenece al usuario',
        });
      }
      session.workoutId = workoutId;
    }

    if (ejercicios !== undefined) {
      const ejerciciosConSnapshots = await construirEjerciciosConSnapshots(
        ejercicios,
        req.user._id
      );
      if (ejerciciosConSnapshots === null) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Alguno de los ejercicios no existe o no pertenece al usuario',
        });
      }
      session.ejercicios = ejerciciosConSnapshots;
    }

    if (nombre !== undefined) session.nombre = nombre;
    if (fecha !== undefined) session.fecha = fecha;
    if (duracionSegundos !== undefined) session.duracionSegundos = duracionSegundos;

    await session.save();

    res.status(200).json({ session });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Sesión no encontrada',
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

// DELETE /api/sessions/:id
// Borra una sesión del usuario. No tiene efectos en cascada: una sesión no es
// referenciada por nadie más, su borrado es simple.
export const remove = async (req, res, next) => {
  try {
    const result = await Session.deleteOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Sesión no encontrada',
      });
    }

    res.status(204).send();
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Sesión no encontrada',
      });
    }
    next(error);
  }
};