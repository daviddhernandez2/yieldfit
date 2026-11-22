// Reparación puntual de los restos de la cascada $pull antigua (bloque 1, paso 1.6f).
//
// Uso (desde /server):
//   npm run reparar:borrados                              → producción, SIMULACIÓN (no escribe)
//   npm run reparar:borrados -- --aplicar                 → producción, aplica los cambios
//   npm run reparar:borrados -- --desarrollo [--aplicar]  → base de desarrollo (MONGO_URI del .env)
//
// Qué arregla (lo mismo que cuentan los apartados 1 y 2 de diagnostico-borrados.js):
//   1. Sesiones vacías (sin ningún ejercicio): se borran. No tienen nada que conservar.
//   2. Rutinas con ejercicios que ya no existen: se quitan esos ejercicios, con el mismo
//      $pull que hace hoy el borrado de un ejercicio (1.6b).
//
// Protecciones, en el orden en que actúan:
//   - Sin --aplicar no escribe nada: enseña qué cambiaría.
//   - En producción con --aplicar exige un backup de hace menos de 60 minutos
//     (docs/operaciones.md). Se comprueba ANTES de conectar.
//   - Topes: si encuentra más de MAX_CAMBIOS sesiones o rutinas, aborta. Los números
//     reales son 3 y 2; un número mucho mayor significa que la consulta está mal.
//   - Regla R2: si una rutina se quedaría sin ejercicios, aborta sin tocar nada. Esa
//     rutina hay que revisarla a mano (decidir si se borra o se rehace).
//   - Todo va en una transacción: o se aplican todos los cambios o ninguno.
//
// Como el diagnóstico: solo imprime ids y números, y no usa los modelos de Mongoose
// (ningún middleware, ningún índice).

import { existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { conectar, desconectar, obtenerCliente, ocultarCredenciales } from './lib/conexion.js';

// Usuario temporal con escritura sobre yieldfit (docs/operaciones.md). Ningún otro script
// lo usa: el de backup sigue siendo de solo lectura.
const SERVICIO_LLAVERO = 'yieldfit-reparacion';
const MAX_CAMBIOS = 10;
const MINUTOS_BACKUP = 60;

const desarrollo = process.argv.includes('--desarrollo');
const aplicar = process.argv.includes('--aplicar');

// Busca el backup más reciente (misma carpeta que usa backup.sh) y comprueba que tiene
// el archivo y su huella, y que es de hace menos de MINUTOS_BACKUP. No comprueba que se
// pueda restaurar: eso lo hace backup:restore-test, que va antes en el procedimiento.
const comprobarBackupReciente = () => {
  const carpeta = join(homedir(), 'yieldfit-backups');
  const backups = existsSync(carpeta)
    ? readdirSync(carpeta)
        .filter((nombre) => /^\d{4}-\d{2}-\d{2}_\d{4}$/.test(nombre))
        .sort()
    : [];
  if (backups.length === 0) {
    throw new Error('No hay ningún backup en ~/yieldfit-backups. Ejecuta antes: npm run backup');
  }
  const ultimo = join(carpeta, backups.at(-1));
  const archivo = join(ultimo, 'yieldfit.archive.gz');
  if (!existsSync(archivo) || !existsSync(`${archivo}.sha256`)) {
    throw new Error(`El último backup (${backups.at(-1)}) está incompleto. Ejecuta: npm run backup`);
  }
  const minutos = (Date.now() - statSync(archivo).mtimeMs) / 60000;
  if (minutos > MINUTOS_BACKUP) {
    throw new Error(
      `El último backup es de hace ${Math.round(minutos)} minutos (máximo ${MINUTOS_BACKUP}). ` +
        'Ejecuta antes: npm run backup'
    );
  }
  return { nombre: backups.at(-1), minutos: Math.round(minutos) };
};

// Busca lo que hay que arreglar. Recibe la sesión de la transacción para que las
// lecturas y las escrituras vean exactamente el mismo estado de la base.
const buscarProblemas = async (db, session) => {
  const sesionesVacias = await db
    .collection('sessions')
    .find({ ejercicios: { $size: 0 } }, { projection: { _id: 1 }, session })
    .sort({ _id: 1 })
    .toArray();

  // Por cada rutina, los exerciseId que no encuentran su ejercicio. $addToSet porque un
  // mismo id puede estar repetido en la rutina; el $pull los quitará todos.
  const rutinasRotas = await db
    .collection('workouts')
    .aggregate(
      [
        { $unwind: '$ejercicios' },
        {
          $lookup: {
            from: 'exercises',
            localField: 'ejercicios.exerciseId',
            foreignField: '_id',
            as: 'ejercicio',
          },
        },
        { $match: { ejercicio: { $size: 0 } } },
        { $group: { _id: '$_id', inexistentes: { $addToSet: '$ejercicios.exerciseId' } } },
        { $sort: { _id: 1 } },
      ],
      { session }
    )
    .toArray();

  // Regla R2: cuántos ejercicios le quedarían a cada rutina después del $pull.
  for (const rutina of rutinasRotas) {
    const doc = await db
      .collection('workouts')
      .findOne({ _id: rutina._id }, { projection: { ejercicios: 1 }, session });
    const inexistentes = new Set(rutina.inexistentes.map(String));
    rutina.total = doc.ejercicios.length;
    rutina.quedan = doc.ejercicios.filter((ej) => !inexistentes.has(String(ej.exerciseId))).length;
  }

  return { sesionesVacias, rutinasRotas };
};

// Comprueba las protecciones. Lanza un error (y con él se aborta la transacción) si algo
// no cuadra; no devuelve nada si todo está bien.
const validar = ({ sesionesVacias, rutinasRotas }) => {
  if (sesionesVacias.length > MAX_CAMBIOS || rutinasRotas.length > MAX_CAMBIOS) {
    throw new Error(
      `Demasiados cambios (${sesionesVacias.length} sesiones, ${rutinasRotas.length} rutinas; ` +
        `tope ${MAX_CAMBIOS}). No se ha tocado nada: revisa las consultas.`
    );
  }
  const quedariaVacia = rutinasRotas.filter((r) => r.quedan === 0);
  if (quedariaVacia.length > 0) {
    throw new Error(
      `Estas rutinas se quedarían sin ejercicios: ${quedariaVacia.map((r) => r._id).join(', ')}. ` +
        'No se ha tocado nada: revísalas a mano en la app (edítalas o bórralas) y repite.'
    );
  }
};

const imprimir = ({ sesionesVacias, rutinasRotas }) => {
  console.log(`Sesiones vacías que se borran: ${sesionesVacias.length}`);
  for (const s of sesionesVacias) console.log(`    ${s._id}`);
  console.log(`Rutinas que se limpian: ${rutinasRotas.length}`);
  for (const r of rutinasRotas) {
    console.log(`    ${r._id} (se quitan ${r.total - r.quedan} de ${r.total} ejercicios, quedan ${r.quedan})`);
  }
};

const main = async () => {
  if (!desarrollo && aplicar) {
    const backup = comprobarBackupReciente();
    console.log(`Backup previo: ${backup.nombre} (hace ${backup.minutos} min)`);
  }

  const db = await conectar({ desarrollo, servicioLlavero: SERVICIO_LLAVERO });
  console.log(`Base: ${db.databaseName} · ${aplicar ? 'APLICANDO CAMBIOS' : 'SIMULACIÓN (no escribe nada)'}`);
  console.log();

  if (!aplicar) {
    const problemas = await buscarProblemas(db);
    imprimir(problemas);
    validar(problemas);
    console.log();
    console.log('Para aplicarlo, repite con --aplicar.');
    return;
  }

  const session = obtenerCliente().startSession();
  try {
    await session.withTransaction(async () => {
      const problemas = await buscarProblemas(db, session);
      imprimir(problemas);
      validar(problemas);

      // Se borra por ids Y con la condición de vacía: si alguna sesión hubiera cambiado
      // entre la lectura y el borrado, el recuento no cuadra y se aborta todo.
      const ids = problemas.sesionesVacias.map((s) => s._id);
      const borrado = await db
        .collection('sessions')
        .deleteMany({ _id: { $in: ids }, ejercicios: { $size: 0 } }, { session });
      if (borrado.deletedCount !== ids.length) {
        throw new Error(`Se esperaban ${ids.length} sesiones borradas y fueron ${borrado.deletedCount}.`);
      }

      for (const rutina of problemas.rutinasRotas) {
        // updatedAt a mano: el driver no lo actualiza (Mongoose sí lo haría con timestamps).
        const cambio = await db.collection('workouts').updateOne(
          { _id: rutina._id },
          {
            $pull: { ejercicios: { exerciseId: { $in: rutina.inexistentes } } },
            $set: { updatedAt: new Date() },
          },
          { session }
        );
        if (cambio.modifiedCount !== 1) {
          throw new Error(`La rutina ${rutina._id} no se ha modificado.`);
        }
      }
    });
  } finally {
    await session.endSession();
  }

  console.log();
  console.log('Hecho. Comprueba con: npm run diagnostico:borrados' + (desarrollo ? ' -- --desarrollo' : ''));
};

main()
  .catch((error) => {
    console.error(`Reparación abortada: ${ocultarCredenciales(error.message)}`);
    process.exitCode = 1;
  })
  .finally(desconectar);
