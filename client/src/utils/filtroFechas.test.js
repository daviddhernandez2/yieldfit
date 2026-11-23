// Pruebas de limitesDias. Ejecutar desde client/: TZ=Europe/Madrid node src/utils/filtroFechas.test.js
import assert from 'node:assert/strict';
import { limitesDias } from './filtroFechas.js';

// Sin días: sin límites.
assert.deepEqual(limitesDias('', ''), { desde: undefined, hasta: undefined });

// Un día en invierno (UTC+1): de las 00:00 locales a las 00:00 del día siguiente.
assert.deepEqual(limitesDias('2026-01-15', '2026-01-15'), {
  desde: '2026-01-14T23:00:00.000Z',
  hasta: '2026-01-15T23:00:00.000Z',
});

// Fin de mes y de año.
assert.equal(limitesDias('', '2026-12-31').hasta, '2026-12-31T23:00:00.000Z');

// Cambio de hora de primavera (29-3-2026, el día dura 23 h): el día siguiente empieza en
// UTC+2, así que "hasta" es a las 22:00 UTC, no a las 23:00.
assert.deepEqual(limitesDias('2026-03-29', '2026-03-29'), {
  desde: '2026-03-28T23:00:00.000Z',
  hasta: '2026-03-29T22:00:00.000Z',
});

console.log('filtroFechas: todas las pruebas pasan');
