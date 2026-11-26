// Pruebas del lector del CSV de Strong (utils/importarStrong.js, bloque 7b). Sin base de datos:
// desde /server,
//   node utils/importarStrong.test.js
// Usa scripts/fixtures/strong-ejemplo.csv, con datos inventados (el CSV real de David nunca entra
// en el repo).

import { readFileSync } from 'node:fs';
import {
  leerCsvStrong, agruparSesiones, leerNumero, leerDuracion, juntarNotas, ErrorImportacion, MAX_NOTAS,
} from './importarStrong.js';

let fallos = 0;
const ok = (desc, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bien) fallos++;
  console.log(`${bien ? 'OK   ' : 'FALLO'} ${desc}: ${JSON.stringify(real)}${bien ? '' : '  (esperado ' + JSON.stringify(esperado) + ')'}`);
};
// El mensaje del ErrorImportacion que lanza fn, o null si no lanza.
const errorDe = (fn) => {
  try {
    fn();
    return null;
  } catch (e) {
    return e instanceof ErrorImportacion ? `${e.status} ${e.message}` : `OTRO ${e.message}`;
  }
};

// --- Piezas sueltas ---
ok('leerNumero', [leerNumero('64.0'), leerNumero('64,5'), leerNumero(''), leerNumero(' 7 ')], [64, 64.5, null, 7]);
ok('leerNumero con basura → NaN', [leerNumero('doce'), leerNumero('1.2.3')].map(Number.isNaN), [true, true]);
ok('leerDuracion', ['1 h 24 min', '45 min', '1h 24m', '38 s', '2 h', '', 'mucho'].map(leerDuracion), [5040, 2700, 5040, 38, 7200, null, null]);
ok('juntarNotas sin nada → null', juntarNotas('', []), { notas: null, cortadas: false });
ok(
  'juntarNotas: entreno y series, una por línea',
  juntarNotas('Día flojo', [{ ejercicio: 'Squat', numeroSerie: 2, texto: 'bien' }]).notas,
  'Día flojo\nSerie 2 (Squat): bien'
);
const larga = juntarNotas('x'.repeat(600), []);
ok('juntarNotas corta a 500 con "…"', [larga.notas.length, larga.notas.endsWith('…'), larga.cortadas], [MAX_NOTAS, true, true]);

// --- El archivo de ejemplo ---
const csv = readFileSync(new URL('../scripts/fixtures/strong-ejemplo.csv', import.meta.url), 'utf8');
const { idioma, filas } = leerCsvStrong(csv);
ok('idioma y número de filas (la nota con salto de línea es una sola fila)', [idioma, filas.length], ['es', 19]);

const kg = agruparSesiones(filas, { unidad: 'kg', zona: 'Europe/Madrid', idioma });
ok('sesiones válidas, en orden de fecha (la del 31 de febrero no entra)', kg.sesiones.map((s) => s.clave), [
  '2026-01-10 18:00:00', '2026-05-16 13:26:22', '2026-05-20 07:30:00',
]);
const [pierna, espalda, run] = kg.sesiones;
ok('fecha en UTC (Madrid, invierno y verano)', [pierna.fecha.toISOString(), espalda.fecha.toISOString()], [
  '2026-01-10T17:00:00.000Z', '2026-05-16T11:26:22.000Z',
]);
ok('nombre con coma y duración', [espalda.nombre, espalda.duracionSegundos, pierna.duracionSegundos], ['Espalda, hombro', 2700, 3900]);
ok('ejercicios de la sesión', pierna.ejercicios.map((e) => e.nombreStrong), ['Squat (Barbell)', 'Leg Curl (Machine)']);
ok(
  'series del squat: RPE 8 y 8,5 entran, el 11 se quita',
  pierna.ejercicios[0].series.map((s) => [s.numeroSerie, s.peso, s.reps, s.rpe ?? null]),
  [[1, 100, 5, 8], [2, 102.5, 5, 8.5], [3, 105, 4, null]]
);
ok('la serie vacía del curl femoral no entra', pierna.ejercicios[1].series.length, 1);
ok('notas: la del entreno y la de la serie (con su salto de línea)', pierna.notas, 'Día flojo\nSerie 2 (Squat (Barbell)): Rodilla bien,\nsin molestias');
ok('descanso: el que más se repite (120, 90, 120 → 120)', espalda.ejercicios[0].descansoSegundos, 120);
ok('dominadas con peso 0 y reps', espalda.ejercicios[0].series.map((s) => [s.peso, s.reps]), [[0, 10], [0, 8], [0, 7]]);
ok('face pull: la fila con "doce" no entra, la otra sí', espalda.ejercicios[1].series.map((s) => s.reps), [15]);
ok('sin descanso en el CSV → null', espalda.ejercicios[1].descansoSegundos, null);
ok('carrera: km → metros y tiempo en segundos', run.ejercicios[0].series.map((s) => [s.distanciaMetros, s.tiempoSegundos]), [[3470, 1293]]);
ok('errores con su fila', kg.errores.map((e) => e.mensaje.slice(0, 20)), ['Valor que no es un n', 'Fecha que no se enti']);
ok('series que no se importarán (la de "doce" y la del 31 de febrero)', [kg.totalErrores, kg.seriesDescartadas], [2, 2]);
ok('avisos', kg.avisos, { seriesVacias: 1, rpeQuitados: 1, nombresCortados: 0, notasCortadas: 0, duracionesSinLeer: 0, horasInexistentes: 0 });
ok('una sesión a una hora que no existe entra, movida y con aviso', (() => {
  const r = agruparSesiones([{ fila: 2, fecha: '2026-03-29 02:30:00', entrenamiento: 'Madrugada', duracion: '', ejercicio: 'Pull Up', orden: '1', peso: '0', reps: '5', distancia: '', segundos: '', notas: '', notasEntreno: '', rpe: '' }],
    { unidad: 'kg', zona: 'Europe/Madrid', idioma: 'es' });
  return [r.sesiones[0].clave, r.sesiones[0].fecha.toISOString(), r.avisos.horasInexistentes];
})(), ['2026-03-29 02:30:00', '2026-03-29T01:30:00.000Z', 1]);

const lb = agruparSesiones(filas, { unidad: 'lb', zona: 'Europe/Madrid', idioma });
ok('en libras: peso a kg y distancia en millas', [lb.sesiones[0].ejercicios[0].series[0].peso, lb.sesiones[2].ejercicios[0].series[0].distanciaMetros], [45.36, 5584]);
ok('otra zona cambia el instante, no la clave', (() => {
  const ny = agruparSesiones(filas, { unidad: 'kg', zona: 'America/New_York', idioma }).sesiones[0];
  return [ny.clave, ny.fecha.toISOString()];
})(), ['2026-01-10 18:00:00', '2026-01-10T23:00:00.000Z']);

// --- En inglés y con BOM ---
const ingles = '﻿Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE\n'
  + '2026-03-01 10:00:00,"Push",50 min,"Bench Press (Barbell)",1,135,8,0,0,"","",\n'
  + '2026-03-01 10:00:00,"Push",50 min,"Bench Press (Barbell)",Rest Timer,0,0,0,150,,,\n';
const en = leerCsvStrong(ingles);
const enSes = agruparSesiones(en.filas, { unidad: 'lb', zona: 'UTC', idioma: en.idioma }).sesiones;
ok('inglés con BOM y libras', [en.idioma, enSes[0].ejercicios[0].series[0].peso, enSes[0].ejercicios[0].descansoSegundos], ['en', 61.23, 150]);

// --- Archivos que no sirven ---
ok('vacío', errorDe(() => leerCsvStrong('   ')), '400 El archivo está vacío');
ok('solo cabecera', errorDe(() => leerCsvStrong(csv.split('\n')[0])), '400 El archivo no tiene ningún entreno');
ok('otra cabecera', errorDe(() => leerCsvStrong('a,b,c\n1,2,3')).startsWith('400 No parece un CSV de Strong'), true);
ok('comillas sin cerrar', errorDe(() => leerCsvStrong(csv + '2026-06-01 10:00:00,"Roto,1 h,"X,1,10,5,0,0,,,\n')).startsWith('400 El archivo no es un CSV válido'), true);
ok('más filas que el límite', errorDe(() => leerCsvStrong(csv, { limiteFilas: 5 })), '400 El archivo tiene más de 5 filas');
ok('unidad que no existe', errorDe(() => agruparSesiones(filas, { unidad: 'st', zona: 'UTC' })), '400 La unidad tiene que ser kg o lb');

console.log(fallos === 0 ? '\nTODO CORRECTO' : `\n${fallos} FALLOS`);
if (fallos > 0) process.exitCode = 1;
