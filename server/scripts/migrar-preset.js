// Migración del bloque 10: pone `presetId` a los ejercicios que se clonaron de los presets
// ANTES de que existiera el campo, para que muestren su pictograma.
//
// Uso (desde /server):
//   npm run migrar:preset                              → producción, SIMULACIÓN (no escribe)
//   npm run migrar:preset -- --aplicar                 → producción, aplica los cambios
//   npm run migrar:preset -- --desarrollo [--aplicar]  → base de desarrollo (MONGO_URI del .env)
//
// Qué hace: para cada ejercicio sin presetId, busca un preset con su nombre y su grupo
// EXACTOS (utils/presets.js → presetIdDe). Si lo encuentra, le pone ese presetId; si no
// (renombrado, otro grupo o creado por el usuario), no lo toca y seguirá mostrando la figura
// de su grupo (decisión de David). No toca las sesiones: las anteriores al bloque 10 no tienen
// snapshot del pictograma y muestran el marco vacío.
//
// Solo escribe en ejercicios sin presetId, así que se puede repetir sin efecto y no usa una
// transacción: si se corta a mitad, basta con volver a lanzarlo. Al terminar, repite el
// cálculo sin escribir y exige 0 pendientes.
//
// Protecciones: sin --aplicar no escribe nada; en producción con --aplicar exige un backup
// de hace menos de 60 minutos (se comprueba antes de conectar). Usa el usuario temporal de
// escritura `yieldfit-reparacion` (docs/operaciones.md). Solo imprime números y nombres de
// preset, nunca datos de usuarios.

import { conectar, desconectar, ocultarCredenciales } from './lib/conexion.js';
import { comprobarBackupReciente } from './lib/backupReciente.js';
import { presetIdDe } from '../utils/presets.js';

const SERVICIO_LLAVERO = 'yieldfit-reparacion';

const desarrollo = process.argv.includes('--desarrollo');
const aplicar = process.argv.includes('--aplicar');

// Los ejercicios sin presetId, agrupados por el preset que les toca. Solo proyecta lo que
// hace falta para decidir.
const pendientes = async (db) => {
  const sinPreset = await db
    .collection('exercises')
    .find({ presetId: { $exists: false } }, { projection: { nombre: 1, grupoMuscular: 1 } })
    .toArray();
  const porPreset = new Map();
  for (const e of sinPreset) {
    const presetId = presetIdDe(e.nombre, e.grupoMuscular);
    if (!presetId) continue;
    if (!porPreset.has(presetId)) porPreset.set(presetId, []);
    porPreset.get(presetId).push(e._id);
  }
  const total = [...porPreset.values()].reduce((n, ids) => n + ids.length, 0);
  return { sinPreset: sinPreset.length, porPreset, total };
};

const main = async () => {
  if (!desarrollo && aplicar) {
    const backup = comprobarBackupReciente();
    console.log(`Backup previo: ${backup.nombre} (hace ${backup.minutos} min)`);
  }

  const db = await conectar({ desarrollo, servicioLlavero: SERVICIO_LLAVERO });
  console.log(`Base: ${db.databaseName} · ${aplicar ? 'APLICANDO CAMBIOS' : 'SIMULACIÓN (no escribe nada)'}`);

  const { sinPreset, porPreset, total } = await pendientes(db);
  console.log(`Ejercicios sin presetId: ${sinPreset}`);
  console.log(`  se reconocen como preset: ${total} (en ${porPreset.size} presets distintos)`);
  console.log(`  se quedan con la figura de su grupo: ${sinPreset - total}`);

  if (!aplicar) {
    console.log('\nPara aplicarlo, repite con --aplicar.');
    return;
  }

  // Un updateMany por preset (58 como mucho), y con presetId: { $exists: false } en el filtro
  // para no pisar nunca uno que ya lo tenga.
  let actualizados = 0;
  for (const [presetId, ids] of porPreset) {
    const r = await db
      .collection('exercises')
      .updateMany({ _id: { $in: ids }, presetId: { $exists: false } }, { $set: { presetId } });
    actualizados += r.modifiedCount;
  }
  console.log(`Ejercicios actualizados: ${actualizados}`);

  // Comprobación: lo mismo sobre lo ya escrito no debe encontrar nada que poner.
  const comprobacion = await pendientes(db);
  console.log(`Comprobación: pendientes ${comprobacion.total}`);
  if (comprobacion.total > 0) {
    throw new Error(`Quedan ${comprobacion.total} ejercicios sin migrar. Vuelve a ejecutarlo.`);
  }
};

main()
  .catch((error) => {
    console.error(`Migración abortada: ${ocultarCredenciales(error.message)}`);
    process.exitCode = 1;
  })
  .finally(desconectar);
