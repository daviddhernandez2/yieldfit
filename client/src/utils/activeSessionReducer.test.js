// Pruebas de sesionReducer (activeSessionReducer.js). Sin dependencias: desde /client,
//   node src/utils/activeSessionReducer.test.js
// Repetirlas siempre que se cambie el reducer.

import { sesionReducer, seriesAlReemplazar } from './activeSessionReducer.js';

let fallos = 0;
const ok = (desc, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bien) fallos++;
  console.log(`${bien ? 'OK   ' : 'FALLO'} ${desc}${bien ? '' : `\n      real:     ${JSON.stringify(real)}\n      esperado: ${JSON.stringify(esperado)}`}`);
};

// Congela un objeto entero: si el reducer intentara modificar la sesión que recibe, lanzaría
// un error. Así se prueba que devuelve copias.
const congelar = (o) => {
  if (o && typeof o === 'object') {
    Object.values(o).forEach(congelar);
    Object.freeze(o);
  }
  return o;
};

// Simula el viaje real: lo que hay en localStorage es texto (JSON), y se lee con JSON.parse.
const desdeLocalStorage = (sesion) => congelar(JSON.parse(JSON.stringify(sesion)));

// Forma EXACTA que guarda hoy la app (buildActiveSessionFromWorkout + bloques 5 y 5b).
const SESION_ACTUAL = {
  startTime: 1763900000000,
  workoutId: 'w1',
  nombre: 'Tirón',
  ejercicios: [
    {
      exerciseId: 'peso-muerto',
      exerciseNombre: 'Peso muerto',
      grupoMuscular: 'Espalda',
      tipo: 'Pesas libres',
      bloqueado: false,
      descansoSegundos: 120,
      sets: [
        { id: 's1', peso: '', reps: '', completada: false },
        { id: 's2', peso: '140', reps: '', completada: false },
      ],
    },
    { exerciseId: 'cinta', exerciseNombre: 'Cinta de correr', bloqueado: true, descansoSegundos: 0, sets: [] },
  ],
  anteriores: { 'peso-muerto': { fecha: '2026-11-16T18:00:00.000Z', sets: [{ numeroSerie: 1, peso: 135, reps: 9 }, { numeroSerie: 2, peso: 135, reps: 7 }] } },
};

// Forma de una sesión empezada ANTES de los bloques 5 y 5b (sin `bloqueado` ni `anteriores`).
const SESION_ANTIGUA = {
  startTime: 1763800000000,
  workoutId: 'w2',
  nombre: 'Empuje',
  ejercicios: [
    { exerciseId: 'press', exerciseNombre: 'Press banca', descansoSegundos: 90, sets: [{ id: 'a1', peso: '', reps: '', completada: false }] },
  ],
};

const claves = (o) => Object.keys(o).sort();

// --- Forma de los datos (requisito: una sesión a medias sobrevive al deploy) ---
for (const [nombre, original] of [['actual', SESION_ACTUAL], ['antigua', SESION_ANTIGUA]]) {
  let s = sesionReducer(null, { type: 'cargar', sesion: desdeLocalStorage(original) });
  ok(`[${nombre}] cargar devuelve la sesión tal cual`, s, original);
  s = sesionReducer(s, { type: 'actualizarSerie', exerciseIndex: 0, setIndex: 0, cambios: { peso: '100' } });
  s = sesionReducer(s, { type: 'alternarCompletada', exerciseIndex: 0, setIndex: 0 });
  s = sesionReducer(s, { type: 'añadirSerie', exerciseIndex: 0, id: 'nueva' });
  s = sesionReducer(s, { type: 'quitarSerie', exerciseIndex: 0, setIndex: 1 });
  const viaje = JSON.parse(JSON.stringify(s)); // se puede volver a guardar en localStorage
  ok(`[${nombre}] mismas claves de sesión tras todas las acciones`, claves(viaje), claves(original));
  ok(`[${nombre}] mismas claves de ejercicio`, claves(viaje.ejercicios[0]), claves(original.ejercicios[0]));
  ok(`[${nombre}] mismas claves de serie`, claves(viaje.ejercicios[0].sets[0]), claves(original.ejercicios[0].sets[0]));
}

// --- Cada acción ---
const base = desdeLocalStorage(SESION_ACTUAL);

let s = sesionReducer(base, { type: 'actualizarSerie', exerciseIndex: 0, setIndex: 0, cambios: { reps: '8' } });
ok('actualizarSerie cambia solo ese campo', s.ejercicios[0].sets[0], { id: 's1', peso: '', reps: '8', completada: false });
ok('actualizarSerie no toca las demás series (mismo objeto)', s.ejercicios[0].sets[1] === base.ejercicios[0].sets[1], true);
ok('actualizarSerie no toca los demás ejercicios (mismo objeto)', s.ejercicios[1] === base.ejercicios[1], true);

s = sesionReducer(base, { type: 'alternarCompletada', exerciseIndex: 0, setIndex: 0 });
ok('marcar serie vacía: se rellena con la vez anterior', s.ejercicios[0].sets[0], { id: 's1', peso: '135', reps: '9', completada: true });
s = sesionReducer(base, { type: 'alternarCompletada', exerciseIndex: 0, setIndex: 1 });
ok('marcar con peso escrito: solo se rellenan las reps', s.ejercicios[0].sets[1], { id: 's2', peso: '140', reps: '7', completada: true });
s = sesionReducer(s, { type: 'alternarCompletada', exerciseIndex: 0, setIndex: 1 });
ok('desmarcar: no borra lo rellenado', s.ejercicios[0].sets[1], { id: 's2', peso: '140', reps: '7', completada: false });
s = sesionReducer(desdeLocalStorage(SESION_ANTIGUA), { type: 'alternarCompletada', exerciseIndex: 0, setIndex: 0 });
ok('marcar sin "anteriores" (sesión antigua): se queda vacía, como antes', s.ejercicios[0].sets[0], { id: 'a1', peso: '', reps: '', completada: true });

s = sesionReducer(base, { type: 'añadirSerie', exerciseIndex: 0, id: 'x' });
ok('añadirSerie añade una vacía al final con el id recibido', s.ejercicios[0].sets.at(-1), { id: 'x', peso: '', reps: '', completada: false });
s = sesionReducer(base, { type: 'quitarSerie', exerciseIndex: 0, setIndex: 0 });
ok('quitarSerie quita esa y deja las demás', s.ejercicios[0].sets.map((x) => x.id), ['s2']);

s = sesionReducer(desdeLocalStorage(SESION_ANTIGUA), { type: 'guardarAnteriores', anteriores: { press: { sets: [] } } });
ok('guardarAnteriores', s.anteriores, { press: { sets: [] } });

// --- Reemplazar (bloque 6) ---
const conHecha = sesionReducer(base, { type: 'alternarCompletada', exerciseIndex: 0, setIndex: 0 });
s = sesionReducer(conHecha, { type: 'reemplazarEjercicio', exerciseIndex: 0, exerciseId: 'remo', exerciseNombre: 'Remo con barra', grupoMuscular: 'Espalda', tipo: 'Pesas libres', ids: ['r1', 'r2'] });
ok('reemplazar: el nuevo ocupa el mismo sitio, con las mismas series vacías y el mismo descanso', s.ejercicios[0], {
  exerciseId: 'remo', exerciseNombre: 'Remo con barra', grupoMuscular: 'Espalda', tipo: 'Pesas libres', bloqueado: false, descansoSegundos: 120,
  sets: [{ id: 'r1', peso: '', reps: '', completada: false }, { id: 'r2', peso: '', reps: '', completada: false }],
});
ok('reemplazar: lo hecho del anterior se pierde', s.ejercicios[0].sets.some((x) => x.completada), false);
ok('reemplazar: los demás ejercicios no cambian (mismo objeto)', s.ejercicios[1] === conHecha.ejercicios[1], true);
const sinDetalle = sesionReducer(conHecha, { type: 'reemplazarEjercicio', exerciseIndex: 0, exerciseId: 'remo', exerciseNombre: 'Remo', ids: ['r1'] });
ok('reemplazar sin grupo ni tipo (versión anterior de la pantalla): no añade esos campos', ['grupoMuscular' in sinDetalle.ejercicios[0], 'tipo' in sinDetalle.ejercicios[0]], [false, false]);
ok('reemplazar: misma forma que en localStorage', claves(JSON.parse(JSON.stringify(s)).ejercicios[0]), claves(SESION_ACTUAL.ejercicios[0]));
ok('seriesAlReemplazar: las mismas, y al menos 1', [seriesAlReemplazar({ sets: [1, 2, 3] }), seriesAlReemplazar({ sets: [] })], [3, 1]);

s = sesionReducer(base, { type: 'añadirAnteriores', anteriores: { remo: { sets: [{ peso: 60, reps: 10 }] } } });
ok('añadirAnteriores: suma el nuevo y conserva los que había', Object.keys(s.anteriores).sort(), ['peso-muerto', 'remo']);
s = sesionReducer(desdeLocalStorage(SESION_ANTIGUA), { type: 'añadirAnteriores', anteriores: { remo: { sets: [] } } });
ok('añadirAnteriores sin "anteriores" previos: no los crea (se pedirán todos al reabrir)', 'anteriores' in s, false);

// --- Mover ejercicios (bloque 9b) ---
s = sesionReducer(base, { type: 'moverEjercicio', desde: 0, hasta: 1 });
ok('mover: cambia el orden de los ejercicios', s.ejercicios.map((e) => e.exerciseId), ['cinta', 'peso-muerto']);
ok('mover: los ejercicios son los mismos objetos (no se copian)', s.ejercicios[1] === base.ejercicios[0], true);
ok('mover: misma forma que en localStorage', claves(JSON.parse(JSON.stringify(s))), claves(SESION_ACTUAL));

let error = '';
try { sesionReducer(base, { type: 'inventada' }); } catch (e) { error = e.message; }
ok('acción desconocida: error explícito', error, 'Acción desconocida en sesionReducer: inventada');

console.log(fallos === 0 ? '\nTODO CORRECTO' : `\n${fallos} FALLOS`);
if (fallos > 0) process.exitCode = 1;
