// Conexión segura a MongoDB para los scripts de mantenimiento (diagnóstico, reparación).
//
// Está aquí, y no en cada script, porque el filtro de credenciales tiene que ser UNO:
// si se corrige un caso que se escapa, se corrige para todos los scripts a la vez.
// Es el equivalente en Node de lib/credenciales.sh (que usan backup.sh y restore-test.sh).
//
// Dos modos:
//   - Producción: la URI sale del Llavero de macOS (servicio que indique cada script) y
//     se fuerza la base `yieldfit`. Nunca está en un archivo ni en un argumento.
//   - Desarrollo (--desarrollo): la URI sale de MONGO_URI del server/.env y se exige que
//     la base acabe en "-dev", para que un .env mal configurado no apunte a producción.

import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import mongoose from 'mongoose';

const BASE_PRODUCCION = 'yieldfit';

// Contraseña de la URI en uso. Se guarda al conectar para poder taparla en los errores
// aunque aparezca suelta (sin el formato usuario:contraseña@ que detecta la regex).
let claveSecreta = '';

// Ningún mensaje de error de MongoDB debe llegar a la terminal sin pasar por aquí:
// puede llevar la URI completa con la contraseña.
export const ocultarCredenciales = (texto) => {
  let limpio = String(texto).replace(/(mongodb(?:\+srv)?:\/\/[^:/@\s]+):[^@\s]*@/g, '$1:***@');
  if (claveSecreta) {
    // La contraseña puede aparecer tal cual o codificada para URL (%40 en vez de @...).
    for (const forma of [claveSecreta, decodeURIComponent(claveSecreta)]) {
      limpio = limpio.split(forma).join('***');
    }
  }
  return limpio;
};

const obtenerUri = ({ desarrollo, servicioLlavero }) => {
  if (desarrollo) {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI no está definida en server/.env');
    // dbName undefined → la base que indique la URI (yieldfit-dev).
    return { uri: process.env.MONGO_URI, dbName: undefined };
  }
  // execFileSync no pasa por un shell: la URI vuelve como texto a este proceso y
  // nunca aparece en los argumentos de otro proceso (visibles con `ps`).
  const uri = execFileSync('security', ['find-generic-password', '-s', servicioLlavero, '-w'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
  return { uri, dbName: BASE_PRODUCCION };
};

// Conecta y devuelve la base (el objeto `db` del driver, sin modelos de Mongoose).
// `servicioLlavero` decide con qué usuario se entra en producción, y por tanto qué
// permisos tiene el script: solo lectura (yieldfit-backup) o escritura (temporal).
export const conectar = async ({ desarrollo, servicioLlavero }) => {
  const { uri, dbName } = obtenerUri({ desarrollo, servicioLlavero });
  claveSecreta = uri.match(/^mongodb(?:\+srv)?:\/\/[^:/@]+:([^@]*)@/)?.[1] ?? '';

  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;

  if (desarrollo && !db.databaseName.endsWith('-dev')) {
    throw new Error(`--desarrollo exige una base "-dev". Base actual: "${db.databaseName}"`);
  }
  return db;
};

export const desconectar = () => mongoose.disconnect();
