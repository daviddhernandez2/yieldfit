// Pruebas de formato. Ejecutar desde client/: node src/utils/formato.test.js
import assert from 'node:assert/strict';
import { formatConSigno, formatDuracion, formatFechaRelativa, formatKg, formatPorcentaje, nombreMes } from './formato.js';

assert.equal(formatConSigno(3.14), '+3,1');
assert.equal(formatConSigno(-2), '-2');
assert.equal(formatConSigno(0), '0');
assert.equal(formatConSigno(0.04), '0'); // redondea a 0: sin signo
assert.equal(formatConSigno(12.45), '+12,4'); // un decimal (redondeo de toFixed)
assert.equal(formatPorcentaje(3.14), '+3,1%');
assert.equal(formatPorcentaje(-7.25), '-7,3%');

// Fechas relativas, con un "ahora" fijo: martes 24 de noviembre de 2026 a las 12:00.
const ahora = new Date(2026, 10, 24, 12, 0);
assert.equal(formatFechaRelativa(new Date(2026, 10, 24, 8, 5), ahora), 'hoy, 08:05');
assert.equal(formatFechaRelativa(new Date(2026, 10, 23, 18, 15), ahora), 'ayer, 18:15');
assert.equal(formatFechaRelativa(new Date(2026, 10, 20, 18, 15), ahora), 'viernes, 18:15');
assert.equal(formatFechaRelativa(new Date(2026, 10, 12, 18, 15), ahora), '12 nov, 18:15');
assert.equal(formatFechaRelativa(new Date(2025, 10, 12, 18, 15), ahora), '12 nov 2025, 18:15');
assert.equal(nombreMes('2026-10'), 'octubre');
assert.equal(nombreMes('2027-01'), 'enero');

assert.equal(formatKg(103.33), '103,3');
assert.equal(formatKg(110), '110');
assert.equal(formatKg(129.17), '129,2');

assert.equal(formatDuracion(59), '0 min');
assert.equal(formatDuracion(52 * 60), '52 min');
assert.equal(formatDuracion(65 * 60 + 30), '1h 5 min');
assert.equal(formatDuracion(120 * 60), '2h 0 min');

console.log('formato: todas las pruebas pasan');
