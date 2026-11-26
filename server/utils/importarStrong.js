// Lectura del CSV que exporta Strong (bloque 7b). Solo funciones puras: reciben el texto del
// archivo y devuelven las sesiones ya agrupadas, convertidas y validadas, sin tocar la base de
// datos. Las usan los dos endpoints de la importación: la vista previa y la importación de verdad,
// que vuelve a leer el CSV en vez de fiarse de lo que le manda el cliente (decisión C).
//
// Cómo es el CSV de Strong (exportado desde la app, en español o en inglés):
//   - una fila por serie, y las series de una misma sesión comparten la fecha de inicio;
//   - entre serie y serie, filas "Temporizador de descanso" con el descanso en "Segundos";
//   - fechas de reloj sin zona ("2026-05-16 13:26:22") y duración en texto ("1 h 24 min", "38 s");
//   - el peso en la unidad que tenga el usuario en Strong, sin decir cuál (por eso se pregunta);
//   - el cardio con distancia (km o millas, según esa misma unidad) y tiempo en segundos.
//
// El CSV lo lee csv-parse (comillas, comas dentro de un campo y saltos de línea en las notas): un
// lector propio fallaría justo en esos casos.

import { parse } from 'csv-parse/sync';
import { esRpeValido } from './esfuerzo.js';
import { fechaLocalAUtc } from './zona.js';

export { ORIGEN_STRONG } from '../data/importacion.js';

// Con el límite de 5 MB de la ruta, unas 65.000 filas de Strong (unos 80 bytes por fila). Este
// tope es la segunda barrera: csv-parse deja de leer al llegar a él, sin cargar el resto.
export const LIMITE_FILAS = 75_000;
// Los mismos límites que una sesión guardada desde la app (models/Session.js).
export const MAX_NOTAS = 500;
export const MAX_NOMBRE_SESION = 60;
export const MAX_DESCANSO = 900;
export const MAX_PESO = 1000;
export const MAX_REPS = 1000;
// Cuántos errores de fila se devuelven con detalle: el resto solo se cuenta.
export const MAX_ERRORES_DETALLE = 50;

export const UNIDADES = ['kg', 'lb'];
const KG_POR_LB = 0.45359237;
const METROS_POR_MILLA = 1609.344;

// Cabeceras de Strong en cada idioma. Las columnas se buscan por nombre, no por posición.
const CABECERAS = {
  es: {
    fecha: 'Fecha',
    entrenamiento: 'Nombre de entrenamiento',
    duracion: 'Duración',
    ejercicio: 'Nombre del ejercicio',
    orden: 'Orden de la serie',
    peso: 'Peso',
    reps: 'Rep.',
    distancia: 'Distancia',
    segundos: 'Segundos',
    notas: 'Notas',
    notasEntreno: 'Notas del entrenamiento',
    rpe: 'RPE',
  },
  en: {
    fecha: 'Date',
    entrenamiento: 'Workout Name',
    duracion: 'Duration',
    ejercicio: 'Exercise Name',
    orden: 'Set Order',
    peso: 'Weight',
    reps: 'Reps',
    distancia: 'Distance',
    segundos: 'Seconds',
    notas: 'Notes',
    notasEntreno: 'Workout Notes',
    rpe: 'RPE',
  },
};
// Sin estas columnas no hay nada que importar; el resto puede faltar (exportaciones antiguas).
const OBLIGATORIAS = ['fecha', 'entrenamiento', 'ejercicio', 'orden', 'peso', 'reps'];
// La fila de descanso: lo que pone en "Orden de la serie".
const DESCANSO = { es: 'Temporizador de descanso', en: 'Rest Timer' };

// Un error que invalida el archivo entero (sin cabecera, comillas sin cerrar, demasiado grande).
// Lleva status 400 para que errorHandler lo devuelva tal cual al cliente.
export class ErrorImportacion extends Error {
  constructor(message) {
    super(message);
    this.name = 'ErrorImportacion';
    this.status = 400;
  }
}

// "64.0", "64,5", "" → 64, 64.5, null. Strong usa punto, pero un CSV abierto y guardado con Excel
// en español puede acabar con coma. Devuelve NaN si no es un número.
export const leerNumero = (texto) => {
  const t = String(texto ?? '').trim();
  if (t === '') return null;
  const normal = t.includes('.') ? t : t.replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(normal)) return NaN;
  return Number(normal);
};

// "1 h 24 min", "45 min", "1h 24m", "38 s", "2 h" → segundos; null si no se entiende.
export const leerDuracion = (texto) => {
  const t = String(texto ?? '').trim().toLowerCase();
  if (t === '') return null;
  const m = /^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m(?:in)?)?\s*(?:(\d+)\s*s)?$/.exec(t);
  if (!m || (m[1] === undefined && m[2] === undefined && m[3] === undefined)) return null;
  return (+(m[1] ?? 0)) * 3600 + (+(m[2] ?? 0)) * 60 + (+(m[3] ?? 0));
};

const redondear = (n, decimales) => Math.round(n * 10 ** decimales) / 10 ** decimales;

// El valor que más se repite (el descanso de un ejercicio: Strong guarda uno por serie y casi
// siempre es el mismo). Con empate, el primero que apareció.
const moda = (valores) => {
  const cuenta = new Map();
  for (const v of valores) cuenta.set(v, (cuenta.get(v) ?? 0) + 1);
  let mejor = null;
  for (const [v, n] of cuenta) if (mejor === null || n > cuenta.get(mejor)) mejor = v;
  return mejor;
};

// Junta la nota del entreno y las de cada serie en un texto de 500 caracteres como mucho, una por
// línea: "Serie 3 (Triceps Pushdown): bien". El número es el de la serie en Yield Fit y el nombre,
// el de Strong (si dos ejercicios de Strong se juntan en uno, la serie 1 del segundo pasa a ser la
// 3, y el nombre dice de cuál venía). Devuelve { notas, cortadas }: cortadas = true si no cabía
// todo (la vista previa lo avisa). La usan agruparSesiones (con la numeración de Strong, para la
// vista previa) y construirSesiones (con la definitiva, al importar).
export const juntarNotas = (notaEntreno, notasSerie) => {
  const partes = [];
  if (notaEntreno) partes.push(notaEntreno);
  for (const { ejercicio, numeroSerie, texto } of notasSerie) partes.push(`Serie ${numeroSerie} (${ejercicio}): ${texto}`);
  const completo = partes.join('\n');
  if (completo.length <= MAX_NOTAS) return { notas: completo || null, cortadas: false };
  return { notas: `${completo.slice(0, MAX_NOTAS - 1).trimEnd()}…`, cortadas: true };
};

// Lee el texto del CSV y devuelve el idioma y las filas como objetos con nombres propios
// ({ fila, fecha, entrenamiento, ... }; `fila` es la línea del archivo donde acaba el registro, para
// los mensajes de error: una nota con salto de línea hace que un registro ocupe dos líneas). Lanza ErrorImportacion si el archivo no sirve.
export const leerCsvStrong = (texto, { limiteFilas = LIMITE_FILAS } = {}) => {
  if (typeof texto !== 'string' || texto.trim() === '') throw new ErrorImportacion('El archivo está vacío');

  let registros;
  try {
    registros = parse(texto, {
      bom: true, // Excel y algunas apps lo añaden al principio
      skip_empty_lines: true,
      relax_column_count: true, // una fila corta no tumba el archivo: se valida abajo
      info: true, // da el número de línea de cada registro
      to: limiteFilas + 2, // cabecera + el límite + una más para saber que se ha pasado
    });
  } catch (error) {
    throw new ErrorImportacion(`El archivo no es un CSV válido (línea ${error.lines ?? '?'}): ${error.message}`);
  }
  if (registros.length === 0) throw new ErrorImportacion('El archivo está vacío');

  const cabecera = registros[0].record.map((c) => c.trim());
  const idioma = Object.keys(CABECERAS).find((i) => OBLIGATORIAS.every((campo) => cabecera.includes(CABECERAS[i][campo])));
  if (!idioma) {
    throw new ErrorImportacion('No parece un CSV de Strong: faltan columnas como "Fecha", "Nombre del ejercicio" o "Peso"');
  }
  const posicion = Object.fromEntries(Object.entries(CABECERAS[idioma]).map(([campo, nombre]) => [campo, cabecera.indexOf(nombre)]));

  const datos = registros.slice(1);
  if (datos.length > limiteFilas) {
    throw new ErrorImportacion(`El archivo tiene más de ${limiteFilas.toLocaleString('es-ES')} filas`);
  }
  if (datos.length === 0) throw new ErrorImportacion('El archivo no tiene ningún entreno');

  const filas = datos.map(({ record, info }) => {
    const fila = { fila: info.lines };
    for (const [campo, i] of Object.entries(posicion)) fila[campo] = i >= 0 ? (record[i] ?? '').trim() : '';
    return fila;
  });
  return { idioma, filas };
};

// Agrupa las filas en sesiones y convierte las cifras. `unidad` es la del peso en Strong ('kg' o
// 'lb'); con 'lb' la distancia se entiende en millas. `zona` es la del cliente (ya validada con
// zonaValida): las fechas de Strong son de reloj y se guardan en UTC.
//
// Devuelve:
//   sesiones: [{ clave, fecha, nombre, nombreStrong, duracionSegundos, notaEntreno, notas,
//                notasCortadas, ejercicios: [{ nombreStrong, descansoSegundos, series: [{
//                numeroSerie, peso, reps, tiempoSegundos, distanciaMetros, rpe, nota }] }] }],
//                en orden de fecha. `notas` es la vista previa del texto; al importar se vuelve a
//                montar con notaEntreno y la nota de cada serie, con la numeración definitiva;
//   errores: [{ fila, mensaje }] (como mucho MAX_ERRORES_DETALLE), totalErrores y
//   seriesDescartadas (las series que no entran por un error, sin contar filas de descanso);
//   avisos: recuentos de lo que se ha ajustado sin ser un error.
// `clave` es el texto de la fecha tal cual (decisión del plan: origen + inicio al segundo, sin el
// nombre, para que renombrar el entreno en Strong no lo duplique).
//
// Qué pasa con cada fila rara (las series con error no entran, el resto de la sesión sí):
//   - fecha que no se entiende: error en cada fila de esa sesión, y la sesión no entra;
//   - hora que no existe por el cambio de hora: se mueve a la siguiente válida, con aviso;
//   - peso, reps, distancia o tiempo que no son números o se salen de los límites: error;
//   - serie sin nada (todo a 0): se salta y se cuenta (Strong exporta así algunas series vacías);
//   - RPE fuera de 1–10 o fuera de los pasos de 0,5: se quita el RPE, la serie entra;
//   - nombre del entreno de más de 60 caracteres: se corta.
export const agruparSesiones = (filas, { unidad, zona, idioma = 'es' }) => {
  if (!UNIDADES.includes(unidad)) throw new ErrorImportacion('La unidad tiene que ser kg o lb');
  const etiquetaDescanso = DESCANSO[idioma];
  const factorPeso = unidad === 'lb' ? KG_POR_LB : 1;
  const metrosPorUnidad = unidad === 'lb' ? METROS_POR_MILLA : 1000;

  const errores = [];
  let totalErrores = 0;
  // Series que no entran por un error ("3 series no se importarán" en la vista previa). Las filas
  // de descanso con error no cuentan: no son series.
  let seriesDescartadas = 0;
  const error = (f, mensaje) => {
    totalErrores++;
    if (f.orden !== etiquetaDescanso) seriesDescartadas++;
    if (errores.length < MAX_ERRORES_DETALLE) errores.push({ fila: f.fila, mensaje });
  };
  const avisos = { seriesVacias: 0, rpeQuitados: 0, nombresCortados: 0, notasCortadas: 0, duracionesSinLeer: 0, horasInexistentes: 0 };

  // 1. Agrupar por la fecha de inicio (la clave), en el orden en que aparecen.
  const porClave = new Map();
  for (const f of filas) {
    if (!f.fecha) {
      error(f, 'Fila sin fecha');
      continue;
    }
    if (!porClave.has(f.fecha)) porClave.set(f.fecha, []);
    porClave.get(f.fecha).push(f);
  }

  const sesiones = [];
  for (const [clave, filasSesion] of porClave) {
    const leida = fechaLocalAUtc(clave, zona);
    if (!leida) {
      for (const f of filasSesion) error(f, `Fecha que no se entiende: "${clave}"`);
      continue;
    }
    const { fecha } = leida;
    // Una hora que no existe en la zona (el salto de marzo) se ha movido una hora adelante.
    if (leida.ajuste === 'inexistente') avisos.horasInexistentes++;
    const primera = filasSesion[0];

    // 2. Dentro de la sesión, un grupo por ejercicio (si aparece dos veces, se juntan).
    const porEjercicio = new Map();
    const notaEntreno = filasSesion.find((f) => f.notasEntreno)?.notasEntreno ?? '';
    const notasSerie = [];
    for (const f of filasSesion) {
      if (!f.ejercicio) {
        error(f, 'Fila sin nombre de ejercicio');
        continue;
      }
      if (!porEjercicio.has(f.ejercicio)) porEjercicio.set(f.ejercicio, { nombreStrong: f.ejercicio, descansos: [], series: [] });
      const grupo = porEjercicio.get(f.ejercicio);

      // Fila de descanso: solo aporta el descanso del ejercicio.
      if (f.orden === etiquetaDescanso) {
        const segundos = leerNumero(f.segundos);
        if (Number.isFinite(segundos) && segundos > 0) grupo.descansos.push(Math.min(Math.round(segundos), MAX_DESCANSO));
        continue;
      }

      const peso = leerNumero(f.peso);
      const reps = leerNumero(f.reps);
      const distancia = leerNumero(f.distancia);
      const segundos = leerNumero(f.segundos);
      const malos = [['peso', peso], ['reps', reps], ['distancia', distancia], ['segundos', segundos]]
        .filter(([, v]) => Number.isNaN(v) || (v !== null && v < 0))
        .map(([nombre]) => nombre);
      if (malos.length) {
        error(f, `Valor que no es un número válido en: ${malos.join(', ')}`);
        continue;
      }
      const serie = {
        peso: peso === null ? 0 : redondear(peso * factorPeso, 2),
        reps: reps === null ? 0 : reps,
        tiempoSegundos: segundos === null ? 0 : Math.round(segundos),
        distanciaMetros: distancia === null ? 0 : Math.round(distancia * metrosPorUnidad),
      };
      if (serie.peso > MAX_PESO || serie.reps > MAX_REPS || !Number.isInteger(serie.reps)) {
        error(f, `Serie fuera de los límites (peso hasta ${MAX_PESO} kg, reps enteras hasta ${MAX_REPS})`);
        continue;
      }
      if (serie.peso === 0 && serie.reps === 0 && serie.tiempoSegundos === 0 && serie.distanciaMetros === 0) {
        avisos.seriesVacias++;
        continue;
      }
      const rpe = leerNumero(f.rpe);
      if (rpe !== null) {
        if (esRpeValido(rpe)) serie.rpe = rpe;
        else avisos.rpeQuitados++;
      }
      serie.numeroSerie = grupo.series.length + 1;
      grupo.series.push(serie);
      if (f.notas) {
        serie.nota = f.notas;
        notasSerie.push({ ejercicio: f.ejercicio, numeroSerie: serie.numeroSerie, texto: f.notas });
      }
    }

    const ejercicios = [...porEjercicio.values()]
      .filter((g) => g.series.length > 0)
      .map((g) => ({ nombreStrong: g.nombreStrong, descansoSegundos: moda(g.descansos), series: g.series }));
    if (ejercicios.length === 0) continue; // nada válido en esa sesión: ya se ha contado arriba

    const nombreStrong = primera.entrenamiento || 'Entrenamiento importado';
    const nombre = nombreStrong.slice(0, MAX_NOMBRE_SESION).trim();
    if (nombre.length < nombreStrong.length) avisos.nombresCortados++;
    const duracionSegundos = leerDuracion(primera.duracion);
    if (duracionSegundos === null && primera.duracion) avisos.duracionesSinLeer++;
    const { notas, cortadas } = juntarNotas(notaEntreno, notasSerie);
    if (cortadas) avisos.notasCortadas++;

    sesiones.push({ clave, fecha, nombre, nombreStrong, duracionSegundos, notaEntreno, notas, notasCortadas: cortadas, ejercicios });
  }

  sesiones.sort((a, b) => a.fecha - b.fecha);
  return { sesiones, errores, totalErrores, seriesDescartadas, avisos };
};
