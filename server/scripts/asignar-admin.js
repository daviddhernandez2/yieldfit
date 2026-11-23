// Da o quita el rol de administrador a un usuario (bloque 11b, paso 11b.1).
//
// Uso (desde /server):
//   npm run admin -- correo@ejemplo.com                         → producción, SIMULACIÓN
//   npm run admin -- correo@ejemplo.com --aplicar               → producción, da el rol
//   npm run admin -- correo@ejemplo.com --quitar --aplicar      → producción, lo quita
//   npm run admin -- correo@ejemplo.com --desarrollo [--aplicar] → base de desarrollo
//
// Por qué un script y no un endpoint: si existiera una ruta para dar el rol de admin, el
// único obstáculo para que alguien se lo diera sería un fallo en esa ruta. Así, el rol solo
// se cambia con acceso a la base, que en producción exige el usuario temporal de Atlas
// (procedimiento de reparaciones, docs/operaciones.md).
//
// Protecciones:
//   - Sin --aplicar no escribe nada: enseña qué cambiaría.
//   - En producción con --aplicar exige un backup de hace menos de 60 minutos.
//   - El email tiene que corresponder a exactamente un usuario.
//
// Como los demás scripts, usa el driver directamente (sin los modelos de Mongoose).

import { conectar, desconectar, ocultarCredenciales } from './lib/conexion.js';
import { comprobarBackupReciente } from './lib/backupReciente.js';

const SERVICIO_LLAVERO = 'yieldfit-reparacion';

const argumentos = process.argv.slice(2);
const desarrollo = argumentos.includes('--desarrollo');
const aplicar = argumentos.includes('--aplicar');
const quitar = argumentos.includes('--quitar');
const email = argumentos.find((a) => !a.startsWith('--'))?.toLowerCase().trim();

const rolNuevo = quitar ? 'usuario' : 'admin';

const main = async () => {
  if (!email) {
    throw new Error('Falta el email. Uso: npm run admin -- correo@ejemplo.com [--quitar] [--aplicar]');
  }

  if (!desarrollo && aplicar) {
    const backup = comprobarBackupReciente();
    console.log(`Backup previo: ${backup.nombre} (hace ${backup.minutos} min)`);
  }

  const db = await conectar({ desarrollo, servicioLlavero: SERVICIO_LLAVERO });
  const usuarios = db.collection('users');
  console.log(`Base: ${db.databaseName} · ${aplicar ? 'APLICANDO CAMBIOS' : 'SIMULACIÓN (no escribe nada)'}`);
  console.log();

  // El email es único en el modelo, pero se comprueba igual: si hubiera 0 o 2, mejor parar.
  const encontrados = await usuarios.find({ email }, { projection: { _id: 1, rol: 1 } }).toArray();
  if (encontrados.length !== 1) {
    throw new Error(`Se esperaba 1 usuario con ese email y hay ${encontrados.length}. No se ha tocado nada.`);
  }
  const [usuario] = encontrados;
  // Sin el campo en la base = 'usuario' (el valor por defecto del modelo).
  const rolActual = usuario.rol ?? 'usuario';
  console.log(`Usuario ${usuario._id}: rol actual "${rolActual}" → "${rolNuevo}"`);

  if (rolActual === rolNuevo) {
    console.log('Ya tiene ese rol: no hay nada que cambiar.');
  } else if (!aplicar) {
    console.log();
    console.log('Para aplicarlo, repite con --aplicar.');
  } else {
    // updatedAt no se toca: dice cuándo cambió el usuario su perfil, y esto no lo es.
    const cambio = await usuarios.updateOne({ _id: usuario._id }, { $set: { rol: rolNuevo } });
    if (cambio.modifiedCount !== 1) {
      throw new Error('El usuario no se ha modificado.');
    }
    console.log('Hecho. Tiene efecto en su siguiente petición, sin volver a iniciar sesión.');
  }

  // Para detectar de un vistazo un admin que no debería estar ahí.
  const admins = await usuarios.countDocuments({ rol: 'admin' });
  console.log(`Admins en esta base: ${admins}`);
};

main()
  .catch((error) => {
    console.error(`Abortado: ${ocultarCredenciales(error.message)}`);
    process.exitCode = 1;
  })
  .finally(desconectar);
