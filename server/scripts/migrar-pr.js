// Migración del bloque 4b: marca los récords personales (esPR, prAnterior) en las sesiones
// guardadas antes de que existieran, y rellena `record1RM` en los ejercicios.
//
// Uso (desde /server):
//   npm run migrar:pr                              → producción, SIMULACIÓN (no escribe)
//   npm run migrar:pr -- --aplicar                 → producción, aplica los cambios
//   npm run migrar:pr -- --desarrollo [--aplicar]  → base de desarrollo (MONGO_URI del .env)
//
// Qué hace: para cada par usuario + ejercicio de fuerza que aparece en alguna sesión, recorre
// sus sesiones en orden de fecha con la MISMA función que usa la app al borrar una sesión
// (utils/records.js → recalcularRecords) y corrige lo que no cuadre. Incluye los ejercicios
// ya borrados: sus sesiones conservan la marca aunque el ejercicio no exista.
//
// También sirve para reconstruir los récords si alguna vez no cuadran (p. ej. si cambia el
// criterio): solo escribe lo que cambia. Se puede repetir sin efecto, por eso no usa una
// transacción: si se corta a mitad, basta con volver a lanzarlo. Al terminar, repite el
// cálculo sin escribir y exige 0 cambios.
//
// Protecciones: sin --aplicar no escribe nada; en producción con --aplicar exige un backup
// de hace menos de 60 minutos (se comprueba antes de conectar). Usa el usuario temporal de
// escritura `yieldfit-reparacion` (docs/operaciones.md). Solo imprime números.

import { conectar, desconectar, ocultarCredenciales } from './lib/conexion.js';
import { comprobarBackupReciente } from './lib/backupReciente.js';
import { recalcularRecords } from '../utils/records.js';

const SERVICIO_LLAVERO = 'yieldfit-reparacion';

const desarrollo = process.argv.includes('--desarrollo');
const aplicar = process.argv.includes('--aplicar');

// Recorre todos los pares y devuelve los totales. Con escribir: false solo cuenta.
const recorrer = async (db, pares, escribir) => {
  let sesionesCambiadas = 0;
  let conRecord = 0;
  for (const { _id: userId, exerciseIds } of pares) {
    const r = await recalcularRecords({ db, userId, exerciseIds, escribir });
    sesionesCambiadas += r.sesionesCambiadas;
    conRecord += [...r.records.values()].filter((v) => v !== null).length;
  }
  return { sesionesCambiadas, conRecord };
};

const main = async () => {
  if (!desarrollo && aplicar) {
    const backup = comprobarBackupReciente();
    console.log(`Backup previo: ${backup.nombre} (hace ${backup.minutos} min)`);
  }

  const db = await conectar({ desarrollo, servicioLlavero: SERVICIO_LLAVERO });
  console.log(`Base: ${db.databaseName} · ${aplicar ? 'APLICANDO CAMBIOS' : 'SIMULACIÓN (no escribe nada)'}`);

  // Pares usuario → ejercicios de fuerza con sesiones. Recorre todas las sesiones una vez:
  // aceptable en un script que se ejecuta a mano, no en la app.
  const pares = await db
    .collection('sessions')
    .aggregate([
      { $unwind: '$ejercicios' },
      { $match: { 'ejercicios.trackingSnapshot': '1RM' } },
      { $group: { _id: '$userId', exerciseIds: { $addToSet: '$ejercicios.exerciseId' } } },
    ])
    .toArray();
  const numEjercicios = pares.reduce((n, p) => n + p.exerciseIds.length, 0);
  console.log(`Usuarios: ${pares.length} · ejercicios de fuerza con sesiones: ${numEjercicios}`);

  const resultado = await recorrer(db, pares, aplicar);
  console.log(
    `Sesiones ${aplicar ? 'actualizadas' : 'que cambiarían'}: ${resultado.sesionesCambiadas} · ` +
      `ejercicios con marca: ${resultado.conRecord}`
  );

  if (!aplicar) {
    console.log('\nPara aplicarlo, repite con --aplicar.');
    return;
  }

  // Comprobación: el mismo cálculo sobre lo ya escrito no debe encontrar nada que cambiar.
  const comprobacion = await recorrer(db, pares, false);
  console.log(`Comprobación: sesiones pendientes ${comprobacion.sesionesCambiadas}`);
  if (comprobacion.sesionesCambiadas > 0) {
    throw new Error(`Quedan ${comprobacion.sesionesCambiadas} sesiones sin cuadrar. Vuelve a ejecutarlo.`);
  }
};

main()
  .catch((error) => {
    console.error(`Migración abortada: ${ocultarCredenciales(error.message)}`);
    process.exitCode = 1;
  })
  .finally(desconectar);
