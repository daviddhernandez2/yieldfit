import { COLECCIONES_DEL_USUARIO } from './coleccionesUsuario.js';

// Busca los datos huérfanos: documentos cuyo userId no corresponde a ningún usuario que exista
// (bloque 1c). Lo usan el diagnóstico (solo lectura) y la reparación (dentro de su transacción,
// por eso acepta `session`).
//
// Devuelve:
//   - porUsuario: Map de userId huérfano (texto) → { coleccion: número de documentos }.
//   - ids: los userId huérfanos tal cual (ObjectId), para borrar con $in.
//   - sinUsuario: { coleccion: n } de documentos SIN userId. No son huérfanos de un usuario
//     borrado sino un dato raro: se informan y nunca se borran.
export const buscarHuerfanos = async (db, session) => {
  const existentes = new Set(
    (await db.collection('users').find({}, { projection: { _id: 1 }, session }).toArray()).map((u) => String(u._id)),
  );
  const porUsuario = new Map();
  const ids = new Map();
  const sinUsuario = {};
  for (const coleccion of COLECCIONES_DEL_USUARIO) {
    // Un grupo por userId: el resultado tiene tantas filas como usuarios, no como documentos.
    const grupos = await db
      .collection(coleccion)
      .aggregate([{ $group: { _id: '$userId', n: { $sum: 1 } } }], { session })
      .toArray();
    for (const { _id: userId, n } of grupos) {
      if (userId === null || userId === undefined) {
        sinUsuario[coleccion] = n;
        continue;
      }
      const clave = String(userId);
      if (existentes.has(clave)) continue;
      if (!porUsuario.has(clave)) porUsuario.set(clave, {});
      porUsuario.get(clave)[coleccion] = n;
      ids.set(clave, userId);
    }
  }
  return { porUsuario, ids: [...ids.values()], sinUsuario };
};

// Total de documentos huérfanos por colección: { exercises: 232, … }.
export const totalesPorColeccion = (porUsuario) => {
  const totales = {};
  for (const conteo of porUsuario.values()) {
    for (const [coleccion, n] of Object.entries(conteo)) totales[coleccion] = (totales[coleccion] ?? 0) + n;
  }
  return totales;
};

// Imprime el resultado. Solo ids y números: ni emails ni nada de los documentos.
export const imprimirHuerfanos = ({ porUsuario, sinUsuario }) => {
  console.log(`Usuarios inexistentes con datos: ${porUsuario.size}`);
  for (const [userId, conteo] of porUsuario) {
    const detalle = Object.entries(conteo).map(([c, n]) => `${c} ${n}`).join(' · ');
    console.log(`    ${userId}: ${detalle}`);
  }
  const totales = totalesPorColeccion(porUsuario);
  console.log(`Documentos huérfanos por colección: ${Object.keys(totales).length ? Object.entries(totales).map(([c, n]) => `${c} ${n}`).join(' · ') : 'ninguno'}`);
  if (Object.keys(sinUsuario).length) {
    console.log(`Documentos SIN userId (no se tocan; revisar a mano): ${Object.entries(sinUsuario).map(([c, n]) => `${c} ${n}`).join(' · ')}`);
  }
};
