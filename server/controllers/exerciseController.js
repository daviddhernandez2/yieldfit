import mongoose from 'mongoose';
import Exercise from '../models/Exercise.js';
import Workout from '../models/Workout.js';
import Chart from '../models/Chart.js';

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
// Borra un ejercicio de verdad y lo quita de las rutinas y grupos del usuario.
// Las sesiones NO se tocan: conservan el ejercicio con su nombre gracias a los
// snapshots, y es el cálculo de progreso el que ignora los ejercicios borrados
// (ver DECISIONS.md, 0020).
//
// Si el ejercicio es el único de alguna rutina, no se borra nada y se responde 409
// con el nombre de la rutina: el modelo exige al menos un ejercicio por rutina y no
// borramos una rutina que el usuario no ha pedido borrar.
export const remove = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.user._id;
    // Lo que hay que responder se decide dentro de la transacción y se envía fuera.
    let respuesta = { status: 204 };

    // Transacción: borrar el ejercicio y quitarlo de rutinas y grupos ocurre todo o
    // nada. Sin ella, un fallo a mitad podría dejar el ejercicio borrado pero aún
    // dentro de alguna rutina (justo el problema que estamos corrigiendo).
    // withTransaction puede reintentar la función ante errores transitorios, por eso
    // `respuesta` se reasigna en cada camino.
    await session.withTransaction(async () => {
      const exercise = await Exercise.findOne({ _id: req.params.id, userId }).session(session);
      if (!exercise) {
        respuesta = { status: 404, body: { error: 'Not Found', message: 'Ejercicio no encontrado' } };
        return;
      }

      // Rutinas que contienen este ejercicio y NINGÚN otro distinto. No basta con
      // "rutinas de un solo ejercicio": la API permite repetir un ejercicio en una
      // rutina ([X, X]), y al quitar X también se quedaría vacía.
      const rutinasQueQuedarianVacias = await Workout.find(
        {
          userId,
          'ejercicios.exerciseId': exercise._id,
          ejercicios: { $not: { $elemMatch: { exerciseId: { $ne: exercise._id } } } },
        },
        { nombre: 1 }
      ).session(session);

      if (rutinasQueQuedarianVacias.length > 0) {
        const nombres = rutinasQueQuedarianVacias.map((r) => `«${r.nombre}»`);
        const deLasRutinas =
          nombres.length === 1 ? `de la rutina ${nombres[0]}` : `de las rutinas ${nombres.join(', ')}`;
        respuesta = {
          status: 409,
          body: {
            error: 'Conflict',
            message: `«${exercise.nombre}» es el único ejercicio ${deLasRutinas}. Edítala o bórrala primero.`,
          },
        };
        return;
      }

      await Exercise.deleteOne({ _id: exercise._id }, { session });

      // updateMany no pasa las validaciones de Mongoose, pero aquí ya hemos
      // comprobado que ninguna rutina se queda sin ejercicios.
      await Workout.updateMany(
        { userId, 'ejercicios.exerciseId': exercise._id },
        { $pull: { ejercicios: { exerciseId: exercise._id } } },
        { session }
      );

      // Un grupo sí puede quedarse vacío: el modelo Chart lo permite.
      await Chart.updateMany(
        { userId, exerciseIds: exercise._id },
        { $pull: { exerciseIds: exercise._id } },
        { session }
      );

      respuesta = { status: 204 };
    });

    if (respuesta.status === 204) return res.status(204).send();
    return res.status(respuesta.status).json(respuesta.body);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Ejercicio no encontrado',
      });
    }
    next(error);
  } finally {
    await session.endSession();
  }
};
