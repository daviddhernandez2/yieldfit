import mongoose from 'mongoose';
import Session from '../models/Session.js';
import Exercise from '../models/Exercise.js';
import Workout from '../models/Workout.js';
import { mejor1RMDeEjercicio } from '../utils/unaRM.js';

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
    const sets = ejInput.sets || [];
    return {
      exerciseId: ejInput.exerciseId,
      nombreSnapshot: exercise.nombre,
      trackingSnapshot: exercise.tracking,
      descansoSegundos: ejInput.descansoSegundos,
      orden: index,
      mejor1RM: mejor1RMDeEjercicio({ trackingSnapshot: exercise.tracking, sets }),
      sets,
    };
  });
};

const LIMITE_POR_DEFECTO = 20;
const LIMITE_MAXIMO = 50;

// El cursor señala la última sesión ya enviada: "<fecha ISO>_<id>". Devuelve
// { fecha, id }, o null si no tiene ese formato.
const leerCursor = (cursor) => {
  const separador = cursor.lastIndexOf('_');
  const fecha = new Date(cursor.slice(0, separador));
  const id = cursor.slice(separador + 1);
  if (separador < 1 || Number.isNaN(fecha.getTime()) || !mongoose.isValidObjectId(id)) return null;
  return { fecha, id: new mongoose.Types.ObjectId(id) };
};

// GET /api/sessions?cursor=…&limite=…
// Sesiones del usuario de la más reciente a la más antigua, de `limite` en `limite`
// (20 por defecto, 50 como máximo). Devuelve { sessions, siguienteCursor }: para la
// página siguiente se repite la petición con ese cursor; null significa que no hay más.
//
// Paginación por cursor y no por número de página (DECISIONS.md, 0027): si se guarda
// una sesión mientras el usuario está en el Historial, con páginas se repetiría una
// sesión al pasar de página; con el cursor ("las anteriores a esta") no. Y usa el
// índice { userId, fecha } directamente, sin saltarse documentos.
export const list = async (req, res, next) => {
  try {
    const limite = req.query.limite === undefined ? LIMITE_POR_DEFECTO : Number(req.query.limite);
    if (!Number.isInteger(limite) || limite < 1 || limite > LIMITE_MAXIMO) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `limite tiene que ser un número entero entre 1 y ${LIMITE_MAXIMO}`,
      });
    }

    const filtro = { userId: req.user._id };
    if (req.query.cursor !== undefined) {
      const cursor = leerCursor(String(req.query.cursor));
      if (!cursor) {
        return res.status(400).json({ error: 'Validation Error', message: 'cursor no válido' });
      }
      // "Anteriores a la última enviada". Dos sesiones pueden tener la misma fecha: en
      // ese caso desempata el _id, que también entra en el orden.
      filtro.$or = [
        { fecha: { $lt: cursor.fecha } },
        { fecha: cursor.fecha, _id: { $lt: cursor.id } },
      ];
    }

    // Se pide una de más para saber si hay otra página sin hacer un count aparte.
    const encontradas = await Session.find(filtro)
      .sort({ fecha: -1, _id: -1 })
      .limit(limite + 1);
    const sessions = encontradas.slice(0, limite);
    const ultima = sessions.at(-1);
    const siguienteCursor =
      encontradas.length > limite ? `${ultima.fecha.toISOString()}_${ultima._id}` : null;

    res.status(200).json({ sessions, siguienteCursor });
  } catch (error) {
    next(error);
  }
};

const MAX_DIAS_CALENDARIO = 366;

// ¿Es una zona horaria IANA válida ("Europe/Madrid")? Intl lanza un error si no.
const zonaValida = (zona) => {
  try {
    new Intl.DateTimeFormat('es-ES', { timeZone: zona });
    return true;
  } catch {
    return false;
  }
};

// GET /api/sessions/days?desde=…&hasta=…&zona=Europe/Madrid
// Días entrenados en un rango, para el calendario (bloque 8, DECISIONS.md 0033). Solo
// devuelve el día y el id y nombre de cada sesión, nunca las series:
//   { dias: [{ dia: '2026-11-03', sesiones: [{ _id, nombre }] }] }
// `desde` entra en el rango y `hasta` no (como un mes: del día 1 al día 1 del siguiente).
//
// Zona horaria: las fechas se guardan en UTC. Una sesión a las 00:30 en Madrid es el día
// anterior en UTC, así que se agrupa por el día en la zona del usuario (la envía el
// cliente; sin ella, UTC). El rango está limitado a un año: la respuesta no crece con el
// historial (0015).
export const days = async (req, res, next) => {
  try {
    const desde = new Date(req.query.desde);
    const hasta = new Date(req.query.hasta);
    const zona = req.query.zona ?? 'UTC';
    const dias = (hasta - desde) / (24 * 60 * 60 * 1000);
    if (Number.isNaN(dias) || dias <= 0 || dias > MAX_DIAS_CALENDARIO) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `desde y hasta tienen que ser fechas válidas, con hasta posterior y como mucho ${MAX_DIAS_CALENDARIO} días después`,
      });
    }
    if (!zonaValida(zona)) {
      return res.status(400).json({ error: 'Validation Error', message: 'zona horaria no válida' });
    }

    // Usa el índice { userId, fecha }. $dateToString convierte cada fecha al día en la zona
    // del usuario, y $group junta las sesiones de un mismo día.
    const resultado = await Session.aggregate([
      { $match: { userId: req.user._id, fecha: { $gte: desde, $lt: hasta } } },
      { $sort: { fecha: 1 } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$fecha', timezone: zona } },
          sesiones: { $push: { _id: '$_id', nombre: '$nombre' } },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, dia: '$_id', sesiones: 1 } },
    ]);

    res.status(200).json({ dias: resultado });
  } catch (error) {
    next(error);
  }
};

const MAX_EJERCICIOS_ANTERIORES = 30;

// GET /api/sessions/previous-sets?exerciseIds=a,b,c
// Para cada ejercicio, las series de la ÚLTIMA sesión guardada que lo incluye, en
// cualquier rutina (DECISIONS.md, 0029). La sesión activa lo pide al abrirse para
// mostrar en cada serie lo que se hizo la vez anterior.
// Devuelve { anteriores: { <exerciseId>: { fecha, sets } } }; los ejercicios que no se
// han hecho nunca no aparecen. Solo busca en las sesiones del usuario: un id ajeno
// simplemente no encuentra nada.
export const previousSets = async (req, res, next) => {
  try {
    const ids = [...new Set(String(req.query.exerciseIds ?? '').split(',').filter(Boolean))];
    if (
      ids.length === 0 ||
      ids.length > MAX_EJERCICIOS_ANTERIORES ||
      !ids.every((id) => mongoose.isValidObjectId(id))
    ) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `exerciseIds tiene que ser una lista de 1 a ${MAX_EJERCICIOS_ANTERIORES} ids separados por comas`,
      });
    }

    // Una consulta por ejercicio, en paralelo. Cada una usa el índice
    // { userId, ejercicios.exerciseId, fecha } y lee un solo documento. $elemMatch en la
    // proyección devuelve solo ese ejercicio de la sesión, no los demás.
    const ultimas = await Promise.all(
      ids.map((id) =>
        Session.findOne(
          { userId: req.user._id, 'ejercicios.exerciseId': id },
          { fecha: 1, ejercicios: { $elemMatch: { exerciseId: id } } }
        )
          .sort({ fecha: -1 })
          .lean()
      )
    );

    const anteriores = {};
    ultimas.forEach((sesion, i) => {
      if (!sesion) return;
      anteriores[ids[i]] = {
        fecha: sesion.fecha,
        sets: sesion.ejercicios[0].sets.map(({ numeroSerie, peso, reps, tiempoSegundos, distanciaMetros }) => ({
          numeroSerie,
          peso,
          reps,
          tiempoSegundos,
          distanciaMetros,
        })),
      };
    });

    res.status(200).json({ anteriores });
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