// Seed de la base de datos de DESARROLLO (ver DECISIONS.md, 0017).
//
// Uso (desde /server):
//   npm run seed                 → 2 años de historial
//   npm run seed -- --anios 5    → 5 años (para probar el principio de estabilidad, 0015)
//
// Qué hace: BORRA todo el contenido de la base y crea un usuario de prueba con sus
// presets, tres rutinas, un grupo de progreso y sesiones sintéticas (~3 por semana).
// Los datos son siempre los mismos: el azar sale de un generador con semilla fija,
// así que dos ejecuciones con los mismos argumentos producen el mismo historial.
//
// Solo se ejecuta si el nombre de la base termina en "-dev". Como vacía todas las
// colecciones, ejecutarlo contra producción sería catastrófico.

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import User from '../models/User.js';
import Exercise from '../models/Exercise.js';
import Workout from '../models/Workout.js';
import Session from '../models/Session.js';
import Chart from '../models/Chart.js';
import { clonarPresetsAUsuario } from '../utils/presets.js';
import { mejor1RMDeEjercicio } from '../utils/unaRM.js';
import { recalcularRecords } from '../utils/records.js';
import { MODELOS_DEL_USUARIO } from '../utils/borrarCuenta.js';

// Credenciales del usuario de prueba. Pueden estar en un repo público: solo
// existen en la base de desarrollo, que se regenera con este script.
const USUARIO_PRUEBA = {
  email: 'dev@yieldfit.test', // .test es un dominio reservado: nunca será un email real
  password: 'desarrollo123',
  nombreCompleto: 'Usuario de Desarrollo',
  fechaNacimiento: new Date('1992-05-14'),
  peso: 78,
  altura: 178,
  genero: 'prefiero-no-decirlo',
};

// Rutinas del seed. Cada ejercicio se busca por nombre y grupo, porque hay nombres
// repetidos entre grupos (p. ej. "Press en máquina" en Pecho y en Hombros).
// pesoInicial es el peso de trabajo del primer día; a partir de ahí progresa.
const RUTINAS = [
  {
    nombre: 'Empuje',
    ejercicios: [
      { nombre: 'Press banca con barra', grupo: 'Pecho', series: 4, pesoInicial: 60 },
      { nombre: 'Press militar con mancuernas', grupo: 'Hombros', series: 3, pesoInicial: 16 },
      { nombre: 'Press inclinado con mancuernas', grupo: 'Pecho', series: 3, pesoInicial: 22 },
      { nombre: 'Extensión de tríceps en polea', grupo: 'Brazos', series: 3, pesoInicial: 20 },
    ],
  },
  {
    nombre: 'Tirón',
    ejercicios: [
      { nombre: 'Peso muerto', grupo: 'Espalda', series: 3, pesoInicial: 90 },
      { nombre: 'Jalón al pecho', grupo: 'Espalda', series: 4, pesoInicial: 50 },
      { nombre: 'Remo con barra', grupo: 'Espalda', series: 3, pesoInicial: 50 },
      { nombre: 'Curl con mancuernas', grupo: 'Brazos', series: 3, pesoInicial: 12 },
    ],
  },
  {
    nombre: 'Pierna',
    ejercicios: [
      { nombre: 'Sentadilla libre', grupo: 'Piernas', series: 4, pesoInicial: 70 },
      { nombre: 'Prensa de piernas', grupo: 'Piernas', series: 3, pesoInicial: 120 },
      { nombre: 'Curl femoral tumbado', grupo: 'Piernas', series: 3, pesoInicial: 35 },
      { nombre: 'Cinta de correr', grupo: 'Cardio', series: 1 },
    ],
  },
];

// Generador pseudoaleatorio con semilla (mulberry32). Math.random() daría datos
// distintos en cada ejecución; con semilla fija el historial es reproducible.
const crearAzar = (semilla) => () => {
  semilla = (semilla + 0x6d2b79f5) | 0;
  let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const azar = crearAzar(42);
const entre = (min, max) => min + azar() * (max - min);

// Redondea al múltiplo de 2,5 kg más cercano, como los discos de un gimnasio.
const redondearPeso = (kg) => Math.round(kg / 2.5) * 2.5;

const leerAnios = () => {
  const i = process.argv.indexOf('--anios');
  const anios = i === -1 ? 2 : Number(process.argv[i + 1]);
  if (!Number.isInteger(anios) || anios < 1 || anios > 10) {
    throw new Error('--anios debe ser un número entero entre 1 y 10');
  }
  return anios;
};

// Series de un ejercicio de fuerza. `progreso` va de 0 (primer día) a 1 (hoy):
// el peso sube hasta un ~45 % a lo largo del periodo, con descargas cada 8 semanas
// y ruido de ±5 %, para que la gráfica de progreso tenga subidas y bajadas.
const seriesDeFuerza = (pesoInicial, numSeries, progreso, semana) => {
  const descarga = semana % 8 === 7 ? 0.85 : 1;
  const pesoDia = pesoInicial * (1 + 0.45 * progreso) * descarga * entre(0.95, 1.05);
  return Array.from({ length: numSeries }, (_, i) => ({
    numeroSerie: i + 1,
    peso: redondearPeso(pesoDia),
    reps: Math.round(entre(6, 10)) - (i === numSeries - 1 ? 1 : 0), // la última serie cuesta más
    rpe: Math.round(entre(7, 9.5) * 2) / 2,
  }));
};

// Cardio: una sola "serie" con tiempo y distancia, que mejora con el tiempo.
const serieDeCardio = (progreso) => {
  const tiempoSegundos = Math.round(entre(15, 25)) * 60;
  const ritmoMetrosPorSegundo = 2.6 + 0.6 * progreso + entre(-0.15, 0.15);
  return [{ numeroSerie: 1, tiempoSegundos, distanciaMetros: Math.round(tiempoSegundos * ritmoMetrosPorSegundo) }];
};

const main = async () => {
  const anios = leerAnios();

  await connectDB();

  // Tercera barrera (además del usuario de Atlas y de connectDB): este script
  // borra datos, así que exige explícitamente una base de desarrollo.
  const nombreBase = mongoose.connection.name;
  if (!nombreBase.endsWith('-dev')) {
    throw new Error(`El seed solo se ejecuta en bases "-dev". Base actual: "${nombreBase}"`);
  }

  console.log(`Vaciando ${nombreBase}...`);
  // El usuario y TODAS las colecciones con userId (la misma lista que borra una cuenta). Antes
  // solo vaciaba cinco, y las del bloque 11b (reportes, tokens, enlaces de recuperación) se
  // quedaban huérfanas de usuarios que el seed acababa de borrar (bloque 1c).
  await Promise.all([User, ...MODELOS_DEL_USUARIO].map((M) => M.deleteMany({})));

  // save() (y no insertMany) para que pre('save') hashee la contraseña.
  const user = await new User(USUARIO_PRUEBA).save();
  await clonarPresetsAUsuario(user._id);
  const ejercicios = await Exercise.find({ userId: user._id });
  const buscar = (nombre, grupo) => {
    const ex = ejercicios.find((e) => e.nombre === nombre && e.grupoMuscular === grupo);
    if (!ex) throw new Error(`Preset no encontrado: ${nombre} (${grupo})`);
    return ex;
  };

  const workouts = await Workout.insertMany(
    RUTINAS.map((rutina) => ({
      userId: user._id,
      nombre: rutina.nombre,
      ejercicios: rutina.ejercicios.map((e, orden) => ({
        exerciseId: buscar(e.nombre, e.grupo)._id,
        numSeries: e.series,
        descansoSegundos: e.series === 1 ? 0 : 120,
        orden,
      })),
    }))
  );

  await Chart.create({
    userId: user._id,
    nombre: 'Básicos',
    exerciseIds: ['Press banca con barra', 'Sentadilla libre', 'Peso muerto'].map(
      (nombre) => ejercicios.find((e) => e.nombre === nombre)._id
    ),
  });

  // Sesiones: lunes, miércoles y viernes, rotando las rutinas, desde hace `anios`
  // años hasta ayer. Se salta ~10 % de los días (vacaciones, enfermedad...).
  const hoy = new Date();
  const inicio = new Date(hoy);
  inicio.setFullYear(hoy.getFullYear() - anios);
  const totalMs = hoy - inicio;

  const sesiones = [];
  let turno = 0;
  for (let dia = new Date(inicio); dia < hoy; dia.setDate(dia.getDate() + 1)) {
    if (![1, 3, 5].includes(dia.getDay()) || azar() < 0.1) continue;

    const progreso = (dia - inicio) / totalMs;
    const semana = Math.floor((dia - inicio) / (7 * 24 * 3600 * 1000));
    const rutina = RUTINAS[turno % RUTINAS.length];
    const workout = workouts[turno % RUTINAS.length];
    turno++;

    const fecha = new Date(dia);
    fecha.setHours(18, Math.round(entre(0, 59)), 0, 0);

    sesiones.push({
      userId: user._id,
      workoutId: workout._id,
      nombre: rutina.nombre,
      fecha,
      duracionSegundos: Math.round(entre(50, 80)) * 60,
      ejercicios: rutina.ejercicios.map((e, orden) => {
        const ex = buscar(e.nombre, e.grupo);
        const sets =
          ex.tracking === 'tiempo_distancia'
            ? serieDeCardio(progreso)
            : seriesDeFuerza(e.pesoInicial, e.series, progreso, semana);
        return {
          exerciseId: ex._id,
          // Snapshots y mejor1RM, igual que hace sessionController al crear una sesión.
          nombreSnapshot: ex.nombre,
          trackingSnapshot: ex.tracking,
          presetIdSnapshot: ex.presetId,
          grupoMuscularSnapshot: ex.grupoMuscular,
          descansoSegundos: e.series === 1 ? 0 : 120,
          orden,
          mejor1RM: mejor1RMDeEjercicio({ trackingSnapshot: ex.tracking, sets }),
          sets,
        };
      }),
    });
  }

  // insertMany sí ejecuta las validaciones del schema (no así los pre('save')).
  await Session.insertMany(sesiones);

  // Récords (bloque 4b): las sesiones se insertan de golpe, sin pasar por el controlador,
  // así que se marcan después con la misma función que usa la app al borrar una sesión.
  const ids1RM = ejercicios.filter((ex) => ex.tracking === '1RM').map((ex) => ex._id);
  const records = await recalcularRecords({ db: mongoose.connection.db, userId: user._id, exerciseIds: ids1RM });

  console.log('Seed completado:');
  console.log(`  usuario:    ${USUARIO_PRUEBA.email} / ${USUARIO_PRUEBA.password}`);
  console.log(`  ejercicios: ${ejercicios.length}`);
  console.log(`  rutinas:    ${workouts.length}`);
  console.log(`  sesiones:   ${sesiones.length} (${anios} años)`);
  console.log(`  récords:    ${records.sesionesCambiadas} sesiones con algún récord`);
};

main()
  .catch((error) => {
    console.error('Seed fallido:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
