// Pone una contraseña temporal a un usuario que ha olvidado la suya (bloque 11b, paso 11b.5).
//
// Uso (desde /server):
//   npm run restablecer -- correo@ejemplo.com                          → producción, SIMULACIÓN
//   npm run restablecer -- correo@ejemplo.com --aplicar                → producción, la cambia
//   npm run restablecer -- correo@ejemplo.com --desarrollo [--aplicar] → base de desarrollo
//
// Es la recuperación de la beta (decisión de David): sin servicio de email, el usuario te pide
// ayuda, ejecutas esto, le das la contraseña temporal por un canal seguro (en persona, una app
// de mensajería cifrada) y él la cambia en Perfil → "Cambiar contraseña" al entrar. Cuando la
// app salga de la beta, esto lo sustituirá un enlace por email.
//
// Qué hace, en una transacción:
//   1. Guarda el hash de una contraseña aleatoria nueva.
//   2. Borra todos sus tokens de renovación: se cierran sus sesiones en todos los dispositivos
//      (si la olvidó porque alguien se la cambió, ese alguien queda fuera).
// La contraseña temporal se imprime UNA vez en la terminal y no se guarda en ningún sitio:
// en la base solo queda su hash.
//
// Protecciones, como en los demás scripts que escriben: sin --aplicar no escribe; en
// producción con --aplicar exige un backup de hace menos de 60 minutos; el email tiene que
// corresponder a exactamente un usuario. Usa el driver directamente (sin los modelos).

import { randomInt } from 'node:crypto';
import bcrypt from 'bcrypt';
import { conectar, desconectar, obtenerCliente, ocultarCredenciales } from './lib/conexion.js';
import { comprobarBackupReciente } from './lib/backupReciente.js';

const SERVICIO_LLAVERO = 'yieldfit-reparacion';
// El mismo coste que usa el modelo User en pre('save') (genSalt(10)). Como el script no usa
// el modelo, el hash se calcula aquí.
const RONDAS_BCRYPT = 10;

// Sin letras ni números que se confundan al dictarlos o copiarlos (0/o, 1/l/i).
const ALFABETO = 'abcdefghjkmnpqrstuvwxyz23456789';

// 4 bloques de 4: "k7mq-x3ra-9fpt-w2hn". 16 caracteres de 31 posibles: unos 79 bits de azar,
// imposible de adivinar, y legible para dictarla. randomInt usa el generador criptográfico
// del sistema (Math.random no sirve para secretos).
const generarTemporal = () =>
  Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => ALFABETO[randomInt(ALFABETO.length)]).join('')
  ).join('-');

const argumentos = process.argv.slice(2);
const desarrollo = argumentos.includes('--desarrollo');
const aplicar = argumentos.includes('--aplicar');
const email = argumentos.find((a) => !a.startsWith('--'))?.toLowerCase().trim();

const main = async () => {
  if (!email) {
    throw new Error('Falta el email. Uso: npm run restablecer -- correo@ejemplo.com [--aplicar]');
  }

  if (!desarrollo && aplicar) {
    const backup = comprobarBackupReciente();
    console.log(`Backup previo: ${backup.nombre} (hace ${backup.minutos} min)`);
  }

  const db = await conectar({ desarrollo, servicioLlavero: SERVICIO_LLAVERO });
  const usuarios = db.collection('users');
  const tokens = db.collection('refreshtokens');
  console.log(`Base: ${db.databaseName} · ${aplicar ? 'APLICANDO CAMBIOS' : 'SIMULACIÓN (no escribe nada)'}`);
  console.log();

  const encontrados = await usuarios.find({ email }, { projection: { _id: 1 } }).toArray();
  if (encontrados.length !== 1) {
    throw new Error(`Se esperaba 1 usuario con ese email y hay ${encontrados.length}. No se ha tocado nada.`);
  }
  const [usuario] = encontrados;
  const sesiones = await tokens.countDocuments({ userId: usuario._id });
  console.log(`Usuario ${usuario._id}: se le pondrá una contraseña temporal y se cerrarán sus sesiones (${sesiones} tokens de renovación).`);

  if (!aplicar) {
    console.log();
    console.log('Para aplicarlo, repite con --aplicar.');
    return;
  }

  const temporal = generarTemporal();
  const hash = await bcrypt.hash(temporal, RONDAS_BCRYPT);

  const session = obtenerCliente().startSession();
  try {
    await session.withTransaction(async () => {
      // updatedAt sí se actualiza: la contraseña es parte de la cuenta y ha cambiado.
      const cambio = await usuarios.updateOne(
        { _id: usuario._id },
        { $set: { password: hash, updatedAt: new Date() } },
        { session }
      );
      if (cambio.modifiedCount !== 1) throw new Error('El usuario no se ha modificado.');
      await tokens.deleteMany({ userId: usuario._id }, { session });
    });
  } finally {
    await session.endSession();
  }

  console.log();
  console.log(`Contraseña temporal: ${temporal}`);
  console.log();
  console.log('No se guarda en ningún sitio: cópiala ahora. Dásela por un canal seguro y pídele');
  console.log('que la cambie en Perfil → "Cambiar contraseña" en cuanto entre.');
};

main()
  .catch((error) => {
    console.error(`Abortado: ${ocultarCredenciales(error.message)}`);
    process.exitCode = 1;
  })
  .finally(desconectar);
