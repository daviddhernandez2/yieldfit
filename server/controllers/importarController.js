import mongoose from 'mongoose';
import Exercise from '../models/Exercise.js';
import Session from '../models/Session.js';
import Workout from '../models/Workout.js';
import EmparejamientoImport from '../models/EmparejamientoImport.js';
import { ORIGEN_STRONG } from '../data/importacion.js';
import { agruparSesiones, ErrorImportacion, leerCsvStrong, UNIDADES } from '../utils/importarStrong.js';
import { resumirEjercicios } from '../utils/emparejarStrong.js';
import { buscarCoincidencias, montarVistaPrevia, rangoParaCoincidencias, separarYaImportadas } from '../utils/vistaPreviaStrong.js';
import { construirSesiones, validarDecisiones } from '../utils/construirImportacion.js';
import { recalcularRecords } from '../utils/records.js';
import { zonaValida } from '../utils/zona.js';
import { ocupar, responderOcupado } from '../utils/operacionPesada.js';

// Importar el historial de Strong (bloque 7b). El CSV llega como texto dentro del JSON (el
// cliente lo lee con FileReader) y nunca se guarda: se lee, se usa y se descarta.

// Tamaño máximo del CSV (decisión de David: 5 MB; cinco años a su ritmo son unos 2,7 MB). Empezó
// en 10 MB y se bajó al medir la memoria (ver importar). La ruta acepta un JSON algo mayor (app.js)
// porque al ir dentro de un JSON el texto crece con los escapes (\" y \n); el límite de verdad
// es este, sobre el propio CSV, para que el mensaje hable del archivo y no de la petición.
export const MAX_BYTES_CSV = 5 * 1024 * 1024;

// Lo común a la vista previa y a la importación: comprueba el cuerpo y lee el CSV. Lanza
// ErrorImportacion (400) o un error 413 con un mensaje para el usuario.
const leerPeticion = (body) => {
  const { csv, zona, unidad = 'kg' } = body ?? {};
  if (typeof csv !== 'string') throw new ErrorImportacion('Falta el archivo CSV');
  if (Buffer.byteLength(csv, 'utf8') > MAX_BYTES_CSV) {
    const error = new Error('El archivo pasa de 5 MB. Exporta desde Strong un periodo más corto.');
    error.status = 413;
    throw error;
  }
  if (typeof zona !== 'string' || !zonaValida(zona)) throw new ErrorImportacion('Zona horaria no válida');
  if (!UNIDADES.includes(unidad)) throw new ErrorImportacion('La unidad tiene que ser kg o lb');

  const { idioma, filas } = leerCsvStrong(csv);
  return { zona, unidad, agrupado: agruparSesiones(filas, { unidad, zona, idioma }) };
};

// Sesiones que se guardan en cada insertMany de la importación (ver importar).
const TANDA_SESIONES = 250;

// Memoria del proceso (RSS) durante una importación, para el log: la de al empezar, la máxima
// (muestreada cada 100 ms, porque el pico puede llegar y pasar entre el principio y el final) y la
// del final. Render free tiene 512 MB. El cuerpo de la petición (el CSV dentro del JSON) ya está
// leído al empezar: express.json() lo lee antes del controlador.
const MB = 1024 * 1024;
const medirMemoria = () => {
  const inicio = process.memoryUsage().rss;
  let maxima = inicio;
  const muestreo = setInterval(() => {
    maxima = Math.max(maxima, process.memoryUsage().rss);
  }, 100);
  return () => {
    clearInterval(muestreo);
    const final = process.memoryUsage().rss;
    maxima = Math.max(maxima, final);
    return `memoria ${Math.round(inicio / MB)} → máx. ${Math.round(maxima / MB)} → ${Math.round(final / MB)} MB`;
  };
};

// Las sesiones de un lote. El $type junto a la igualdad no sobra: sin él, MongoDB no usa el índice
// parcial importacion_lote y recorre todas las sesiones del usuario (ver models/Session.js).
const filtroLote = (userId, lote) => ({ userId, 'importacion.lote': { $eq: lote, $type: 'objectId' } });

// Lo que la vista previa y la importación leen de la base, con las mismas consultas para que las
// dos decidan lo mismo: los ejercicios y emparejamientos del usuario, las claves de este CSV que
// ya están importadas y las sesiones registradas a mano en esas fechas.
const leerContexto = async (userId, agrupado) => {
  const claves = agrupado.sesiones.map((s) => s.clave);
  const [ejercicios, recordados, yaImportadas] = await Promise.all([
    Exercise.find({ userId }, { nombre: 1, grupoMuscular: 1, tipo: 1, tracking: 1 }).lean(),
    EmparejamientoImport.find({ userId, origen: ORIGEN_STRONG }, { nombreOrigen: 1, exerciseId: 1 }).lean(),
    // Usa el índice único importacion_unica y solo lee la clave: no trae las sesiones.
    Session.find(
      { userId, 'importacion.origen': ORIGEN_STRONG, 'importacion.clave': { $in: claves } },
      { _id: 0, 'importacion.clave': 1 }
    ).lean(),
  ]);
  const clavesYaImportadas = yaImportadas.map((s) => s.importacion.clave);

  // Sesiones registradas a mano en el rango del CSV, con un día de margen (índice { userId,
  // fecha }). Solo nombre y fecha. Crece con lo registrado en la app en esas fechas, no con todo
  // el historial.
  const rango = rangoParaCoincidencias(separarYaImportadas(agrupado.sesiones, clavesYaImportadas).nuevas);
  const sesionesApp = rango
    ? await Session.find(
      { userId, fecha: { $gte: rango.desde, $lte: rango.hasta }, importacion: { $exists: false } },
      { _id: 0, nombre: 1, fecha: 1 }
    ).lean()
    : [];
  return { ejercicios, recordados, clavesYaImportadas, sesionesApp };
};

// GET /api/importar/opciones
// Lo que el cliente necesita saber antes de enviar nada: el tamaño máximo del archivo (lo
// comprueba antes de mandarlo, sin subir 5 MB para recibir un 413) y las unidades de peso. Es la
// única fuente de verdad de los dos: el cliente no tiene copias (como las opciones de ejercicio).
export const opciones = (req, res) => {
  res.json({ opciones: { maxBytes: MAX_BYTES_CSV, unidades: UNIDADES.map((u) => ({ value: u, label: u })) } });
};

// POST /api/importar/strong/vista-previa   { csv, zona, unidad? }
// Lee el CSV y dice qué pasaría al importarlo, SIN escribir nada: cuántas sesiones son nuevas y
// cuántas ya estaban, la propuesta de emparejamiento de cada ejercicio, los días que coinciden
// con sesiones registradas a mano (decisión B), los errores por fila y los avisos.
// La importación no se fía de esta respuesta: vuelve a leer el CSV (decisión C).
export const vistaPrevia = async (req, res, next) => {
  try {
    const { zona, agrupado } = leerPeticion(req.body);
    const contexto = await leerContexto(req.user._id, agrupado);
    const vista = montarVistaPrevia({ agrupado, zona, ...contexto });
    res.json({ vistaPrevia: vista });
  } catch (error) {
    next(error);
  }
};

// POST /api/importar/strong
//   { csv, zona, unidad, emparejamientos: { nombreStrong: exerciseId },
//     crear: { nombreStrong: { nombre, grupoMuscular, tipo } }, incluirCoincidencias: [clave] }
// Importa de verdad. Vuelve a leer el CSV (decisión C): del cliente solo se usan sus decisiones.
// Se saltan las sesiones ya importadas y, de los días con sesiones registradas a mano (decisión
// B), las que el usuario no haya incluido. Todo en una transacción: o se importa entero o nada.
// Las sesiones llevan el mismo lote, para listarlas y deshacerlas juntas (decisión A).
export const importar = async (req, res, next) => {
  // Una importación o un deshacer a la vez en todo el servidor (utils/operacionPesada.js). Se
  // comprueba lo primero: leer el CSV ya es parte de lo pesado.
  const liberar = ocupar();
  if (!liberar) return responderOcupado(res);
  const t0 = performance.now();
  const memoria = medirMemoria();
  try {
    const userId = req.user._id;
    const { zona, agrupado } = leerPeticion(req.body);
    const { emparejamientos, crear, incluirCoincidencias = [] } = req.body;
    if (!Array.isArray(incluirCoincidencias) || !incluirCoincidencias.every((c) => typeof c === 'string')) {
      throw new ErrorImportacion('incluirCoincidencias tiene que ser una lista de claves');
    }

    const [contexto, rutinas] = await Promise.all([
      leerContexto(userId, agrupado),
      Workout.find({ userId }, { nombre: 1 }).lean(),
    ]);
    const { nuevas, yaImportadas } = separarYaImportadas(agrupado.sesiones, contexto.clavesYaImportadas);
    const incluir = new Set(incluirCoincidencias);
    const saltar = new Set(
      buscarCoincidencias(nuevas, contexto.sesionesApp, zona).map((c) => c.clave).filter((clave) => !incluir.has(clave))
    );
    const aImportar = nuevas.filter((s) => !saltar.has(s.clave));
    if (aImportar.length === 0) throw new ErrorImportacion('No hay sesiones nuevas que importar');

    const { error, asignacion } = validarDecisiones({
      necesarios: resumirEjercicios(aImportar), emparejamientos, crear, ejercicios: contexto.ejercicios,
    });
    if (error) throw new ErrorImportacion(error);

    // Los ejercicios nuevos llevan su _id desde ya: las sesiones los necesitan, y si
    // withTransaction repite la función, se repite con los mismos documentos.
    const porId = new Map(contexto.ejercicios.map((e) => [String(e._id), e]));
    const ejercicioDe = new Map();
    const nuevosEjercicios = [];
    for (const [nombreStrong, decision] of asignacion) {
      if (decision.exerciseId) {
        const e = porId.get(decision.exerciseId);
        ejercicioDe.set(nombreStrong, { _id: e._id, nombre: e.nombre, tracking: e.tracking });
      } else {
        const _id = new mongoose.Types.ObjectId();
        // insertMany no ejecuta pre('save'): el tracking va ya calculado (validarDecisiones). El
        // tipo Cardio está bloqueado en el alta normal hasta el 6b, pero aquí se permite
        // (decisión de David): el bloqueo es porque la sesión activa no sabe registrarlo.
        nuevosEjercicios.push({ _id, userId, ...decision.crear });
        ejercicioDe.set(nombreStrong, { _id, nombre: decision.crear.nombre, tracking: decision.crear.tracking });
      }
    }

    const lote = new mongoose.Types.ObjectId();
    const { documentos, seriesSinDatos, juntados, notasCortadas } = construirSesiones({
      sesiones: aImportar, ejercicioDe, rutinas, userId, lote, origen: ORIGEN_STRONG,
    });

    // Emparejamientos a recordar (todos, también los de ejercicios recién creados). bulkWrite no
    // valida con el modelo, así que cada uno se valida antes (p. ej. un nombre de más de 200).
    const emparejamientosNuevos = [...ejercicioDe].map(([nombreOrigen, e]) => ({ userId, origen: ORIGEN_STRONG, nombreOrigen, exerciseId: e._id }));
    for (const doc of emparejamientosNuevos) {
      const invalido = new EmparejamientoImport(doc).validateSync();
      if (invalido) throw invalido;
    }

    const ids1RM = [...new Set(documentos.flatMap((d) => d.ejercicios.filter((e) => e.trackingSnapshot === '1RM').map((e) => String(e.exerciseId))))];

    // Tiempos para el log (abajo): la transacción tiene un límite de 60 s en MongoDB y el plan
    // del 7b pide vigilarlo. Si withTransaction repite la función, cuenta el último intento.
    const tPreparado = performance.now();
    let msRecords = 0;
    const transaccion = await mongoose.startSession();
    try {
      await transaccion.withTransaction(async () => {
        msRecords = 0;
        if (nuevosEjercicios.length) await Exercise.insertMany(nuevosEjercicios, { session: transaccion });
        await EmparejamientoImport.bulkWrite(
          emparejamientosNuevos.map(({ userId: u, origen, nombreOrigen, exerciseId }) => ({
            updateOne: { filter: { userId: u, origen, nombreOrigen }, update: { $set: { exerciseId } }, upsert: true },
          })),
          { session: transaccion }
        );
        // insertMany valida cada sesión con el modelo (RPE, límites de peso y reps, notas…) y el
        // índice único importacion_unica impide duplicar un entreno aunque llegaran dos
        // importaciones a la vez. Cualquier fallo deshace la transacción entera.
        // En tandas de TANDA_SESIONES, todas dentro de la misma transacción: con un solo
        // insertMany, Mongoose prepara y valida todas las sesiones a la vez, y con un CSV de 10 MB
        // (el límite de entonces; hoy son 5)
        // (1.360 sesiones, 50.000 series) el heap pasaba de 256 MB y el proceso se caía (medido en
        // el 7b; Render free tiene 512 MB en total). El tamaño equilibra memoria y viajes a la base
        // (medido con ese CSV y el heap a 256 MB): 100 → pico de 133 MB y 13,5 s; 250 → 150 MB y
        // 8,5 s; 500 → 214 MB y 5,7 s, demasiado cerca del límite.
        for (let i = 0; i < documentos.length; i += TANDA_SESIONES) {
          await Session.insertMany(documentos.slice(i, i + TANDA_SESIONES), { session: transaccion });
        }
        // Las marcas de todo el historial de esos ejercicios: las sesiones importadas suelen ser
        // anteriores a las de la app, así que pueden cambiar récords ya marcados.
        if (ids1RM.length) {
          const tRecords = performance.now();
          await recalcularRecords({ db: mongoose.connection.db, userId, exerciseIds: ids1RM, session: transaccion });
          msRecords = performance.now() - tRecords;
        }
      });
    } finally {
      await transaccion.endSession();
    }

    const tTransaccion = performance.now();
    const records = await Session.countDocuments({ ...filtroLote(userId, lote), 'ejercicios.esPR': true });
    // Solo recuentos y tiempos, nada del usuario (los logs de Render no deben tener sus datos).
    console.log(
      `Importación de Strong: ${documentos.length} sesiones, ${nuevosEjercicios.length} ejercicios nuevos, ` +
      `${ids1RM.length} con récords · preparar ${Math.round(tPreparado - t0)} ms, ` +
      `transacción ${Math.round(tTransaccion - tPreparado)} ms (récords ${Math.round(msRecords)} ms), ` +
      `total ${Math.round(performance.now() - t0)} ms · ${memoria()}`
    );
    res.status(201).json({
      importacion: {
        lote,
        fecha: lote.getTimestamp(),
        sesiones: documentos.length,
        ejerciciosCreados: nuevosEjercicios.length,
        records,
        yaImportadas,
        saltadas: saltar.size,
        juntados,
        seriesSinDatos,
        notasCortadas,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Datos no válidos',
        details: Object.values(error.errors).map((e) => e.message),
      });
    }
    // Dos importaciones del mismo archivo a la vez: la segunda choca con el índice único.
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Conflict', message: 'Alguno de estos entrenos se acaba de importar. Vuelve a abrir la vista previa.' });
    }
    next(error);
  } finally {
    memoria(); // para el muestreo también si ha fallado (si no, el intervalo seguiría vivo)
    liberar(); // siempre, haya ido bien o mal: si no, nadie más podría importar hasta reiniciar
  }
};

// Lotes que se listan como mucho. Cada importación es un lote; nadie importa 50 veces, pero así
// la respuesta no crece sin límite.
const MAX_LOTES = 50;

// GET /api/importar/lotes
// "Importaciones anteriores" (decisión A): cada lote con su fecha y cuántas sesiones le quedan.
// Sale entero del índice parcial importacion_lote, sin leer las sesiones (medido con explain): por
// eso el filtro es $type y no $exists (ver models/Session.js), y la fecha de la importación se
// saca del propio ObjectId del lote, que lleva dentro el momento en que se creó.
export const listarLotes = async (req, res, next) => {
  try {
    const grupos = await Session.aggregate([
      { $match: { userId: req.user._id, 'importacion.lote': { $type: 'objectId' } } },
      { $group: { _id: '$importacion.lote', sesiones: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: MAX_LOTES },
    ]);
    res.json({ lotes: grupos.map((g) => ({ lote: g._id, fecha: g._id.getTimestamp(), sesiones: g.sesiones })) });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/importar/lotes/:lote
// "Deshacer esta importación" (decisión A): borra las sesiones de ese lote y recalcula los récords
// de sus ejercicios de fuerza, todo en una transacción (si fallara a mitad, quedarían marcas de
// sesiones que ya no existen). Los ejercicios creados al importar y los emparejamientos se
// quedan: si se vuelve a importar, se recuerdan.
export const deshacerLote = async (req, res, next) => {
  const t0 = performance.now();
  const userId = req.user._id;
  if (!mongoose.Types.ObjectId.isValid(req.params.lote)) {
    return res.status(404).json({ error: 'Not Found', message: 'Importación no encontrada' });
  }
  const lote = new mongoose.Types.ObjectId(req.params.lote);
  const filtro = filtroLote(userId, lote);

  // El mismo turno que importar: el recálculo de récords también es pesado.
  const liberar = ocupar();
  if (!liberar) return responderOcupado(res);
  let transaccion;
  try {
    transaccion = await mongoose.startSession();
    let borradas = 0;
    let ids1RM = [];
    let msRecords = 0;
    await transaccion.withTransaction(async () => {
      msRecords = 0;
      // Los ejercicios de esas sesiones (distinct usa el índice del lote) que siguen existiendo
      // y son de fuerza: los borrados no tienen récord que recalcular, y el cardio no tiene 1RM.
      const ids = await Session.distinct('ejercicios.exerciseId', filtro, { session: transaccion });
      ids1RM = (await Exercise.find({ _id: { $in: ids }, userId, tracking: '1RM' }, { _id: 1 }).session(transaccion).lean())
        .map((e) => e._id);
      ({ deletedCount: borradas } = await Session.deleteMany(filtro, { session: transaccion }));
      if (borradas && ids1RM.length) {
        const tRecords = performance.now();
        await recalcularRecords({ db: mongoose.connection.db, userId, exerciseIds: ids1RM, session: transaccion });
        msRecords = performance.now() - tRecords;
      }
    });

    if (!borradas) return res.status(404).json({ error: 'Not Found', message: 'Importación no encontrada' });
    console.log(
      `Importación deshecha: ${borradas} sesiones, ${ids1RM.length} con récords · ` +
      `récords ${Math.round(msRecords)} ms, total ${Math.round(performance.now() - t0)} ms`
    );
    res.json({ deshecha: { lote, sesiones: borradas } });
  } catch (error) {
    next(error);
  } finally {
    await transaccion?.endSession();
    liberar();
  }
};
