// Pruebas de utils/calendario.js. Desde /client: node src/utils/calendario.test.js
// Se fuerza la zona de Madrid para que los resultados no dependan del ordenador.
process.env.TZ = 'Europe/Madrid';

const { claveDia, rejillaDelMes, rangoDelMes, nombreDelMes, moverMes, rangoDelAnio, rejillaDelAnio, inicioDeMeses, nivelDeDia } = await import('./calendario.js');

let fallos = 0;
const ok = (desc, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bien) fallos++;
  console.log(`${bien ? 'OK   ' : 'FALLO'} ${desc}${bien ? '' : `\n      real:     ${JSON.stringify(real)}\n      esperado: ${JSON.stringify(esperado)}`}`);
};
const numeros = (semana) => semana.map((c) => (c ? c.numero : '·')).join(' ');

// Noviembre de 2026 empieza en domingo: 6 huecos antes del 1.
const nov = rejillaDelMes(2026, 10);
ok('nov 2026: primera semana (lunes a domingo)', numeros(nov[0]), '· · · · · · 1');
ok('nov 2026: última semana', numeros(nov.at(-1)), '30 · · · · · ·');
ok('nov 2026: 6 semanas, todas de 7', nov.map((s) => s.length), [7, 7, 7, 7, 7, 7]);
ok('nov 2026: clave del día 3', nov[1][1], { dia: '2026-11-03', numero: 3 });

// Febrero de 2027 empieza en lunes y tiene 28 días: 4 semanas justas, sin huecos.
ok('feb 2027: 4 semanas sin huecos', rejillaDelMes(2027, 1).map(numeros), [
  '1 2 3 4 5 6 7', '8 9 10 11 12 13 14', '15 16 17 18 19 20 21', '22 23 24 25 26 27 28',
]);
ok('feb 2028 (bisiesto): llega al 29', rejillaDelMes(2028, 1).flat().filter(Boolean).at(-1).numero, 29);

// Rango en UTC: noviembre en Madrid es UTC+1; octubre cambia de hora (UTC+2 → UTC+1).
ok('rango de noviembre en UTC', rangoDelMes(2026, 10), { desde: '2026-10-31T23:00:00.000Z', hasta: '2026-11-30T23:00:00.000Z' });
ok('rango de octubre (cambio de hora dentro)', rangoDelMes(2026, 9), { desde: '2026-09-30T22:00:00.000Z', hasta: '2026-10-31T23:00:00.000Z' });

ok('claveDia en hora local (00:30 del 3 en Madrid)', claveDia(new Date('2026-11-02T23:30:00Z')), '2026-11-03');
ok('nombre del mes', nombreDelMes(2026, 10), 'noviembre de 2026');
ok('mes anterior de enero', moverMes({ anio: 2027, mes: 0 }, -1), { anio: 2026, mes: 11 });
ok('mes siguiente de diciembre', moverMes({ anio: 2026, mes: 11 }, 1), { anio: 2027, mes: 0 });

// --- Vista anual ---
// 2026 empieza en jueves: 3 huecos (lunes a miércoles) en la primera columna.
const anio = rejillaDelAnio(2026);
ok('2026: primera columna (lunes a domingo)', numeros(anio[0]), '· · · 1 2 3 4');
ok('2026: 365 días', anio.flat().filter(Boolean).length, 365);
ok('2028 (bisiesto): 366 días', rejillaDelAnio(2028).flat().filter(Boolean).length, 366);
ok('2026: 53 columnas de 7', [anio.length, anio.every((s) => s.length === 7)], [53, true]);
ok('2026: último día, 31 de diciembre', anio.flat().filter(Boolean).at(-1).dia, '2026-12-31');
const meses = inicioDeMeses(anio);
ok('2026: 12 meses con su columna, enero en la 0', [meses.length, meses[0]], [12, { mes: 0, columna: 0 }]);
ok('2026: febrero empieza en la columna 4 (el 1 es domingo)', meses[1], { mes: 1, columna: 4 });
ok('rango de 2026 en UTC (≤ 366 días)', rangoDelAnio(2026), { desde: '2025-12-31T23:00:00.000Z', hasta: '2026-12-31T23:00:00.000Z' });
ok('niveles de intensidad', [0, 1, 2, 5].map(nivelDeDia), [0, 1, 2, 2]);

console.log(fallos === 0 ? '\nTODO CORRECTO' : `\n${fallos} FALLOS`);
if (fallos > 0) process.exitCode = 1;
