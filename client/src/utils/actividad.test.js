// Pruebas de utils/actividad.js. Desde client/: node src/utils/actividad.test.js
import assert from 'node:assert/strict';
import { alturasBarras, mediaPorSemana, textoRacha } from './actividad.js';

const s = (...n) => n.map((sesiones) => ({ sesiones }));
assert.equal(mediaPorSemana(s(3, 4, 3, 3, 2, 4, 3, 3, 4, 3, 2, 3)), 3.1);
assert.equal(mediaPorSemana([]), 0);
assert.deepEqual(alturasBarras(s(0, 2, 4)), [0, 50, 100]);
assert.deepEqual(alturasBarras(s(0, 0)), [0, 0]);
assert.equal(textoRacha({ semanas: 5, masDe: false }), '5 semanas');
assert.equal(textoRacha({ semanas: 1, masDe: false }), '1 semana');
assert.equal(textoRacha({ semanas: 104, masDe: true }), 'más de 104 semanas');
console.log('actividad: todo correcto');
