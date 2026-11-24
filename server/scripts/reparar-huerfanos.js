// Borra los datos huérfanos: documentos de usuarios que ya no existen (bloque 1c).
//
// Uso (desde /server):
//   npm run reparar:huerfanos                              → producción, SIMULACIÓN (no escribe)
//   npm run reparar:huerfanos -- --aplicar                 → producción, borra
//   npm run reparar:huerfanos -- --desarrollo [--aplicar]  → base de desarrollo
//
// Qué borra: en cada colección con userId (scripts/lib/coleccionesUsuario.js), los documentos
// cuyo usuario no existe. Es lo mismo que habría hecho "Eliminar mi cuenta" (11b.4) si esos
// usuarios se hubieran borrado desde la app.
//
// Protecciones, en el orden en que actúan:
//   - Sin --aplicar no escribe nada: enseña qué borraría.
//   - En producción con --aplicar exige un backup de hace menos de 60 minutos
//     (docs/operaciones.md). Se comprueba ANTES de conectar.
//   - Tope: si hay más de MAX_USUARIOS usuarios huérfanos, aborta. Se esperan 4; muchos más
//     significaría que la consulta de usuarios está mal y se borrarían datos de gente real.
//   - Los documentos sin userId nunca se borran (se informan).
//   - Todo va en una transacción: se vuelve a buscar dentro de ella y, al terminar, se comprueba
//     que no queda nada de esos usuarios. O se borra todo o nada.
//
// Solo imprime ids de usuario y números. No usa los modelos de Mongoose.

import { conectar, desconectar, obtenerCliente, ocultarCredenciales } from './lib/conexion.js';
import { comprobarBackupReciente } from './lib/backupReciente.js';
import { COLECCIONES_DEL_USUARIO } from './lib/coleccionesUsuario.js';
import { buscarHuerfanos, imprimirHuerfanos, totalesPorColeccion } from './lib/huerfanos.js';

// Usuario temporal con escritura sobre yieldfit (docs/operaciones.md).
const SERVICIO_LLAVERO = 'yieldfit-reparacion';
const MAX_USUARIOS = 10;

const desarrollo = process.argv.includes('--desarrollo');
const aplicar = process.argv.includes('--aplicar');

const validar = ({ porUsuario }) => {
  if (porUsuario.size > MAX_USUARIOS) {
    throw new Error(
      `Hay ${porUsuario.size} usuarios huérfanos (tope ${MAX_USUARIOS}). No se ha tocado nada: ` +
        'revisa que la colección de usuarios se lee bien.',
    );
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
    const huerfanos = await buscarHuerfanos(db);
    imprimirHuerfanos(huerfanos);
    validar(huerfanos);
    console.log();
    console.log(huerfanos.porUsuario.size ? 'Para borrarlos, repite con --aplicar.' : 'No hay nada que borrar.');
    return;
  }

  const session = obtenerCliente().startSession();
  try {
    await session.withTransaction(async () => {
      const huerfanos = await buscarHuerfanos(db, session);
      imprimirHuerfanos(huerfanos);
      validar(huerfanos);
      if (huerfanos.ids.length === 0) return;

      const esperados = totalesPorColeccion(huerfanos.porUsuario);
      for (const coleccion of COLECCIONES_DEL_USUARIO) {
        const { deletedCount } = await db
          .collection(coleccion)
          .deleteMany({ userId: { $in: huerfanos.ids } }, { session });
        // Si el recuento no cuadra con lo que se acaba de contar, algo ha cambiado a mitad: se
        // aborta la transacción entera.
        if (deletedCount !== (esperados[coleccion] ?? 0)) {
          throw new Error(`${coleccion}: se esperaban ${esperados[coleccion] ?? 0} borrados y fueron ${deletedCount}.`);
        }
      }
      const quedan = await buscarHuerfanos(db, session);
      if (quedan.porUsuario.size !== 0) throw new Error('Siguen quedando datos huérfanos: se deshace todo.');
    });
  } finally {
    await session.endSession();
  }

  console.log();
  console.log('Hecho. Comprueba con: npm run diagnostico:huerfanos' + (desarrollo ? ' -- --desarrollo' : ''));
};

main()
  .catch((error) => {
    console.error(`Reparación abortada: ${ocultarCredenciales(error.message)}`);
    process.exitCode = 1;
  })
  .finally(desconectar);
