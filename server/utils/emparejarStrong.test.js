// Pruebas de las propuestas de emparejamiento de Strong (utils/emparejarStrong.js, bloque 7b).
// Sin base de datos: desde /server,
//   node utils/emparejarStrong.test.js

import { readFileSync } from 'node:fs';
import {
  adivinarEjercicio, GRUPO_POR_PALABRA, mejorCoincidencia, normalizarNombre, proponerEmparejamientos, resumirEjercicios, TIPO_POR_EQUIPO,
} from './emparejarStrong.js';
import { agruparSesiones, leerCsvStrong } from './importarStrong.js';
import { exercisePresets } from '../data/exercisePresets.js';

let fallos = 0;
const ok = (desc, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bien) fallos++;
  console.log(`${bien ? 'OK   ' : 'FALLO'} ${desc}: ${JSON.stringify(real)}${bien ? '' : '  (esperado ' + JSON.stringify(esperado) + ')'}`);
};

// --- normalizarNombre ---
ok('sin mayúsculas, tildes ni espacios de más', normalizarNombre('  Jalón   al PECHO '), 'jalon al pecho');
ok('la ñ pierde la tilde, pero no se confunde con nada', normalizarNombre('Pájaros Ñ'), 'pajaros n');

// --- adivinarEjercicio ---
const adivina = (n, o) => adivinarEjercicio(n, o);
ok('equipo entre paréntesis', [
  adivina('Hammer Curl (Cable)'), adivina('Chest fly (Plate Loaded)'), adivina('Squat (Smith Machine)'), adivina('Shrug (Machine)'),
], [
  { grupoMuscular: 'Brazos', tipo: 'Poleas' }, { grupoMuscular: 'Pecho', tipo: 'Maquinas de discos' },
  { grupoMuscular: 'Piernas', tipo: 'Maquinas' }, { grupoMuscular: 'Espalda', tipo: 'Maquinas' },
]);
ok('el orden de las palabras: leg raise es core, leg curl pierna, reverse fly hombro', [
  adivina('Hanging Leg Raise')?.grupoMuscular, adivina('Seated Leg Curl (Machine)')?.grupoMuscular, adivina('Reverse Fly (Cable)')?.grupoMuscular,
], ['Core', 'Piernas', 'Hombros']);
ok('"Romanian Deadlift": la expresión de dos palabras gana a "deadlift" (espalda)', adivina('Romanian Deadlift (Dumbbell)')?.grupoMuscular, 'Piernas');
ok('mejorCoincidencia: más palabras, luego más larga, luego alfabética', [
  mejorCoincidencia('leg raise', [['leg', 'A'], ['leg raise', 'B']]),
  mejorCoincidencia('tricep extension', [['tricep', 'A'], ['extension', 'B']]),
  mejorCoincidencia('aa bb', [['bb', 'B'], ['aa', 'A']]),
  mejorCoincidencia('nada', [['algo', 'A']]),
], ['B', 'B', 'A', null]);

// Reordenar las tablas no cambia ninguna propuesta: se barajan 50 veces (con una semilla fija,
// para que un fallo se pueda repetir) y cada nombre tiene que dar lo mismo que con el orden
// original. Los nombres son los que más se pisan entre expresiones.
const nombresQueSePisan = [
  'Hanging Leg Raise', 'Seated Leg Curl (Machine)', 'Reverse Fly (Cable)', 'Romanian Deadlift (Dumbbell)', 'Chest fly (Plate Loaded)',
  'Cable Crossover', 'Lat Pulldown (Machine)', 'Hammer Curl (Cable)', 'Squat (Smith Machine)', 'Leg Press', 'Calf Press on Seated Leg Press',
  'Lateral Raise (Cable)', 'Triceps Pushdown (Cable - Straight Bar)', 'Bench Press (Smith Machine)', 'Chin Up', 'Rowing (Machine)',
  'Shoulder Press (Plate Loaded)', 'Chest Press (Plate Loaded Machine)',
];
let semilla = 7;
const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
const barajar = (tabla) => {
  const copia = [...tabla];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};
const original = nombresQueSePisan.map((n) => adivina(n));
const distintos = [];
for (let vez = 0; vez < 50; vez++) {
  const grupos = barajar(GRUPO_POR_PALABRA);
  const equipos = barajar(TIPO_POR_EQUIPO);
  nombresQueSePisan.forEach((n, i) => {
    if (JSON.stringify(adivina(n, { grupos, equipos })) !== JSON.stringify(original[i])) distintos.push(n);
  });
}
ok('barajar las tablas 50 veces no cambia ningún resultado', [...new Set(distintos)], []);
ok('y la tabla invertida, tampoco', nombresQueSePisan.map((n) => adivina(n, { grupos: [...GRUPO_POR_PALABRA].reverse(), equipos: [...TIPO_POR_EQUIPO].reverse() })), original);
ok('"(Plate Loaded Machine)" es de discos aunque lleve "machine"', adivina('Chest Press (Plate Loaded Machine)')?.tipo, 'Maquinas de discos');
ok('peso corporal sin paréntesis', adivina('Chin Up'), { grupoMuscular: 'Espalda', tipo: 'Peso corporal' });
ok('"row" no se encuentra dentro de "crossover"', adivina('Cable Crossover')?.grupoMuscular, 'Pecho');
ok('cardio por las series, aunque el nombre no lo diga', adivina('Paseo con el perro', { cardio: true }), { grupoMuscular: 'Cardio', tipo: 'Cardio' });
ok('sin equipo o sin grupo → null (el usuario elige)', [adivina('T Bar Row'), adivina('Triceps Extension'), adivina('Mi ejercicio raro (Barbell)')], [null, null, null]);

// --- proponerEmparejamientos ---
// Los presets como los tendría un usuario recién registrado, con ids inventados, más uno suyo.
const ejercicios = [
  ...exercisePresets.map((p, i) => ({ _id: `p${i}`, ...p })),
  { _id: 'mio', nombre: 'Pull over', grupoMuscular: 'Espalda', tipo: 'Poleas' },
];
const id = (nombre, grupo) => ejercicios.find((e) => e.nombre === nombre && (!grupo || e.grupoMuscular === grupo))._id;
const fila = (nombreStrong, extra = {}) => ({ nombreStrong, sesiones: 1, series: 3, cardio: false, ...extra });

const propuestas = proponerEmparejamientos({
  resumen: [
    fila('Squat (Barbell)'), fila('Chest Press (Machine)'), fila('Shoulder Press (Machine)'), fila('PULL OVER'),
    fila('Face Pull (Cable)'), fila('Hammer Curl (Cable)'), fila('T Bar Row'), fila('Running', { cardio: true }),
    fila('Lat Pulldown (Cable)'),
  ],
  ejercicios,
  recordados: [
    { nombreOrigen: 'Lat Pulldown (Cable)', exerciseId: 'mio' },
    { nombreOrigen: 'Face Pull (Cable)', exerciseId: 'borrado' }, // ese ejercicio ya no existe
  ],
});
const ver = (n) => {
  const p = propuestas.find((x) => x.nombreStrong === n);
  return [p.estado, p.motivo, p.exerciseId, p.crear];
};
ok('recordado gana a todo', ver('Lat Pulldown (Cable)'), ['recordado', 'recordado', 'mio', null]);
ok('recordado de un ejercicio borrado: se ignora y sigue con el diccionario', ver('Face Pull (Cable)'), ['propuesto', 'equivalencia', id('Face pull'), null]);
ok('mismo nombre, sin mayúsculas', ver('PULL OVER'), ['propuesto', 'nombre', 'mio', null]);
ok('diccionario', ver('Squat (Barbell)'), ['propuesto', 'equivalencia', id('Sentadilla libre'), null]);
ok('"Press en máquina" está en dos grupos: el diccionario elige el bueno', [ver('Chest Press (Machine)')[2], ver('Shoulder Press (Machine)')[2]], [
  id('Press en máquina', 'Pecho'), id('Press en máquina', 'Hombros'),
]);
ok('cardio por el diccionario', ver('Running'), ['propuesto', 'equivalencia', id('Carrera continua'), null]);
ok('crear con lo adivinado', ver('Hammer Curl (Cable)'), ['propuesto', 'crear', null, { nombre: 'Hammer Curl (Cable)', grupoMuscular: 'Brazos', tipo: 'Poleas' }]);
ok('sin emparejar', ver('T Bar Row'), ['sinEmparejar', null, null, null]);
ok('orden: sin emparejar, propuestos (por nombre), recordados', propuestas.map((p) => p.nombreStrong), [
  'T Bar Row', 'Chest Press (Machine)', 'Face Pull (Cable)', 'Hammer Curl (Cable)', 'PULL OVER', 'Running',
  'Shoulder Press (Machine)', 'Squat (Barbell)', 'Lat Pulldown (Cable)',
]);
ok('preset renombrado por el usuario: el diccionario ya no lo encuentra', (() => {
  const sinSentadilla = ejercicios.map((e) => (e.nombre === 'Sentadilla libre' ? { ...e, nombre: 'Sentadilla trasera' } : e));
  const [p] = proponerEmparejamientos({ resumen: [fila('Squat (Barbell)')], ejercicios: sinSentadilla, recordados: [] });
  return [p.estado, p.motivo];
})(), ['propuesto', 'crear']);

// --- resumirEjercicios, con el CSV de ejemplo ---
const { idioma, filas } = leerCsvStrong(readFileSync(new URL('../scripts/fixtures/strong-ejemplo.csv', import.meta.url), 'utf8'));
const { sesiones } = agruparSesiones(filas, { unidad: 'kg', zona: 'Europe/Madrid', idioma });
ok('resumen por ejercicio, con el cardio detectado', resumirEjercicios(sesiones), [
  { nombreStrong: 'Squat (Barbell)', sesiones: 1, series: 3, cardio: false },
  { nombreStrong: 'Leg Curl (Machine)', sesiones: 1, series: 1, cardio: false },
  { nombreStrong: 'Pull Up', sesiones: 1, series: 3, cardio: false },
  { nombreStrong: 'Face Pull (Cable)', sesiones: 1, series: 1, cardio: false },
  { nombreStrong: 'Running', sesiones: 1, series: 1, cardio: true },
]);

console.log(fallos === 0 ? '\nTODO CORRECTO' : `\n${fallos} FALLOS`);
if (fallos > 0) process.exitCode = 1;
