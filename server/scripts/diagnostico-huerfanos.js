// Diagnóstico de SOLO LECTURA de los datos huérfanos (bloque 1c): documentos de usuarios que ya
// no existen. En producción hay datos de 4 usuarios que se borraron a mano, sin sus datos (deuda
// en CLAUDE.md). Desde el bloque 11b la app borra la cuenta con todo; esto mide lo que quedó.
//
// Uso (desde /server):
//   npm run diagnostico:huerfanos                    → producción (usuario de backup, solo lectura)
//   npm run diagnostico:huerfanos -- --desarrollo    → base de desarrollo (MONGO_URI del .env)
//
// Solo imprime ids de usuario y números. No usa los modelos de Mongoose: solo lecturas.

import { conectar, desconectar, ocultarCredenciales } from './lib/conexion.js';
import { buscarHuerfanos, imprimirHuerfanos } from './lib/huerfanos.js';

// Usuario de solo lectura: el diagnóstico no puede modificar producción aunque quisiera.
const SERVICIO_LLAVERO = 'yieldfit-backup';
const desarrollo = process.argv.includes('--desarrollo');

const main = async () => {
  const db = await conectar({ desarrollo, servicioLlavero: SERVICIO_LLAVERO });
  console.log(`Base: ${db.databaseName} · solo lectura`);
  console.log();
  imprimirHuerfanos(await buscarHuerfanos(db));
};

main()
  .catch((error) => {
    console.error(`Diagnóstico abortado: ${ocultarCredenciales(error.message)}`);
    process.exitCode = 1;
  })
  .finally(desconectar);
