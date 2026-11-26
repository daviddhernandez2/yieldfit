import Exercise from '../models/Exercise.js';
import Session from '../models/Session.js';
import EmparejamientoImport from '../models/EmparejamientoImport.js';
import { ORIGEN_STRONG } from '../data/importacion.js';
import { agruparSesiones, ErrorImportacion, leerCsvStrong, UNIDADES } from '../utils/importarStrong.js';
import { montarVistaPrevia, rangoParaCoincidencias } from '../utils/vistaPreviaStrong.js';
import { zonaValida } from '../utils/zona.js';

// Importar el historial de Strong (bloque 7b). El CSV llega como texto dentro del JSON (el
// cliente lo lee con FileReader) y nunca se guarda: se lee, se usa y se descarta.

// Tamaño máximo del CSV (decisión de David: 10 MB). La ruta acepta un JSON algo mayor (app.js)
// porque al ir dentro de un JSON el texto crece con los escapes (\" y \n); el límite de verdad
// es este, sobre el propio CSV, para que el mensaje hable del archivo y no de la petición.
export const MAX_BYTES_CSV = 10 * 1024 * 1024;

// Lo común a la vista previa y a la importación: comprueba el cuerpo y lee el CSV. Lanza
// ErrorImportacion (400) o un error 413 con un mensaje para el usuario.
const leerPeticion = (body) => {
  const { csv, zona, unidad = 'kg' } = body ?? {};
  if (typeof csv !== 'string') throw new ErrorImportacion('Falta el archivo CSV');
  if (Buffer.byteLength(csv, 'utf8') > MAX_BYTES_CSV) {
    const error = new Error('El archivo pasa de 10 MB. Exporta desde Strong un periodo más corto.');
    error.status = 413;
    throw error;
  }
  if (typeof zona !== 'string' || !zonaValida(zona)) throw new ErrorImportacion('Zona horaria no válida');
  if (!UNIDADES.includes(unidad)) throw new ErrorImportacion('La unidad tiene que ser kg o lb');

  const { idioma, filas } = leerCsvStrong(csv);
  return { zona, unidad, agrupado: agruparSesiones(filas, { unidad, zona, idioma }) };
};

// POST /api/importar/strong/vista-previa   { csv, zona, unidad? }
// Lee el CSV y dice qué pasaría al importarlo, SIN escribir nada: cuántas sesiones son nuevas y
// cuántas ya estaban, la propuesta de emparejamiento de cada ejercicio, los días que coinciden
// con sesiones registradas a mano (decisión B), los errores por fila y los avisos.
// La importación no se fía de esta respuesta: vuelve a leer el CSV (decisión C).
export const vistaPrevia = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { zona, agrupado } = leerPeticion(req.body);
    const claves = agrupado.sesiones.map((s) => s.clave);

    // Las cuatro lecturas no dependen entre sí salvo la última, que necesita las nuevas.
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

    // Sesiones registradas a mano en el rango del CSV (índice { userId, fecha }). Solo nombre y
    // fecha. Crece con lo registrado en la app en esas fechas, no con todo el historial.
    const nuevasClaves = new Set(clavesYaImportadas);
    const rango = rangoParaCoincidencias(agrupado.sesiones.filter((s) => !nuevasClaves.has(s.clave)));
    const sesionesApp = rango
      ? await Session.find(
        { userId, fecha: { $gte: rango.desde, $lte: rango.hasta }, importacion: { $exists: false } },
        { _id: 0, nombre: 1, fecha: 1 }
      ).lean()
      : [];

    const vista = montarVistaPrevia({ agrupado, ejercicios, recordados, clavesYaImportadas, sesionesApp, zona });
    res.json({ vistaPrevia: vista });
  } catch (error) {
    next(error);
  }
};
