import mongoose from 'mongoose';
import Session from '../models/Session.js';
import Exercise from '../models/Exercise.js';
import Workout from '../models/Workout.js';
import { mejor1RMDeEjercicio } from '../utils/unaRM.js';
import { evaluarEjercicioEnSesion, recalcularRecords } from '../utils/records.js';
import { zonaValida } from '../utils/zona.js';

// Verifica que el workoutId (si viene) pertenezca al usuario.
const verificarOwnershipDeWorkout = async (workoutId, userId) => {
  if (!workoutId) return true;
  const count = await Workout.countDocuments({ _id: workoutId, userId });
  return count === 1;
};

// Construye los subdocumentos sessionExercise rellenando los snapshots
// (nombre y tracking) leídos del estado actual de cada Exercise referenciado.
// Devuelve { ejercicios, records }, donde records es la marca actual de cada ejercicio
// (Map id → record1RM o null) para decidir los récords sin otra consulta.
// Devuelve null si alguno de los exerciseId es ajeno o inexistente.
const construirEjerciciosConSnapshots = async (ejerciciosInput, userId) => {
  if (!ejerciciosInput || ejerciciosInput.length === 0) {
    return { ejercicios: [], records: new Map() };
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
  // Solo se copian los campos conocidos: esPR y prAnterior los decide el servidor, nunca
  // el cliente.
  const ejercicios = ejerciciosInput.map((ejInput, index) => {
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
  const records = new Map(
    ejerciciosDelUsuario.map((ex) => [String(ex._id), ex.record1RM ?? null])
  );
  return { ejercicios, records };
};

// Marca los récords de una sesión NUEVA comparando con la marca guardada de cada ejercicio
// (utils/records.js). Modifica `ejercicios` (añade esPR y prAnterior) y devuelve las marcas
// nuevas que hay que guardar en los ejercicios: Map id → record1RM.
// `excluidos`: ejercicios con fecha atrasada, que se recalculan enteros aparte.
const marcarRecordsNuevos = (ejercicios, records, excluidos) => {
  const nuevos = new Map();
  for (const id of new Set(ejercicios.map((ej) => String(ej.exerciseId)))) {
    if (excluidos.has(id)) continue;
    const anterior = records.get(id) ?? null;
    const { record, indicePR, prAnterior } = evaluarEjercicioEnSesion(anterior, ejercicios, id);
    if (indicePR !== null) {
      ejercicios[indicePR].esPR = true;
      ejercicios[indicePR].prAnterior = prAnterior;
    }
    if (record !== anterior) nuevos.set(id, record);
  }
  return nuevos;
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
          // Lo justo para el calendario (bloque 8b): la hora sale de `fecha` y el número de
          // ejercicios se cuenta aquí ($size), sin traer los ejercicios ni sus series. Son
          // unos 120 bytes por sesión: un año entero sigue siendo una respuesta pequeña.
          sesiones: {
            $push: {
              _id: '$_id',
              nombre: '$nombre',
              fecha: '$fecha',
              duracionSegundos: '$duracionSegundos',
              numEjercicios: { $size: { $ifNull: ['$ejercicios', []] } },
              // ¿Algún ejercicio de la sesión fue récord? (bloque 4b). '$ejercicios.esPR' da la
              // lista de los esPR que existen (solo los récords lo tienen): un booleano, no la lista.
              tienePR: { $in: [true, { $ifNull: ['$ejercicios.esPR', []] }] },
            },
          },
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

const LIMITE_RECORDS = 5;
const MAX_RECORDS = 20;

// GET /api/sessions/records?limite=5
// Los récords personales más recientes (widget "Nuevos récords" del Dashboard, bloque 9d), del
// más nuevo al más antiguo: { records: [{ sessionId, fecha, exerciseId, nombre, anterior,
// nuevo }] }, con el 1RM estimado anterior y el nuevo (bloque 4b).
//
// No crece con el historial: el índice parcial { userId, 'ejercicios.esPR', fecha } solo tiene
// las sesiones con algún récord, y se leen como mucho `limite` sesiones (sin series).
export const records = async (req, res, next) => {
  try {
    const limite = req.query.limite === undefined ? LIMITE_RECORDS : Number(req.query.limite);
    if (!Number.isInteger(limite) || limite < 1 || limite > MAX_RECORDS) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `limite tiene que ser un número entero entre 1 y ${MAX_RECORDS}`,
      });
    }
    const sesiones = await Session.find(
      { userId: req.user._id, 'ejercicios.esPR': true },
      {
        fecha: 1,
        'ejercicios.exerciseId': 1,
        'ejercicios.nombreSnapshot': 1,
        'ejercicios.esPR': 1,
        'ejercicios.prAnterior': 1,
        'ejercicios.mejor1RM': 1,
      }
    )
      .sort({ fecha: -1 })
      .limit(limite)
      .lean();

    // Una sesión puede tener varios récords: se aplanan y se recortan al límite.
    const lista = sesiones
      .flatMap((s) =>
        s.ejercicios
          .filter((ej) => ej.esPR)
          .map((ej) => ({
            sessionId: s._id,
            fecha: s.fecha,
            exerciseId: ej.exerciseId,
            nombre: ej.nombreSnapshot,
            anterior: ej.prAnterior,
            nuevo: ej.mejor1RM,
          }))
      )
      .slice(0, limite);
    res.status(200).json({ records: lista });
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
    const { workoutId, nombre, fecha, duracionSegundos, notas, ejercicios = [] } = req.body;

    const workoutOk = await verificarOwnershipDeWorkout(workoutId, req.user._id);
    if (!workoutOk) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'La rutina indicada no existe o no pertenece al usuario',
      });
    }

    const construidos = await construirEjerciciosConSnapshots(ejercicios, req.user._id);
    if (construidos === null) {
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
      // Una nota vacía o solo con espacios no se guarda: así "tiene nota" es simplemente que
      // exista el campo (el Historial y "la última vez" lo usan). Si no es texto, se deja
      // tal cual para que la validación del modelo responda 400.
      notas: typeof notas === 'string' ? notas.trim() || undefined : notas,
      ejercicios: construidos.ejercicios,
    });
    // Se valida antes de usar session.fecha en la consulta de abajo: una fecha no válida
    // responde 400 (ValidationError, en el catch) en lugar de consultar con undefined.
    await session.validate();

    // Récords (bloque 4b). Lo normal es que la sesión sea la más reciente de sus ejercicios,
    // y basta con compararla con la marca guardada (record1RM). Si ya hay una sesión POSTERIOR
    // de alguno de ellos (una sesión guardada con fecha atrasada: hoy la app no lo hace, pero
    // podría pasar con la app del iPhone sin conexión), comparar con la marca no vale: ese
    // ejercicio se recalcula entero. La consulta usa el índice
    // { userId, 'ejercicios.exerciseId', fecha } y normalmente no encuentra nada.
    const ids1RM = [
      ...new Set(
        construidos.ejercicios
          .filter((ej) => ej.trackingSnapshot === '1RM')
          .map((ej) => String(ej.exerciseId))
      ),
    ];
    const conPosteriores = ids1RM.length
      ? await Session.distinct('ejercicios.exerciseId', {
          userId: req.user._id,
          'ejercicios.exerciseId': { $in: ids1RM },
          fecha: { $gt: session.fecha },
        })
      : [];
    // distinct devuelve TODOS los ejercicios de esas sesiones: solo interesan los de esta.
    const atrasados = new Set(conPosteriores.map(String).filter((id) => ids1RM.includes(id)));

    // El guardado de la sesión y de las marcas, todo o nada: si fallara a mitad, una marca
    // podría subir sin que existiera la sesión que la batió. withTransaction puede repetir la
    // función ante errores transitorios: por eso las marcas se recalculan dentro.
    // Si dos sesiones del mismo ejercicio se guardaran a la vez, las dos compararían con la
    // misma marca; $max deja bien record1RM y `npm run migrar:pr` corregiría las marcas de
    // las sesiones. Con un usuario por cuenta no ocurre en la práctica.
    const transaccion = await mongoose.startSession();
    try {
      await transaccion.withTransaction(async () => {
        for (const ej of session.ejercicios) {
          ej.esPR = undefined;
          ej.prAnterior = undefined;
        }
        const nuevos = marcarRecordsNuevos(session.ejercicios, construidos.records, atrasados);
        await session.save({ session: transaccion });
        if (nuevos.size) {
          await Exercise.bulkWrite(
            [...nuevos].map(([id, record]) => ({
              updateOne: { filter: { _id: id, userId: req.user._id }, update: { $max: { record1RM: record } } },
            })),
            { session: transaccion }
          );
        }
        if (atrasados.size) {
          await recalcularRecords({
            db: mongoose.connection.db,
            userId: req.user._id,
            exerciseIds: [...atrasados],
            session: transaccion,
          });
        }
      });
    } finally {
      await transaccion.endSession();
    }

    // Si se recalcularon ejercicios atrasados, las marcas de esta sesión pueden haber
    // cambiado en la base: se devuelve lo guardado.
    const guardada = atrasados.size ? await Session.findById(session._id) : session;
    res.status(201).json({ session: guardada });
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
// Borra una sesión del usuario. Nadie más la referencia, pero sí afecta a los récords
// (bloque 4b): si la sesión borrada tenía la marca de un ejercicio, o era un error (500 kg en
// vez de 50), los récords posteriores de ese ejercicio cambian. Por eso, en la misma
// transacción, se recalculan los récords de sus ejercicios de fuerza (decisión de David:
// opción b de la 0051). Cuesta leer el historial de esos ejercicios (sin series), pero borrar
// una sesión es raro.
export const remove = async (req, res, next) => {
  const transaccion = await mongoose.startSession();
  try {
    let encontrada = false;
    await transaccion.withTransaction(async () => {
      const borrada = await Session.findOneAndDelete(
        { _id: req.params.id, userId: req.user._id },
        { session: transaccion, projection: { 'ejercicios.exerciseId': 1, 'ejercicios.trackingSnapshot': 1 } }
      );
      encontrada = Boolean(borrada);
      if (!borrada) return;

      const ids1RM = borrada.ejercicios
        .filter((ej) => ej.trackingSnapshot === '1RM')
        .map((ej) => ej.exerciseId);
      if (ids1RM.length) {
        await recalcularRecords({
          db: mongoose.connection.db,
          userId: req.user._id,
          exerciseIds: ids1RM,
          session: transaccion,
        });
      }
    });

    if (!encontrada) {
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
  } finally {
    await transaccion.endSession();
  }
};
