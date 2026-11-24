// Comprueba que borrar una cuenta no se olvida ninguna colección: todo modelo con un campo
// userId tiene que estar en MODELOS_DEL_USUARIO. Si mañana se añade un modelo nuevo con
// userId y no se añade a la lista, esta prueba falla.
// Ejecutar desde server/: node utils/borrarCuenta.test.js (no necesita base de datos).
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import mongoose from 'mongoose';
import { MODELOS_DEL_USUARIO } from './borrarCuenta.js';
import { COLECCIONES_DEL_USUARIO } from '../scripts/lib/coleccionesUsuario.js';

const carpeta = new URL('../models/', import.meta.url);
for (const archivo of readdirSync(carpeta).filter((a) => a.endsWith('.js'))) {
  await import(new URL(archivo, carpeta));
}

const conUserId = Object.values(mongoose.models).filter((M) => M.schema.path('userId'));
const enLaLista = new Set(MODELOS_DEL_USUARIO);
const olvidados = conUserId.filter((M) => !enLaLista.has(M)).map((M) => M.modelName);

assert.deepEqual(olvidados, [], `Modelos con userId que borrar una cuenta no borra: ${olvidados.join(', ')}`);
assert.equal(conUserId.length, MODELOS_DEL_USUARIO.length);
// La lista de colecciones de los scripts de mantenimiento (bloque 1c) tiene que ser la misma.
assert.deepEqual(
  [...COLECCIONES_DEL_USUARIO].sort(),
  MODELOS_DEL_USUARIO.map((M) => M.collection.collectionName).sort(),
  'scripts/lib/coleccionesUsuario.js no coincide con MODELOS_DEL_USUARIO',
);
console.log(`borrarCuenta: los ${conUserId.length} modelos con userId se borran con la cuenta (y los scripts usan las mismas colecciones)`);
