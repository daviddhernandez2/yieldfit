// Pruebas de la importación de Strong sin base de datos (utils/construirImportacion.js, bloque 7b).
// Desde /server:
//   node utils/construirImportacion.test.js

import { construirSesiones, validarDecisiones } from './construirImportacion.js';

let fallos = 0;
const ok = (desc, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bien) fallos++;
  console.log(`${bien ? 'OK   ' : 'FALLO'} ${desc}: ${JSON.stringify(real)}${bien ? '' : '  (esperado ' + JSON.stringify(esperado) + ')'}`);
};

const ejercicios = [
  { _id: 'sentadilla', presetId: 'sentadilla', nombre: 'Sentadilla libre', grupoMuscular: 'Piernas', tipo: 'Pesas libres', tracking: '1RM' },
  { _id: 'triceps', nombre: 'Extensión de tríceps en polea', grupoMuscular: 'Brazos', tipo: 'Poleas', tracking: '1RM' },
  { _id: 'carrera', nombre: 'Carrera continua', grupoMuscular: 'Cardio', tipo: 'Cardio', tracking: 'tiempo_distancia' },
];
const necesarios = [{ nombreStrong: 'Squat (Barbell)', cardio: false }, { nombreStrong: 'Running', cardio: true }];
const error = (opciones) => validarDecisiones({ necesarios, ejercicios, ...opciones }).error ?? null;

// --- validarDecisiones ---
ok('todo emparejado', [...validarDecisiones({ necesarios, ejercicios, emparejamientos: { 'Squat (Barbell)': 'sentadilla', Running: 'carrera' } }).asignacion], [
  ['Squat (Barbell)', { exerciseId: 'sentadilla' }], ['Running', { exerciseId: 'carrera' }],
]);
ok('falta uno', error({ emparejamientos: { 'Squat (Barbell)': 'sentadilla' } }), 'Falta emparejar «Running»');
ok('emparejar y crear a la vez', error({
  emparejamientos: { 'Squat (Barbell)': 'sentadilla', Running: 'carrera' }, crear: { Running: { nombre: 'Correr', grupoMuscular: 'Cardio', tipo: 'Cardio' } },
}), '«Running»: se empareja, se crea o no se importa, solo una de las tres');
ok('emparejar y no importar a la vez', error({ emparejamientos: { 'Squat (Barbell)': 'sentadilla', Running: 'carrera' }, omitir: ['Running'] }),
  '«Running»: se empareja, se crea o no se importa, solo una de las tres');
ok('no importar uno: vale, y sin nada más', [...validarDecisiones({ necesarios, ejercicios, emparejamientos: { 'Squat (Barbell)': 'sentadilla' }, omitir: ['Running'] }).asignacion], [
  ['Squat (Barbell)', { exerciseId: 'sentadilla' }], ['Running', { omitir: true }],
]);
ok('no importar ninguno también vale (el controlador dirá que no queda nada)', validarDecisiones({ necesarios, ejercicios, omitir: ['Squat (Barbell)', 'Running'] }).error ?? null, null);
ok('omitir que no es una lista de nombres', [error({ omitir: 'Running' }), error({ omitir: [3] })], [
  'Las decisiones de emparejamiento no son válidas', 'Las decisiones de emparejamiento no son válidas',
]);
ok('un ejercicio que no es suyo (o no existe)', error({ emparejamientos: { 'Squat (Barbell)': 'de-otro', Running: 'carrera' } }), '«Squat (Barbell)»: el ejercicio elegido no existe');
ok('incompatible: fuerza con un cardio (decisión 3)', error({ emparejamientos: { 'Squat (Barbell)': 'carrera', Running: 'carrera' } }),
  '«Squat (Barbell)» no se puede emparejar con «Carrera continua»: uno es de fuerza y el otro no');
ok('incompatible: cardio con uno de fuerza', error({ emparejamientos: { 'Squat (Barbell)': 'sentadilla', Running: 'sentadilla' } }).startsWith('«Running» no se puede emparejar'), true);
ok('crear con un nombre que ya tiene (sin tildes ni mayúsculas)', error({
  emparejamientos: { Running: 'carrera' }, crear: { 'Squat (Barbell)': { nombre: '  sentadilla LIBRE ', grupoMuscular: 'Piernas', tipo: 'Pesas libres' } },
}), 'Ya tienes un ejercicio llamado «sentadilla LIBRE»: emparéjalo con ese');
ok('dos nuevos con el mismo nombre', validarDecisiones({
  necesarios: [{ nombreStrong: 'A', cardio: false }, { nombreStrong: 'B', cardio: false }], ejercicios,
  crear: { A: { nombre: 'Press nuevo', grupoMuscular: 'Pecho', tipo: 'Maquinas' }, B: { nombre: 'press NUEVO', grupoMuscular: 'Pecho', tipo: 'Maquinas' } },
}).error, '«B» y «A» crearían dos ejercicios con el mismo nombre');
ok('crear de fuerza para series de cardio', error({
  emparejamientos: { 'Squat (Barbell)': 'sentadilla' }, crear: { Running: { nombre: 'Correr', grupoMuscular: 'Piernas', tipo: 'Pesas libres' } },
}), '«Running» trae series de cardio: el ejercicio nuevo tiene que ser del mismo tipo');
ok('crear cardio sí se puede aquí (decisión 1), con su tracking', validarDecisiones({
  necesarios, ejercicios, emparejamientos: { 'Squat (Barbell)': 'sentadilla' }, crear: { Running: { nombre: ' Correr ', grupoMuscular: 'Cardio', tipo: 'Cardio' } },
}).asignacion.get('Running'), { crear: { nombre: 'Correr', grupoMuscular: 'Cardio', tipo: 'Cardio', tracking: 'tiempo_distancia' } });
ok('decisiones que no son objetos', error({ emparejamientos: ['x'] }), 'Las decisiones de emparejamiento no son válidas');

// --- construirSesiones ---
const serie = (peso, reps, extra = {}) => ({ peso, reps, tiempoSegundos: 0, distanciaMetros: 0, ...extra });
const sesiones = [{
  clave: '2026-01-10 18:00:00', fecha: new Date('2026-01-10T17:00:00Z'), nombre: 'Brazo', nombreStrong: 'Brazo', duracionSegundos: 3600, notaEntreno: 'Bien',
  ejercicios: [
    { nombreStrong: 'Triceps Extension (Cable)', descansoSegundos: null, series: [serie(30, 10), serie(32.5, 8, { rpe: 8 })] },
    { nombreStrong: 'Squat (Barbell)', descansoSegundos: 180, series: [serie(100, 5)] },
    { nombreStrong: 'Triceps Pushdown (Cable - Straight Bar)', descansoSegundos: 90, series: [serie(40, 12, { nota: 'agarre cerrado' })] },
  ],
}, {
  clave: '2026-01-12 07:00:00', fecha: new Date('2026-01-12T06:00:00Z'), nombre: 'Run', nombreStrong: 'Run', duracionSegundos: null, notaEntreno: '',
  ejercicios: [{ nombreStrong: 'Running', descansoSegundos: null, series: [{ peso: 0, reps: 0, tiempoSegundos: 1293, distanciaMetros: 3470 }] }],
}];
const ejercicioDe = new Map([
  ['Triceps Extension (Cable)', ejercicios[1]], ['Triceps Pushdown (Cable - Straight Bar)', ejercicios[1]],
  ['Squat (Barbell)', ejercicios[0]], ['Running', ejercicios[2]],
]);
const rutinas = [{ _id: 'r-brazo', nombre: 'Brazo' }, { _id: 'r-run1', nombre: 'Run' }, { _id: 'r-run2', nombre: 'Run' }];
const { documentos, seriesSinDatos, juntados } = construirSesiones({ sesiones, ejercicioDe, rutinas, userId: 'u', lote: 'L', origen: 'strong' });
const [brazo, run] = documentos;

ok('dos de Strong al mismo ejercicio: se juntan con las series seguidas (decisión 2)', brazo.ejercicios.map((e) => [e.exerciseId, e.orden, e.sets.map((s) => s.numeroSerie)]), [
  ['triceps', 0, [1, 2, 3]], ['sentadilla', 1, [1]],
]);
ok('y se cuenta', juntados, 1);
ok('el descanso: el primero que hay', brazo.ejercicios[0].descansoSegundos, 90);
ok('series de fuerza: solo peso, reps y RPE', brazo.ejercicios[0].sets, [
  { numeroSerie: 1, peso: 30, reps: 10 }, { numeroSerie: 2, peso: 32.5, reps: 8, rpe: 8 }, { numeroSerie: 3, peso: 40, reps: 12 },
]);
ok('mejor1RM con la misma fórmula que una sesión normal (Epley)', brazo.ejercicios.map((e) => e.mejor1RM), [56, 116.67]);
ok('snapshots del ejercicio de Yield Fit, no el nombre de Strong', brazo.ejercicios.map((e) => [e.nombreSnapshot, e.trackingSnapshot]), [
  ['Extensión de tríceps en polea', '1RM'], ['Sentadilla libre', '1RM'],
]);
ok('cardio: tiempo y distancia, sin 1RM', [run.ejercicios[0].sets, 'mejor1RM' in run.ejercicios[0] && run.ejercicios[0].mejor1RM !== undefined], [
  [{ numeroSerie: 1, tiempoSegundos: 1293, distanciaMetros: 3470 }], false,
]);
ok('rutina: solo si el nombre coincide con UNA', [brazo.workoutId, run.workoutId], ['r-brazo', undefined]);
ok('importacion con origen, clave y lote', brazo.importacion, { origen: 'strong', clave: '2026-01-10 18:00:00', lote: 'L' });
ok('sin duración ni notas: no hay campo', ['duracionSegundos' in run, 'notas' in run, brazo.duracionSegundos], [false, false, 3600]);
ok('la nota de una serie juntada lleva el número de Yield Fit y el nombre de Strong', brazo.notas, 'Bien\nSerie 3 (Triceps Pushdown (Cable - Straight Bar)): agarre cerrado');
ok('la nota no se guarda dentro de la serie', 'nota' in brazo.ejercicios[0].sets[2], false);
ok('ninguna serie sin datos', seriesSinDatos, 0);

// "No importar": las series del omitido fuera, el resto de la sesión dentro; una sesión que
// solo tenía omitidos se salta y se cuenta.
ok('no importar: fuera sus series, el resto entra; sesión solo con omitidos, saltada', (() => {
  const r = construirSesiones({
    sesiones, ejercicioDe, omitidos: new Set(['Squat (Barbell)', 'Running']), rutinas, userId: 'u', lote: 'L', origen: 'strong',
  });
  return [r.documentos.length, r.documentos[0].ejercicios.map((e) => e.exerciseId), r.seriesOmitidas, r.saltadasPorOmitidos];
})(), [1, ['triceps'], 2, 1]);
ok('sin omitidos, los recuentos a cero', [seriesSinDatos, (({ seriesOmitidas: o, saltadasPorOmitidos: p }) => [o, p])(construirSesiones({ sesiones, ejercicioDe, rutinas, userId: 'u', lote: 'L', origen: 'strong' }))], [0, [0, 0]]);
ok('serie sin datos para su tracking: no entra y se cuenta; sesión vacía: fuera', (() => {
  const r = construirSesiones({
    sesiones: [{ ...sesiones[1], ejercicios: [{ nombreStrong: 'Raro', descansoSegundos: null, series: [{ peso: 0, reps: 0, tiempoSegundos: 60, distanciaMetros: 0 }] }] }],
    ejercicioDe: new Map([['Raro', ejercicios[0]]]), rutinas: [], userId: 'u', lote: 'L', origen: 'strong',
  });
  return [r.documentos.length, r.seriesSinDatos];
})(), [0, 1]);

// Pictograma (bloque 10): el snapshot lleva el grupo siempre y el preset solo si existe.
ok('snapshot del pictograma: preset y grupo, o solo grupo',
  brazo.ejercicios.map((e) => [e.exerciseId, e.presetIdSnapshot ?? null, e.grupoMuscularSnapshot]),
  [['triceps', null, 'Brazos'], ['sentadilla', 'sentadilla', 'Piernas']]);
ok('sin preset, el campo ni siquiera existe', 'presetIdSnapshot' in brazo.ejercicios[0], false);

console.log(fallos === 0 ? '\nTODO CORRECTO' : `\n${fallos} FALLOS`);
if (fallos > 0) process.exitCode = 1;
