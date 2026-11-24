// Pruebas de los récords personales (utils/records.js). Sin dependencias: desde /server,
//   node utils/records.test.js
// Repetirlas siempre que se cambie el criterio de récord.

import { evaluarEjercicioEnSesion, marcarHistorial } from './records.js';

const P = 'press', S = 'sentadilla', K = 'cardio';
let fallos = 0;
const ok = (desc, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bien) fallos++;
  console.log(`${bien ? 'OK   ' : 'FALLO'} ${desc}: ${JSON.stringify(real)}${bien ? '' : '  (esperado ' + JSON.stringify(esperado) + ')'}`);
};
// Una sesión: ses('s1', [P, 100], [S, 80]). Campos opcionales guardados en el 3.er elemento.
const ses = (_id, ...ejs) => ({
  _id,
  ejercicios: ejs.map(([exerciseId, mejor1RM, guardado = {}]) => ({ exerciseId, mejor1RM, ...guardado })),
});
// Qué sesiones quedan como récord tras marcar desde cero (sin nada guardado).
const prs = (sesiones, id) => marcarHistorial(sesiones, id).cambios.map((c) => c._id);

// --- evaluarEjercicioEnSesion ---
ok('la primera vez no es récord, pero fija la marca',
  evaluarEjercicioEnSesion(null, ses('a', [P, 100]).ejercicios, P), { record: 100, indicePR: null });
ok('superar la marca es récord, con la anterior',
  evaluarEjercicioEnSesion(100, ses('a', [P, 105]).ejercicios, P), { record: 105, indicePR: 0, prAnterior: 100 });
ok('igualar no es récord',
  evaluarEjercicioEnSesion(100, ses('a', [P, 100]).ejercicios, P), { record: 100, indicePR: null });
ok('bajar no es récord ni baja la marca',
  evaluarEjercicioEnSesion(100, ses('a', [P, 90]).ejercicios, P), { record: 100, indicePR: null });
ok('cardio (null) nunca es récord ni marca',
  evaluarEjercicioEnSesion(null, ses('a', [K, null]).ejercicios, K), { record: null, indicePR: null });
ok('series a 0 kg no fijan marca',
  evaluarEjercicioEnSesion(null, ses('a', [P, 0]).ejercicios, P), { record: null, indicePR: null });
ok('repetido en la sesión: solo la mejor aparición',
  evaluarEjercicioEnSesion(100, ses('a', [P, 102], [S, 80], [P, 110]).ejercicios, P), { record: 110, indicePR: 2, prAnterior: 100 });
ok('repetido y empatado: la primera',
  evaluarEjercicioEnSesion(100, ses('a', [P, 110], [P, 110]).ejercicios, P), { record: 110, indicePR: 0, prAnterior: 100 });
ok('otro ejercicio de la sesión no cuenta',
  evaluarEjercicioEnSesion(100, ses('a', [S, 200]).ejercicios, P), { record: 100, indicePR: null });

// --- marcarHistorial ---
const historial = [ses('s1', [P, 100]), ses('s2', [P, 105]), ses('s3', [P, 103]), ses('s4', [P, 110])];
ok('100 → 105 → 103 → 110: récords en s2 y s4', prs(historial, P), ['s2', 's4']);
ok('récord final', marcarHistorial(historial, P).record, 110);
ok('marca que batió s4', marcarHistorial(historial, P).cambios[1].set, { 'ejercicios.0.esPR': true, 'ejercicios.0.prAnterior': 105 });

// El caso de David: 500 kg por error en s2. Con él, s3 y s4 no son récord...
const conError = [ses('s1', [P, 100]), ses('s2', [P, 500]), ses('s3', [P, 105]), ses('s4', [P, 110])];
ok('con el error de 500 kg', prs(conError, P), ['s2']);
// ...y al borrar s2 se recalcula: s3 y s4 pasan a ser récord (decisión b).
ok('al borrar el error', prs(conError.filter((s) => s._id !== 's2'), P), ['s3', 's4']);

// Idempotencia: si lo guardado ya es correcto, no hay cambios.
const correcto = [
  ses('s1', [P, 100]),
  ses('s2', [P, 105, { esPR: true, prAnterior: 100 }]),
];
ok('datos ya correctos: 0 cambios', marcarHistorial(correcto, P).cambios, []);

// Lo guardado que sobra se quita (p. ej. s3 dejó de ser récord al borrar algo).
const sobra = [ses('s1', [P, 100]), ses('s3', [P, 90, { esPR: true, prAnterior: 80 }])];
ok('marca que ya no toca: se quita', marcarHistorial(sobra, P).cambios,
  [{ _id: 's3', set: {}, unset: { 'ejercicios.0.esPR': '', 'ejercicios.0.prAnterior': '' } }]);

// prAnterior distinto (cambió la marca anterior): se corrige.
const anteriorMal = [ses('s1', [P, 100]), ses('s2', [P, 105, { esPR: true, prAnterior: 90 }])];
ok('prAnterior desfasado: se corrige', marcarHistorial(anteriorMal, P).cambios[0].set,
  { 'ejercicios.0.esPR': true, 'ejercicios.0.prAnterior': 100 });

// Sesión a sesión con récord acumulado (como lo usa recalcularRecords) = todo de golpe.
let acumulado = null;
const unoAUno = [];
for (const s of historial) {
  const r = marcarHistorial([s], P, acumulado);
  acumulado = r.record;
  unoAUno.push(...r.cambios.map((c) => c._id));
}
ok('de una en una da lo mismo', [unoAUno, acumulado], [['s2', 's4'], 110]);

// Otro ejercicio en la misma sesión no se toca.
const mezcla = [ses('s1', [S, 50], [P, 100]), ses('s2', [S, 60], [P, 101])];
ok('solo toca las posiciones del ejercicio', marcarHistorial(mezcla, P).cambios[0].set,
  { 'ejercicios.1.esPR': true, 'ejercicios.1.prAnterior': 100 });

console.log(fallos === 0 ? '\nTodo bien.' : `\n${fallos} fallo(s).`);
process.exitCode = fallos === 0 ? 0 : 1;
