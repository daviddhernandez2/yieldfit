// Pruebas de los récords en el cliente. Ejecutar desde client/: node src/utils/records.test.js
import assert from 'node:assert/strict';
import { listarNombres, recordsDeSesion } from './records.js';

const sesion = {
  ejercicios: [
    { exerciseId: 'a', nombreSnapshot: 'Press banca', mejor1RM: 113.67, esPR: true, prAnterior: 103.33 },
    { exerciseId: 'b', nombreSnapshot: 'Remo', mejor1RM: 80 },
    { exerciseId: 'c', nombreSnapshot: 'Sentadilla', mejor1RM: 150, esPR: true, prAnterior: 140 },
  ],
};
assert.deepEqual(recordsDeSesion(sesion), [
  { exerciseId: 'a', nombre: 'Press banca', anterior: 103.33, nuevo: 113.67 },
  { exerciseId: 'c', nombre: 'Sentadilla', anterior: 140, nuevo: 150 },
]);
assert.deepEqual(recordsDeSesion({ ejercicios: [{ nombreSnapshot: 'Remo', mejor1RM: 80 }] }), []);
assert.deepEqual(recordsDeSesion(undefined), []);

assert.equal(listarNombres([]), '');
assert.equal(listarNombres(['Press banca']), 'Press banca');
assert.equal(listarNombres(['Press banca', 'Sentadilla']), 'Press banca y Sentadilla');
assert.equal(listarNombres(['A', 'B', 'C']), 'A, B y C');

console.log('records: todo correcto');
