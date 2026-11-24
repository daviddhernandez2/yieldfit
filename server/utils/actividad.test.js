// Pruebas de la actividad del Dashboard (utils/actividad.js). Desde /server:
//   node utils/actividad.test.js
import { MAX_SEMANAS_RACHA, calcularActividad, diaLocal, lunesDe } from './actividad.js';

let fallos = 0;
const ok = (desc, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bien) fallos++;
  console.log(`${bien ? 'OK   ' : 'FALLO'} ${desc}: ${JSON.stringify(real)}${bien ? '' : '  (esperado ' + JSON.stringify(esperado) + ')'}`);
};
const M = 'Europe/Madrid';
// Martes 24 de noviembre de 2026, 12:00 en Madrid.
const ahora = new Date('2026-11-24T11:00:00Z');
const ses = (iso, minutos = 60) => ({ fecha: new Date(iso), duracionSegundos: minutos * 60 });

ok('lunes de un martes', lunesDe('2026-11-24'), '2026-11-23');
ok('lunes de un domingo', lunesDe('2026-11-29'), '2026-11-23');
ok('lunes de un lunes', lunesDe('2026-11-23'), '2026-11-23');
// Domingo 22 a las 23:30 en Madrid son las 22:30 UTC del mismo domingo (UTC+1 en noviembre).
ok('día en la zona del usuario', diaLocal(new Date('2026-11-22T22:30:00Z'), M), '2026-11-22');
ok('el mismo instante en UTC ya es otro día', diaLocal(new Date('2026-11-22T23:30:00Z'), 'UTC'), '2026-11-22');
ok('y en Madrid es lunes', diaLocal(new Date('2026-11-22T23:30:00Z'), M), '2026-11-23');

let a = calcularActividad([], M, ahora);
ok('sin sesiones: 12 semanas a cero', [a.semanas.length, a.semanas.every((s) => s.sesiones === 0)], [12, true]);
ok('sin sesiones: racha 0', a.racha, { semanas: 0, masDe: false });
ok('semanas de la más antigua a la actual', [a.semanas[0].inicio, a.semanas.at(-1).inicio], ['2026-09-07', '2026-11-23']);

a = calcularActividad([ses('2026-11-24T08:00:00Z', 50), ses('2026-11-23T17:00:00Z', 40), ses('2026-11-18T17:00:00Z')], M, ahora);
ok('sesiones y minutos de la semana actual', [a.semanas.at(-1).sesiones, a.semanas.at(-1).segundos], [2, 5400]);
ok('semana anterior', a.semanas.at(-2).sesiones, 1);
ok('racha de 2 semanas', a.racha.semanas, 2);

// La semana en curso sin sesiones aún no rompe la racha.
a = calcularActividad([ses('2026-11-18T17:00:00Z'), ses('2026-11-11T17:00:00Z'), ses('2026-10-28T17:00:00Z')], M, ahora);
ok('sin sesiones esta semana: cuenta desde la anterior y se corta en el hueco', a.racha.semanas, 2);

// Domingo por la noche en Madrid cuenta en esa semana, no en la siguiente.
a = calcularActividad([ses('2026-11-22T22:30:00Z')], M, ahora);
ok('domingo 23:30 en Madrid: semana del 16', [a.semanas.at(-1).sesiones, a.semanas.at(-2).sesiones], [0, 1]);

// Meses
a = calcularActividad([ses('2026-11-02T10:00:00Z'), ses('2026-11-20T10:00:00Z'), ses('2026-10-31T23:30:00Z'), ses('2026-10-05T10:00:00Z')], M, ahora);
ok('este mes y el anterior (el 31 a las 23:30 UTC ya es 1 de noviembre en Madrid)', a.mes, { mes: '2026-11', actual: 3, mesAnterior: '2026-10', anterior: 1 });
ok('enero: el mes anterior es diciembre del año pasado',
  calcularActividad([], M, new Date('2027-01-10T10:00:00Z')).mes, { mes: '2027-01', actual: 0, mesAnterior: '2026-12', anterior: 0 });

// Tope de la racha
const muchas = Array.from({ length: MAX_SEMANAS_RACHA + 5 }, (_, i) => ses(new Date(ahora.getTime() - i * 7 * 864e5).toISOString()));
ok('racha larga: tope y "más de"', calcularActividad(muchas, M, ahora).racha, { semanas: MAX_SEMANAS_RACHA, masDe: true });

console.log(fallos === 0 ? '\nTodo bien.' : `\n${fallos} fallo(s).`);
process.exitCode = fallos === 0 ? 0 : 1;
