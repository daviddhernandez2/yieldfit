// Diagnóstico de SOLO LECTURA: ¿a quién afecta bloquear el cardio? (antes del bloque 6)
//
// Uso (desde /server):
//   npm run diagnostico:cardio                    → producción (usuario de backup, solo lectura)
//   npm run diagnostico:cardio -- --desarrollo    → base de desarrollo (MONGO_URI del .env)
//
// "Cardio" aquí es lo que la sesión activa no sabe registrar: los ejercicios con
// tracking 'tiempo_distancia' (grupo Cardio Y tipo Cardio). Se cuentan también los
// ejercicios con tipo Cardio en otro grupo (se miden por 1RM), por si cambian la decisión.
//
// Solo imprime números: ni emails, ni nombres, ni ids. Sin modelos de Mongoose.

import { conectar, desconectar, ocultarCredenciales } from './lib/conexion.js';

const SERVICIO_LLAVERO = 'yieldfit-backup';
const desarrollo = process.argv.includes('--desarrollo');

const main = async () => {
  const db = await conectar({ desarrollo, servicioLlavero: SERVICIO_LLAVERO });
  const col = (nombre) => db.collection(nombre);

  const cardio = await col('exercises')
    .find({ tracking: 'tiempo_distancia' }, { projection: { _id: 1, userId: 1 } })
    .toArray();
  const idsCardio = cardio.map((e) => e._id);
  const tipoCardioConOtroGrupo = await col('exercises').countDocuments({
    tipo: 'Cardio',
    grupoMuscular: { $ne: 'Cardio' },
  });

  // Rutinas con algún ejercicio de cardio, y de ellas las que SOLO tienen cardio
  // (con el bloqueo no se podría empezar una sesión con ellas).
  const rutinas = await col('workouts')
    .find({ 'ejercicios.exerciseId': { $in: idsCardio } }, { projection: { userId: 1, ejercicios: 1 } })
    .toArray();
  const esCardio = new Set(idsCardio.map(String));
  const soloCardio = rutinas.filter((r) => r.ejercicios.every((e) => esCardio.has(String(e.exerciseId))));
  const usuariosConRutinas = new Set(rutinas.map((r) => String(r.userId)));

  // Sesiones guardadas con cardio: el Historial no cambia, pero sirve para saber si alguien
  // ha intentado registrarlo (se guardó con peso y reps a 0).
  const sesiones = await col('sessions').countDocuments({ 'ejercicios.trackingSnapshot': 'tiempo_distancia' });
  const sesionesConCardioUsado = await col('sessions').countDocuments({
    ejercicios: {
      $elemMatch: {
        trackingSnapshot: 'tiempo_distancia',
        sets: { $elemMatch: { $or: [{ peso: { $gt: 0 } }, { reps: { $gt: 0 } }] } },
      },
    },
  });

  console.log(`Base: ${db.databaseName} (solo lectura)`);
  console.log(`Usuarios: ${await col('users').countDocuments()}`);
  console.log();
  console.log(`Ejercicios de cardio (tiempo/distancia): ${cardio.length}, de ${new Set(cardio.map((e) => String(e.userId))).size} usuarios`);
  console.log(`  (tipo Cardio en otro grupo, se miden por 1RM: ${tipoCardioConOtroGrupo})`);
  console.log(`Rutinas con algún ejercicio de cardio: ${rutinas.length}, de ${usuariosConRutinas.size} usuarios`);
  console.log(`  De ellas, con SOLO cardio (no se podrían empezar): ${soloCardio.length}`);
  console.log(`Sesiones guardadas con cardio: ${sesiones}`);
  console.log(`  De ellas, con peso o reps escritos en el cardio: ${sesionesConCardioUsado}`);
};

main()
  .catch((error) => {
    console.error(`Diagnóstico fallido: ${ocultarCredenciales(error.message)}`);
    process.exitCode = 1;
  })
  .finally(desconectar);
