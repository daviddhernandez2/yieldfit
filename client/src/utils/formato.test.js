// Pruebas de formato. Ejecutar desde client/: node src/utils/formato.test.js
import assert from 'node:assert/strict';
import { formatConSigno, formatPorcentaje } from './formato.js';

assert.equal(formatConSigno(3.14), '+3,1');
assert.equal(formatConSigno(-2), '-2');
assert.equal(formatConSigno(0), '0');
assert.equal(formatConSigno(0.04), '0'); // redondea a 0: sin signo
assert.equal(formatConSigno(12.45), '+12,4'); // un decimal (redondeo de toFixed)
assert.equal(formatPorcentaje(3.14), '+3,1%');
assert.equal(formatPorcentaje(-7.25), '-7,3%');

console.log('formato: todas las pruebas pasan');
