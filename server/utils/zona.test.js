// Pruebas de fechaLocalAUtc (utils/zona.js). Sin dependencias: desde /server,
//   node utils/zona.test.js
import { fechaLocalAUtc, zonaValida } from './zona.js';

let fallos = 0;
const ok = (desc, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bien) fallos++;
  console.log(`${bien ? 'OK   ' : 'FALLO'} ${desc}: ${JSON.stringify(real)}${bien ? '' : '  (esperado ' + JSON.stringify(esperado) + ')'}`);
};
const iso = (t, z) => fechaLocalAUtc(t, z)?.fecha.toISOString() ?? null;
const ajuste = (t, z) => fechaLocalAUtc(t, z)?.ajuste;

ok('Madrid en verano (UTC+2)', iso('2026-05-16 13:26:22', 'Europe/Madrid'), '2026-05-16T11:26:22.000Z');
ok('Madrid en invierno (UTC+1)', iso('2026-01-10 18:00:00', 'Europe/Madrid'), '2026-01-10T17:00:00.000Z');
ok('justo después del cambio de octubre', iso('2026-10-25 03:30:00', 'Europe/Madrid'), '2026-10-25T02:30:00.000Z');
ok('Nueva York (UTC−5 en invierno)', iso('2026-01-10 18:00:00', 'America/New_York'), '2026-01-10T23:00:00.000Z');
ok('UTC', iso('2026-05-16 13:26:22', 'UTC'), '2026-05-16T13:26:22.000Z');
ok('sin segundos también vale', iso('2026-05-16 13:26', 'Europe/Madrid'), '2026-05-16T11:26:00.000Z');
ok('texto que no es una fecha → null', [iso('16/05/2026 13:26', 'UTC'), iso('', 'UTC'), iso('ayer', 'UTC')], [null, null, null]);
// Cambios de hora en Madrid en 2026: 29 de marzo (de 02:00 a 03:00) y 25 de octubre (de 03:00 a 02:00).
ok('hora que no existe (29 mar, 02:30) → 03:30 de verano, con aviso',
  [iso('2026-03-29 02:30:00', 'Europe/Madrid'), ajuste('2026-03-29 02:30:00', 'Europe/Madrid')], ['2026-03-29T01:30:00.000Z', 'inexistente']);
ok('hora doble (25 oct, 02:30) → la primera, en horario de verano',
  [iso('2026-10-25 02:30:00', 'Europe/Madrid'), ajuste('2026-10-25 02:30:00', 'Europe/Madrid')], ['2026-10-25T00:30:00.000Z', 'doble']);
ok('el resto del día del cambio, sin ajuste',
  ['2026-03-29 01:59:59', '2026-03-29 03:00:00', '2026-10-25 01:59:59', '2026-10-25 03:00:00'].map((t) => [iso(t, 'Europe/Madrid'), ajuste(t, 'Europe/Madrid')]),
  [['2026-03-29T00:59:59.000Z', null], ['2026-03-29T01:00:00.000Z', null], ['2026-10-24T23:59:59.000Z', null], ['2026-10-25T02:00:00.000Z', null]]);
ok('Nueva York: 8 mar 02:30 no existe → 03:30 (UTC−4)', iso('2026-03-08 02:30:00', 'America/New_York'), '2026-03-08T07:30:00.000Z');
ok('fechas imposibles → null', [iso('2026-02-31 10:00:00', 'UTC'), iso('2026-05-16 25:00:00', 'UTC')], [null, null]);
ok('zonaValida sigue igual', [zonaValida('Europe/Madrid'), zonaValida('Marte/Olimpo')], [true, false]);

console.log(fallos === 0 ? '\nTODO CORRECTO' : `\n${fallos} FALLOS`);
if (fallos > 0) process.exitCode = 1;
