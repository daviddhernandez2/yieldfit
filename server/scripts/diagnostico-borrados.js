// Diagnóstico de SOLO LECTURA de los efectos del borrado de ejercicios (bloque 1, paso 1.6a).
//
// Uso (desde /server):
//   npm run diagnostico:borrados                    → producción (usuario de backup, solo lectura)
//   npm run diagnostico:borrados -- --desarrollo    → base de desarrollo (MONGO_URI del .env)
//
// Qué cuenta:
//   1. Sesiones vacías: sesiones sin ningún ejercicio. Las dejó así la cascada $pull
//      antigua al borrar el único ejercicio de una sesión.
//   2. Rutinas rotas: rutinas que apuntan a ejercicios que ya no existen. Son las que no
//      se pueden editar y con las que no se puede guardar un entreno (error 400).
//      Se separan las que se quedarían sin ningún ejercicio si se limpiaran.
//   3. Grupos con ejercicios inexistentes.
//   4. Sesiones con ejercicios inexistentes: con la cascada antigua deberían ser 0.
//      Con el borrado nuevo (1.6b) serán normales: es el historial que se conserva.
//
// Solo imprime números e ids de documentos: ni emails, ni nombres, ni fechas.
// No usa los modelos de Mongoose a propósito: así no se ejecuta ningún middleware ni se
// intenta crear ningún índice. Solo hay lecturas (countDocuments, aggregate).

import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import mongoose from 'mongoose';

const SERVICIO_LLAVERO = 'yieldfit-backup';
const BASE_PRODUCCION = 'yieldfit';
const MAX_IDS = 20; // ids que se listan por apartado, para que la salida sea legible

const desarrollo = process.argv.includes('--desarrollo');

// Credenciales que el filtro debe ocultar si aparecen en un mensaje de error.
let claveSecreta = '';

// Mismo criterio que scripts/lib/credenciales.sh: ningún mensaje de error de MongoDB
// llega a la terminal sin pasar por aquí, porque podría llevar la URI con la contraseña.
const ocultarCredenciales = (texto) => {
  let limpio = String(texto).replace(/(mongodb(?:\+srv)?:\/\/[^:/@\s]+):[^@\s]*@/g, '$1:***@');
  if (claveSecreta) {
    for (const forma of [claveSecreta, decodeURIComponent(claveSecreta)]) {
      limpio = limpio.split(forma).join('***');
    }
  }
  return limpio;
};

const obtenerConexion = () => {
  if (desarrollo) {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI no está definida en server/.env');
    // dbName undefined → la base que indique la URI (yieldfit-dev).
    return { uri: process.env.MONGO_URI, dbName: undefined };
  }
  // execFileSync no pasa por un shell: la URI vuelve como texto a este proceso y
  // nunca aparece en los argumentos de otro proceso.
  const uri = execFileSync('security', ['find-generic-password', '-s', SERVICIO_LLAVERO, '-w'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
  return { uri, dbName: BASE_PRODUCCION };
};

// Pipeline común: para cada elemento de un array de ids, busca si el ejercicio existe.
// Devuelve los documentos con la lista de ids que NO existen y cuántos sí.
const conIdsInexistentes = (campoArray, campoId) => [
  { $unwind: `$${campoArray}` },
  {
    $lookup: {
      from: 'exercises',
      localField: campoId ? `${campoArray}.${campoId}` : campoArray,
      foreignField: '_id',
      as: 'ejercicio',
    },
  },
  {
    $group: {
      _id: '$_id',
      total: { $sum: 1 },
      inexistentes: { $sum: { $cond: [{ $eq: [{ $size: '$ejercicio' }, 0] }, 1, 0] } },
    },
  },
  { $match: { inexistentes: { $gt: 0 } } },
  { $sort: { _id: 1 } },
];

const listarIds = (docs) => {
  const ids = docs.slice(0, MAX_IDS).map((d) => `    ${d._id}${d.detalle ?? ''}`);
  if (docs.length > MAX_IDS) ids.push(`    … y ${docs.length - MAX_IDS} más`);
  return ids.join('\n');
};

const main = async () => {
  const { uri, dbName } = obtenerConexion();
  claveSecreta = uri.match(/^mongodb(?:\+srv)?:\/\/[^:/@]+:([^@]*)@/)?.[1] ?? '';

  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  const nombreBase = db.databaseName;

  if (desarrollo && !nombreBase.endsWith('-dev')) {
    throw new Error(`--desarrollo exige una base "-dev". Base actual: "${nombreBase}"`);
  }

  const col = (nombre) => db.collection(nombre);

  const totales = {
    ejercicios: await col('exercises').countDocuments(),
    rutinas: await col('workouts').countDocuments(),
    sesiones: await col('sessions').countDocuments(),
    grupos: await col('charts').countDocuments(),
  };

  // 1. Sesiones sin ejercicios.
  const sesionesVacias = await col('sessions')
    .find({ ejercicios: { $size: 0 } }, { projection: { _id: 1 } })
    .sort({ _id: 1 })
    .toArray();

  // 2. Rutinas con ejercicios inexistentes.
  const rutinasRotas = await col('workouts').aggregate(conIdsInexistentes('ejercicios', 'exerciseId')).toArray();
  const rutinasQueQuedarianVacias = rutinasRotas.filter((r) => r.inexistentes === r.total);

  // 3. Grupos con ejercicios inexistentes (exerciseIds es un array de ids, sin subcampo).
  const gruposRotos = await col('charts').aggregate(conIdsInexistentes('exerciseIds', null)).toArray();

  // 4. Sesiones con ejercicios inexistentes.
  const sesionesConInexistentes = await col('sessions')
    .aggregate(conIdsInexistentes('ejercicios', 'exerciseId'))
    .toArray();

  const detalle = (d) => ({ ...d, detalle: ` (${d.inexistentes} de ${d.total} ejercicios no existen)` });

  console.log(`Base: ${nombreBase} (solo lectura)`);
  console.log(
    `Totales: ${totales.ejercicios} ejercicios · ${totales.rutinas} rutinas · ` +
      `${totales.sesiones} sesiones · ${totales.grupos} grupos`
  );
  console.log();
  console.log(`1. Sesiones vacías: ${sesionesVacias.length}`);
  if (sesionesVacias.length) console.log(listarIds(sesionesVacias));
  console.log(`2. Rutinas con ejercicios inexistentes: ${rutinasRotas.length}`);
  if (rutinasRotas.length) console.log(listarIds(rutinasRotas.map(detalle)));
  console.log(`   De ellas, se quedarían sin ningún ejercicio al limpiarlas: ${rutinasQueQuedarianVacias.length}`);
  console.log(`3. Grupos con ejercicios inexistentes: ${gruposRotos.length}`);
  if (gruposRotos.length) console.log(listarIds(gruposRotos.map(detalle)));
  console.log(`4. Sesiones con ejercicios inexistentes: ${sesionesConInexistentes.length}`);
  if (sesionesConInexistentes.length) console.log(listarIds(sesionesConInexistentes.map(detalle)));
};

main()
  .catch((error) => {
    console.error(`Diagnóstico fallido: ${ocultarCredenciales(error.message)}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
