// Pruebas del esfuerzo por serie (bloque 5c). Desde client/: node src/utils/esfuerzo.test.js
import assert from 'node:assert/strict';
import { formatEsfuerzo, rpeARir, seMuestra, valorEsfuerzo, valoresEsfuerzo } from './esfuerzo.js';

// El rango llega del servidor; aquí, el mismo que manda hoy (solo para probar).
const RANGO = { min: 1, max: 10, paso: 0.5 };

assert.equal(rpeARir(8.5), 1.5);
assert.equal(rpeARir(10), 0);
assert.deepEqual([seMuestra('rpe'), seMuestra('rir'), seMuestra('no'), seMuestra(undefined)], [true, true, false, false]);

assert.equal(formatEsfuerzo(8.5, 'rpe'), 'RPE 8,5');
assert.equal(formatEsfuerzo(8.5, 'rir'), 'RIR 1,5');
assert.equal(formatEsfuerzo(8, 'rpe'), 'RPE 8');
assert.equal(formatEsfuerzo(10, 'rir'), 'RIR 0');
assert.equal(formatEsfuerzo(8, 'no'), ''); // "no mostrar": nada, aunque haya dato
assert.equal(formatEsfuerzo(undefined, 'rpe'), '');
assert.equal(formatEsfuerzo(null, 'rir'), '');
assert.equal(valorEsfuerzo(7.5, 'rpe'), '7,5');
assert.equal(valorEsfuerzo(7.5, 'no'), null);

const rpe = valoresEsfuerzo(RANGO, 'rpe');
assert.equal(rpe.length, 19);
assert.deepEqual(rpe.slice(0, 3).map((v) => v.etiqueta), ['1', '1,5', '2']);
assert.deepEqual(rpe.slice(-3).map((v) => v.etiqueta), ['9', '9,5', '10']);
const rir = valoresEsfuerzo(RANGO, 'rir');
assert.deepEqual(rir.slice(0, 3).map((v) => v.etiqueta), ['9', '8,5', '8']);
assert.deepEqual(rir.slice(-3).map((v) => v.etiqueta), ['1', '0,5', '0']);
assert.deepEqual(rir.map((v) => v.rpe), rpe.map((v) => v.rpe)); // se guarda siempre el RPE
// Otro rango (si el servidor lo cambiara): sale solo, sin tocar el cliente.
assert.deepEqual(valoresEsfuerzo({ min: 7, max: 10, paso: 1 }, 'rpe').map((v) => v.rpe), [7, 8, 9, 10]);

console.log('esfuerzo: todas las pruebas pasan');
