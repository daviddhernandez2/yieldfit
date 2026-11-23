// Migración del bloque 4 (paso 4.2): rellena `mejor1RM` en las sesiones guardadas antes
// de que existiera el campo.
//
// Uso (desde /server):
//   npm run migrar:1rm                              → producción, SIMULACIÓN (no escribe)
//   npm run migrar:1rm -- --aplicar                 → producción, aplica los cambios
//   npm run migrar:1rm -- --desarrollo [--aplicar]  → base de desarrollo (MONGO_URI del .env)
//
// Qué hace: para cada ejercicio de sesión que no tiene `mejor1RM`, lo calcula a partir de
// sus series con la misma función que usa sessionController.create (utils/unaRM.js) y lo
// guarda. Los de tiempo/distancia reciben null.
//
// Se puede repetir sin efecto: solo toca los ejercicios que NO tienen el campo, así que una
// segunda ejecución encuentra 0. Por eso no usa una transacción: si se corta a mitad (p. ej.
// por la red), basta con volver a lanzarlo y sigue donde lo dejó.
//
// No cambia `updatedAt`: es un dato derivado de las series, no una edición del usuario.
//
// Protecciones: sin --aplicar no escribe nada; en producción con --aplicar exige un backup
// de hace menos de 60 minutos (se comprueba antes de conectar). Usa el usuario temporal de
// escritura `yieldfit-reparacion` (docs/operaciones.md). Solo imprime ids y números.
// Como los otros scripts, no usa los modelos de Mongoose (ni middlewares ni índices).

import { conectar, desconectar, ocultarCredenciales } from './lib/conexion.js';
import { comprobarBackupReciente } from './lib/backupReciente.js';
import { mejor1RMDeEjercicio } from '../utils/unaRM.js';

const SERVICIO_LLAVERO = 'yieldfit-reparacion';
const TAMANO_LOTE = 500; // operaciones por bulkWrite
const EJEMPLOS = 3; // sesiones que se enseñan en la simulación para comprobar a ojo

const desarrollo = process.argv.includes('--desarrollo');
const aplicar = process.argv.includes('--aplicar');

// Sesiones con algún ejercicio sin `mejor1RM`. $exists: false no confunde "no tiene el
// campo" con "lo tiene a null" (cardio ya migrado): por eso la migración es repetible.
const FILTRO_PENDIENTES = { ejercicios: { $elemMatch: { mejor1RM: { $exists: false } } } };

// Para una sesión, el $set de los ejercicios que faltan, por posición en el array:
// { 'ejercicios.0.mejor1RM': 121, 'ejercicios.2.mejor1RM': null }.
// La posición es segura porque las sesiones no se editan nunca (no hay PUT); aun así, el
// filtro del updateOne exige que siga faltando el campo.
const cambiosDeSesion = (sesion) => {
  const cambios = {};
  sesion.ejercicios.forEach((ej, i) => {
    if (!('mejor1RM' in ej)) cambios[`ejercicios.${i}.mejor1RM`] = mejor1RMDeEjercicio(ej);
  });
  return cambios;
};

const main = async () => {
  if (!desarrollo && aplicar) {
    const backup = comprobarBackupReciente();
    console.log(`Backup previo: ${backup.nombre} (hace ${backup.minutos} min)`);
  }

  const db = await conectar({ desarrollo, servicioLlavero: SERVICIO_LLAVERO });
  const sesiones = db.collection('sessions');
  console.log(`Base: ${db.databaseName} · ${aplicar ? 'APLICANDO CAMBIOS' : 'SIMULACIÓN (no escribe nada)'}`);

  const total = await sesiones.countDocuments();
  const pendientes = await sesiones.countDocuments(FILTRO_PENDIENTES);
  console.log(`Sesiones: ${total} · pendientes de migrar: ${pendientes}`);

  if (!aplicar) {
    const ejemplos = await sesiones
      .find(FILTRO_PENDIENTES, { projection: { ejercicios: { trackingSnapshot: 1, sets: 1 } } })
      .limit(EJEMPLOS)
      .toArray();
    for (const s of ejemplos) {
      const valores = Object.values(cambiosDeSesion(s)).map((v) => (v === null ? 'null' : v));
      console.log(`    ${s._id} → mejor1RM: ${valores.join(', ')}`);
    }
    console.log('\nPara aplicarlo, repite con --aplicar.');
    return;
  }

  // Se leen solo los campos necesarios, sesión a sesión (cursor), y se escriben por lotes.
  const cursor = sesiones.find(FILTRO_PENDIENTES, {
    projection: { ejercicios: { trackingSnapshot: 1, sets: 1, mejor1RM: 1 } },
  });
  let lote = [];
  let actualizadas = 0;
  const escribirLote = async () => {
    if (lote.length === 0) return;
    const resultado = await sesiones.bulkWrite(lote, { ordered: false });
    actualizadas += resultado.modifiedCount;
    lote = [];
  };

  for await (const sesion of cursor) {
    const cambios = cambiosDeSesion(sesion);
    lote.push({ updateOne: { filter: { _id: sesion._id, ...FILTRO_PENDIENTES }, update: { $set: cambios } } });
    if (lote.length >= TAMANO_LOTE) await escribirLote();
  }
  await escribirLote();

  const quedan = await sesiones.countDocuments(FILTRO_PENDIENTES);
  console.log(`Actualizadas: ${actualizadas} · quedan pendientes: ${quedan}`);
  if (quedan > 0) {
    throw new Error(`Quedan ${quedan} sesiones sin migrar. Vuelve a ejecutarlo.`);
  }
};

main()
  .catch((error) => {
    console.error(`Migración abortada: ${ocultarCredenciales(error.message)}`);
    process.exitCode = 1;
  })
  .finally(desconectar);
