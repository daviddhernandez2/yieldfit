import mongoose from 'mongoose';

// Récords personales (PR) del bloque 4b.
//
// Un ejercicio de una sesión es récord cuando su mejor 1RM estimado (`mejor1RM`, utils/unaRM.js)
// supera ESTRICTAMENTE el mejor de todas las sesiones anteriores de ese ejercicio. La primera
// vez no cuenta (no hay nada que superar: solo fija la marca de partida), igualar tampoco, y
// el cardio no tiene 1RM (mejor1RM null), así que nunca es récord.
//
// Qué se guarda (decisión 0051):
//   - En cada ejercicio de la sesión: `esPR: true` y `prAnterior` (la marca que batió) SOLO si
//     fue récord; si no, los campos no existen. Así un documento normal no crece.
//   - En el ejercicio: `record1RM`, la marca actual. Es una COPIA de lo que dicen las sesiones,
//     guardada para no recorrer el historial en cada entreno; se puede reconstruir siempre con
//     recalcularRecords (o `npm run migrar:pr`).
//
// Hay dos piezas:
//   - evaluarEjercicioEnSesion: pura (sin base de datos), con pruebas en records.test.js.
//   - recalcularRecords: recorre el historial de unos ejercicios y corrige lo guardado. La
//     usan el borrado de una sesión, el guardado de una sesión con fecha atrasada, el seed y la
//     migración. Usa el driver de MongoDB y no los modelos, para que los scripts la compartan.

// Dado el récord vigente antes de esta sesión (null si aún no hay marca) y los ejercicios de
// la sesión, decide qué posición del array es récord para `exerciseId`.
// Devuelve { record, indicePR, prAnterior }:
//   - record: la marca después de esta sesión (igual, mayor o la primera).
//   - indicePR: posición en `ejercicios` del récord, o null si no hubo.
//   - prAnterior: la marca que se batió (solo si hubo récord).
// Si el ejercicio sale dos veces en la sesión, solo cuenta la mejor (la primera si empatan).
export const evaluarEjercicioEnSesion = (record, ejercicios, exerciseId) => {
  const id = String(exerciseId);
  let mejor = 0;
  let indiceMejor = null;
  ejercicios.forEach((ej, i) => {
    // `> mejor` deja fuera null (cardio), 0 (series sin peso) y los empates internos.
    if (String(ej.exerciseId) === id && ej.mejor1RM > mejor) {
      mejor = ej.mejor1RM;
      indiceMejor = i;
    }
  });

  if (indiceMejor === null) return { record, indicePR: null };
  if (record === null) return { record: mejor, indicePR: null }; // la primera vez: solo marca
  if (mejor > record) return { record: mejor, indicePR: indiceMejor, prAnterior: record };
  return { record, indicePR: null };
};

// Recorre en orden sesiones de UN ejercicio y devuelve, de cada sesión, qué hay que cambiar
// respecto a lo que tiene guardado, más el récord final. Pura: la usa recalcularRecords con
// las sesiones que lee de la base (de una en una, pasando el récord acumulado en
// `recordInicial`), y las pruebas con sesiones inventadas.
// Cada cambio: { _id, set: { 'ejercicios.2.esPR': true, ... }, unset: { ... } }. Solo aparecen
// las sesiones que cambian: repetir el cálculo sobre datos ya correctos no escribe nada.
export const marcarHistorial = (sesiones, exerciseId, recordInicial = null) => {
  const id = String(exerciseId);
  let record = recordInicial;
  const cambios = [];

  for (const sesion of sesiones) {
    const resultado = evaluarEjercicioEnSesion(record, sesion.ejercicios, id);
    record = resultado.record;

    const set = {};
    const unset = {};
    sesion.ejercicios.forEach((ej, i) => {
      if (String(ej.exerciseId) !== id) return;
      const debeSerPR = i === resultado.indicePR;
      if (debeSerPR && (ej.esPR !== true || ej.prAnterior !== resultado.prAnterior)) {
        set[`ejercicios.${i}.esPR`] = true;
        set[`ejercicios.${i}.prAnterior`] = resultado.prAnterior;
      } else if (!debeSerPR && ('esPR' in ej || 'prAnterior' in ej)) {
        unset[`ejercicios.${i}.esPR`] = '';
        unset[`ejercicios.${i}.prAnterior`] = '';
      }
    });
    if (Object.keys(set).length || Object.keys(unset).length) {
      cambios.push({ _id: sesion._id, set, unset });
    }
  }
  return { cambios, record };
};

const TAMANO_LOTE = 500; // operaciones por bulkWrite

// Vuelve a calcular desde cero los récords de `exerciseIds` del usuario: las marcas de todas
// sus sesiones y el `record1RM` de cada ejercicio. Con `escribir: false` no toca nada y solo
// cuenta (simulación de la migración).
//
// Coste: lee todas las sesiones de cada ejercicio (solo los campos del cálculo, sin series)
// con el índice { userId, 'ejercicios.exerciseId', fecha }. Crece con el historial de ESE
// ejercicio, por eso no se usa al guardar una sesión normal: solo al borrar una, al guardar
// una con fecha atrasada (hoy no ocurre) y en los scripts.
//
// `session` es la transacción (opcional): el borrado de una sesión y el recálculo van juntos.
// Las posiciones del array ('ejercicios.2.esPR') son seguras porque una sesión no se edita
// nunca después de guardarla (no hay PUT).
//
// Devuelve { sesionesCambiadas, records: Map(exerciseId → récord o null) }.
export const recalcularRecords = async ({ db, userId, exerciseIds, session, escribir = true }) => {
  const sesiones = db.collection('sessions');
  const ejercicios = db.collection('exercises');
  let sesionesCambiadas = 0;
  const records = new Map();

  // Sin duplicados y como ObjectId (desde el cliente llegan como texto).
  const ids = [...new Set(exerciseIds.map(String))].map((id) => new mongoose.Types.ObjectId(id));

  for (const exerciseId of ids) {
    // Orden solo por fecha, para que el índice dé el orden sin ordenar en memoria. Dos
    // sesiones del mismo ejercicio en el mismo milisegundo no ocurren en la práctica.
    const cursor = sesiones.find(
      { userId, 'ejercicios.exerciseId': exerciseId },
      {
        sort: { fecha: 1 },
        projection: { ejercicios: { exerciseId: 1, mejor1RM: 1, esPR: 1, prAnterior: 1 } },
        session,
      }
    );

    // marcarHistorial trabaja con un array, pero aquí se va sesión a sesión (cursor) para que
    // la memoria no crezca con el historial: se le pasa cada sesión con el récord acumulado.
    let record = null;
    let lote = [];
    const escribirLote = async () => {
      if (escribir && lote.length) await sesiones.bulkWrite(lote, { ordered: false, session });
      lote = [];
    };

    for await (const sesion of cursor) {
      const resultado = marcarHistorial([sesion], exerciseId, record);
      record = resultado.record;
      for (const { _id, set, unset } of resultado.cambios) {
        sesionesCambiadas++;
        const update = {};
        if (Object.keys(set).length) update.$set = set;
        if (Object.keys(unset).length) update.$unset = unset;
        lote.push({ updateOne: { filter: { _id }, update } });
      }
      if (lote.length >= TAMANO_LOTE) await escribirLote();
    }
    await escribirLote();

    records.set(String(exerciseId), record);
    if (escribir) {
      // Si el ejercicio ya no existe (borrado), no encuentra nada y no pasa nada.
      await ejercicios.updateOne(
        { _id: exerciseId, userId },
        record === null ? { $unset: { record1RM: '' } } : { $set: { record1RM: record } },
        { session }
      );
    }
  }
  return { sesionesCambiadas, records };
};
