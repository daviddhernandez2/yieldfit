import mongoose from 'mongoose';
import Exercise, { OPCIONES_GRUPO_MUSCULAR, OPCIONES_TIPO, tipoDisponible } from '../models/Exercise.js';
import Workout from '../models/Workout.js';
import Chart from '../models/Chart.js';
import Dashboard from '../models/Dashboard.js';
import { OPCIONES_ESFUERZO, RPE } from '../utils/esfuerzo.js';

// GET /api/exercises
// Lista los ejercicios del usuario autenticado.
// Admite filtros opcionales por query string: grupoMuscular, tipo, search (por nombre).
// GET /api/exercises/opciones
// Grupos musculares y tipos válidos, con su texto para mostrar. El cliente construye
// con esto los selects, los chips y los filtros, así que no repite las listas.
// Es igual para todos los usuarios y no toca la base de datos.
export const opciones = (req, res) => {
  res.status(200).json({
    // esfuerzo (bloque 5c): las opciones de la preferencia y el rango del RPE, para que el
    // cliente pinte los valores sin copiarlos.
    opciones: {
      gruposMusculares: OPCIONES_GRUPO_MUSCULAR,
      tipos: OPCIONES_TIPO,
      esfuerzo: { opciones: OPCIONES_ESFUERZO, rpe: RPE },
    },
  });
};

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

// 400 para un tipo marcado como no disponible en OPCIONES_TIPO (hoy, Cardio). La guarda
// está aquí y no solo en la interfaz para que no se pueda saltar llamando a la API.
const responderTipoNoDisponible = (res, tipo) =>
  res.status(400).json({
    error: 'Validation Error',
    message: `Los ejercicios de tipo «${tipo}» estarán disponibles próximamente.`,
  });

// POST /api/exercises
// Crea un nuevo ejercicio. El tracking se deriva en el middleware pre('save').
export const create = async (req, res, next) => {
  try {
    const { nombre, grupoMuscular, tipo } = req.body;
    if (!tipoDisponible(tipo)) return responderTipoNoDisponible(res, tipo);

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
    // Solo se rechaza CAMBIAR a un tipo no disponible: un cardio que ya existe se puede
    // renombrar o pasar a otro tipo sin problema.
    if (tipo !== undefined && tipo !== exercise.tipo && !tipoDisponible(tipo)) {
      return responderTipoNoDisponible(res, tipo);
    }
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

      // Y su widget "Récord de un ejercicio" del Dashboard (bloque 9d), si lo tiene.
      await Dashboard.updateOne(
        { userId },
        { $pull: { widgets: { exerciseId: exercise._id } } },
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
