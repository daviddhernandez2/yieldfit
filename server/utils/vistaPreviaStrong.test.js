// Pruebas de la vista previa de Strong (utils/vistaPreviaStrong.js, bloque 7b). Sin base de datos:
// desde /server,
//   node utils/vistaPreviaStrong.test.js

import { readFileSync } from 'node:fs';
import { agruparSesiones, leerCsvStrong } from './importarStrong.js';
import { buscarCoincidencias, montarVistaPrevia, rangoParaCoincidencias, separarYaImportadas } from './vistaPreviaStrong.js';
import { exercisePresets } from '../data/exercisePresets.js';

let fallos = 0;
const ok = (desc, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bien) fallos++;
  console.log(`${bien ? 'OK   ' : 'FALLO'} ${desc}: ${JSON.stringify(real)}${bien ? '' : '  (esperado ' + JSON.stringify(esperado) + ')'}`);
};

const zona = 'Europe/Madrid';
const { idioma, filas } = leerCsvStrong(readFileSync(new URL('../scripts/fixtures/strong-ejemplo.csv', import.meta.url), 'utf8'));
const agrupado = agruparSesiones(filas, { unidad: 'kg', zona, idioma });
const ejercicios = exercisePresets.map((p, i) => ({ _id: `p${i}`, ...p }));
const claves = agrupado.sesiones.map((s) => s.clave); // enero, 16 de mayo y 20 de mayo

// --- Piezas ---
ok('ya importadas: se separan por la clave', (() => {
  const r = separarYaImportadas(agrupado.sesiones, [claves[0]]);
  return [r.nuevas.map((s) => s.clave), r.yaImportadas];
})(), [[claves[1], claves[2]], 1]);
ok('rango: de la primera a la última, con un día de margen', (() => {
  const r = rangoParaCoincidencias(agrupado.sesiones);
  return [r.desde.toISOString(), r.hasta.toISOString()];
})(), ['2026-01-09T17:00:00.000Z', '2026-05-21T05:30:00.000Z']);
ok('rango sin sesiones → null', rangoParaCoincidencias([]), null);

// El caso que obliga al margen: el primer entreno del CSV es el 10 de enero a las 18:00 (Madrid) y
// la sesión de la app es ese mismo día a las 00:30 de Madrid, que en UTC aún es el 9 a las 23:30.
// Se simula la consulta: primero el filtro de fechas en UTC (lo que hace MongoDB con el rango) y
// después el día en la zona.
ok('sesión de la app a las 00:30 del primer día: entra en el rango y coincide', (() => {
  const r = rangoParaCoincidencias(agrupado.sesiones);
  const madrugada = { nombre: 'Madrugada (app)', fecha: new Date('2026-01-09T23:30:00Z') };
  const enRango = [madrugada].filter((s) => s.fecha >= r.desde && s.fecha <= r.hasta);
  // Sin el margen, la consulta empezaría en la primera sesión del CSV y la dejaría fuera.
  const sinMargen = madrugada.fecha >= agrupado.sesiones[0].fecha;
  return [enRango.length, sinMargen, buscarCoincidencias(agrupado.sesiones, enRango, zona).map((c) => [c.dia, c.sesionesApp[0].nombre])];
})(), [1, false, [['2026-01-10', 'Madrugada (app)']]]);
ok('y lo mismo al final: 23:30 del último día en Madrid, que en UTC es el mismo día', (() => {
  const r = rangoParaCoincidencias(agrupado.sesiones);
  const noche = { nombre: 'Noche (app)', fecha: new Date('2026-05-20T21:30:00Z') }; // 23:30 en Madrid
  return [noche.fecha <= r.hasta, buscarCoincidencias(agrupado.sesiones, [noche], zona).map((c) => c.dia)];
})(), [true, ['2026-05-20']]);

// Coincidencias por día en la zona del usuario: una sesión de la app el 16 de mayo a las 23:30 en
// Madrid es del 16 (en UTC ya es 21:30 del 16) y otra el 20 a las 00:30 de Madrid es del 20 (en
// UTC aún es el 19).
const app = [
  { nombre: 'Espalda (app)', fecha: new Date('2026-05-16T21:30:00Z') },
  { nombre: 'Cardio (app)', fecha: new Date('2026-05-19T22:30:00Z') },
  { nombre: 'Otro día', fecha: new Date('2026-03-01T10:00:00Z') },
];
ok('coincidencias por el día de la zona, no el de UTC', buscarCoincidencias(agrupado.sesiones, app, zona).map((c) => [c.clave, c.dia, c.sesionesApp.map((s) => s.nombre)]), [
  ['2026-05-16 13:26:22', '2026-05-16', ['Espalda (app)']],
  ['2026-05-20 07:30:00', '2026-05-20', ['Cardio (app)']],
]);
ok('en UTC, la del 20 ya no coincide (la de la app es del 19)', buscarCoincidencias(agrupado.sesiones, app, 'UTC').map((c) => c.dia), ['2026-05-16']);

// --- Todo junto ---
const vista = montarVistaPrevia({ agrupado, ejercicios, recordados: [], clavesYaImportadas: [claves[0]], sesionesApp: app, zona });
ok('resumen: solo lo nuevo', vista.resumen, {
  sesiones: 2, series: 5, ejercicios: 3, yaImportadas: 1, desde: '2026-05-16', hasta: '2026-05-20', notasCortadas: 0,
});
ok('los ejercicios de la sesión ya importada no salen', vista.ejercicios.map((e) => e.nombreStrong).sort(), ['Face Pull (Cable)', 'Pull Up', 'Running']);
ok('coincideCon: los que salen en el mismo entreno', vista.ejercicios.map((e) => [e.nombreStrong, e.coincideCon]), [
  ['Face Pull (Cable)', ['Pull Up']], ['Pull Up', ['Face Pull (Cable)']], ['Running', []],
]);
ok('errores y recuentos del CSV, tal cual', [vista.totalErrores, vista.seriesDescartadas, vista.errores.length], [2, 2, 2]);
ok('todo ya importado: nada nuevo', (() => {
  const v = montarVistaPrevia({ agrupado, ejercicios, recordados: [], clavesYaImportadas: claves, sesionesApp: [], zona });
  return [v.resumen.sesiones, v.resumen.yaImportadas, v.resumen.desde, v.ejercicios.length, v.coincidencias.length];
})(), [0, 3, null, 0, 0]);

console.log(fallos === 0 ? '\nTODO CORRECTO' : `\n${fallos} FALLOS`);
if (fallos > 0) process.exitCode = 1;
