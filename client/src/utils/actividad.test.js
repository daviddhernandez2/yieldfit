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
// En M (por defecto): sin pie; "seguidas" en la unidad y el aviso en la cabecera (dato).
assert.deepEqual(textosRacha({ semanas: 3, masDe: false, estado: 'activa' }), { etiqueta: 'Racha', cifra: '3', unidad: 'semanas seguidas', pie: null, dato: null, accesible: 'Racha: 3 semanas seguidas entrenando' });
assert.equal(textosRacha({ semanas: 1, masDe: false, estado: 'activa' }).unidad, 'semana seguida');
assert.deepEqual(textosRacha({ semanas: 3, masDe: false, estado: 'enRiesgo' }, 'M'), { etiqueta: 'Racha · en riesgo', cifra: '3', unidad: 'semanas', pie: null, dato: 'Entrena esta semana', accesible: 'Racha en riesgo: 3 semanas. Entrena esta semana para mantenerla' });
assert.deepEqual([textosRacha({ semanas: 0, masDe: false, estado: 'rota' }).cifra, textosRacha({ semanas: 0, masDe: false, estado: 'rota' }).pie, textosRacha({ semanas: 0, masDe: false, estado: 'rota' }).dato], [null, null, 'Empieza una nueva']);
// En P: sin unidad junto a la cifra (no cabía a 375 px); "semanas" va al pie. Sin dato.
assert.deepEqual(textosRacha({ semanas: 3, masDe: false, estado: 'activa' }, 'P'), { etiqueta: 'Racha', cifra: '3', unidad: null, pie: 'semanas seguidas', dato: null, accesible: 'Racha: 3 semanas seguidas entrenando' });
assert.equal(textosRacha({ semanas: 1, masDe: false, estado: 'activa' }, 'P').pie, 'semana seguida');
assert.equal(textosRacha({ semanas: 3, masDe: false, estado: 'enRiesgo' }, 'P').pie, 'semanas · entrena esta semana');
assert.equal(textosRacha({ semanas: 0, masDe: false, estado: 'rota' }, 'P').pie, 'Empieza una racha nueva');
assert.equal(textosRacha({ semanas: 104, masDe: true, estado: 'activa' }).cifra, '+104');
assert.equal(semanasQueCaben(422, 32), 21);
assert.equal(semanasQueCaben(310, 32), 15);
assert.equal(semanasQueCaben(636, 32), 32);
assert.equal(semanasQueCaben(2000, 32), 32);
assert.equal(semanasQueCaben(0, 32), 0);
console.log('actividad: todo correcto');
