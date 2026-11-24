// Pruebas de utils/actividad.js. Desde client/: node src/utils/actividad.test.js
import assert from 'node:assert/strict';
import { alturasBarras, mediaPorSemana, semanasQueCaben, textoRacha, textosRacha } from './actividad.js';

const s = (...n) => n.map((sesiones) => ({ sesiones }));
assert.equal(mediaPorSemana(s(3, 4, 3, 3, 2, 4, 3, 3, 4, 3, 2, 3)), 3.1);
assert.equal(mediaPorSemana([]), 0);
assert.deepEqual(alturasBarras(s(0, 2, 4)), [0, 50, 100]);
assert.deepEqual(alturasBarras(s(0, 0)), [0, 0]);
assert.equal(textoRacha({ semanas: 5, masDe: false }), '5 semanas');
assert.equal(textoRacha({ semanas: 1, masDe: false }), '1 semana');
assert.equal(textoRacha({ semanas: 104, masDe: true }), 'más de 104 semanas');
assert.deepEqual(textosRacha({ semanas: 3, masDe: false, estado: 'activa' }), { etiqueta: 'Racha', cifra: '3', unidad: 'semanas', pie: 'seguidas entrenando', accesible: 'Racha: 3 semanas seguidas entrenando' });
assert.equal(textosRacha({ semanas: 3, masDe: false, estado: 'enRiesgo' }, 'P').pie, 'Entrena esta semana');
assert.equal(textosRacha({ semanas: 3, masDe: false, estado: 'enRiesgo' }, 'M').pie, 'Entrena esta semana para mantenerla');
assert.equal(textosRacha({ semanas: 3, masDe: false, estado: 'enRiesgo' }, 'M').etiqueta, 'Racha · en riesgo');
assert.equal(textosRacha({ semanas: 1, masDe: false, estado: 'activa' }).unidad, 'semana');
assert.deepEqual([textosRacha({ semanas: 0, masDe: false, estado: 'rota' }).cifra, textosRacha({ semanas: 0, masDe: false, estado: 'rota' }).pie], [null, 'Empieza una racha nueva']);
assert.equal(textosRacha({ semanas: 104, masDe: true, estado: 'activa' }).cifra, '+104');
assert.equal(semanasQueCaben(422, 32), 21);
assert.equal(semanasQueCaben(310, 32), 15);
assert.equal(semanasQueCaben(636, 32), 32);
assert.equal(semanasQueCaben(2000, 32), 32);
assert.equal(semanasQueCaben(0, 32), 0);
console.log('actividad: todo correcto');
