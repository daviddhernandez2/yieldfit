// Propuestas de emparejamiento de la importación de Strong (bloque 7b): para cada ejercicio del
// CSV, con qué ejercicio de Yield Fit se empareja o qué ejercicio nuevo se crearía. Solo funciones
// puras: los ejercicios del usuario y sus emparejamientos recordados llegan ya leídos.
//
// Reglas, por orden (gana la primera que da algo):
//   1. recordado: lo que el usuario eligió en una importación anterior (EmparejamientoImport);
//   2. nombre: un ejercicio suyo que se llama igual (sin mayúsculas, tildes ni espacios de más);
//   3. equivalencia: el preset equivalente del diccionario (data/equivalenciasStrong.js), si el
//      usuario todavía lo tiene con ese nombre y grupo;
//   4. crear: un ejercicio nuevo con el nombre de Strong, si se puede adivinar el grupo muscular y
//      el tipo (el equipo entre paréntesis: "(Cable)" → Poleas);
//   5. sin emparejar: el usuario tiene que elegir.
// La vista previa lo muestra en ese orden de urgencia: sin emparejar arriba, luego lo propuesto
// (incluido "Crear") y abajo lo recordado, que normalmente ya no hay que tocar.

import { EQUIVALENCIAS_STRONG } from '../data/equivalenciasStrong.js';

// "  Press Banca  " y "press banca" son el mismo nombre; "Jalón" y "jalon" también. Se usa para
// comparar, nunca para guardar. La misma regla rechaza crear un ejercicio con un nombre que ya
// existe (decisión de David en el diseño).
export const normalizarNombre = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const EQUIVALENCIAS = new Map(EQUIVALENCIAS_STRONG.map((e) => [normalizarNombre(e.strong), e]));

// El equipo → tipo de Yield Fit. Se busca como palabra dentro del paréntesis, así que
// "(Cable - Straight Bar)" cuenta como poleas. Como en los grupos, gana la expresión más larga
// (mejorCoincidencia): "plate loaded" gana a "machine" en un hipotético "(Plate Loaded Machine)".
export const TIPO_POR_EQUIPO = [
  ['plate loaded', 'Maquinas de discos'],
  ['plate', 'Maquinas de discos'],
  ['smith', 'Maquinas'],
  ['machine', 'Maquinas'],
  ['cable', 'Poleas'],
  ['barbell', 'Pesas libres'],
  ['dumbbell', 'Pesas libres'],
  ['kettlebell', 'Pesas libres'],
  ['ez bar', 'Pesas libres'],
  ['bodyweight', 'Peso corporal'],
  ['assisted', 'Maquinas'],
];
// Sin paréntesis: ejercicios que casi siempre son con el propio peso.
const PESO_CORPORAL = ['pull up', 'chin up', 'push up', 'dip', 'plank', 'crunch', 'leg raise', 'sit up'];

// Palabras del nombre → grupo muscular. El orden de la tabla NO importa: gana la expresión más
// específica que aparece (mejorCoincidencia). "Hanging Leg Raise" contiene "leg" (pierna) y
// "leg raise" (core): gana "leg raise", que tiene más palabras. Si dos expresiones se pisan con el
// mismo grupo de palabras, hay que añadir la expresión que las une, como "romanian deadlift"
// ("romanian" sería pierna y "deadlift" espalda).
export const GRUPO_POR_PALABRA = [
  ['running', 'Cardio'], ['cycling', 'Cardio'], ['elliptical', 'Cardio'], ['rowing', 'Cardio'], ['jump rope', 'Cardio'],
  ['leg curl', 'Piernas'], ['leg raise', 'Core'], ['crunch', 'Core'], ['plank', 'Core'], ['sit up', 'Core'], ['ab wheel', 'Core'], ['russian twist', 'Core'],
  ['reverse fly', 'Hombros'], ['face pull', 'Hombros'], ['lateral raise', 'Hombros'], ['front raise', 'Hombros'],
  ['shoulder', 'Hombros'], ['overhead press', 'Hombros'],
  ['curl', 'Brazos'], ['triceps', 'Brazos'], ['tricep', 'Brazos'], ['bicep', 'Brazos'], ['skullcrusher', 'Brazos'],
  ['squat', 'Piernas'], ['leg', 'Piernas'], ['calf', 'Piernas'], ['lunge', 'Piernas'],
  ['romanian deadlift', 'Piernas'], ['hip thrust', 'Piernas'],
  ['bench', 'Pecho'], ['chest', 'Pecho'], ['fly', 'Pecho'], ['crossover', 'Pecho'], ['incline', 'Pecho'], ['push up', 'Pecho'],
  ['row', 'Espalda'], ['pulldown', 'Espalda'], ['pull up', 'Espalda'], ['chin up', 'Espalda'], ['pull over', 'Espalda'],
  ['pullover', 'Espalda'], ['deadlift', 'Espalda'], ['shrug', 'Espalda'],
];

// ¿La palabra está en el nombre como palabra entera? ("row" no debe encontrarse en "crossover").
const contiene = (nombre, palabra) => new RegExp(`(^|[^a-z])${palabra}([^a-z]|$)`).test(nombre);

const numPalabras = (expresion) => expresion.split(' ').length;

// De las expresiones de `tabla` ([expresión, valor]) que aparecen en `texto`, el valor de la más
// específica: la de más palabras; con las mismas, la más larga; y si aun así empatan, la primera
// por orden alfabético. Así el resultado no depende nunca del orden de la tabla (lo prueba
// emparejarStrong.test.js barajándola). null si no aparece ninguna.
export const mejorCoincidencia = (texto, tabla) => {
  const candidatas = tabla.filter(([expresion]) => contiene(texto, expresion));
  candidatas.sort(
    ([a], [b]) => numPalabras(b) - numPalabras(a) || b.length - a.length || a.localeCompare(b)
  );
  return candidatas[0]?.[1] ?? null;
};

// Adivina grupo y tipo de un ejercicio nuevo a partir del nombre de Strong y de sus series
// (`cardio`: las series traen distancia o tiempo y ninguna peso ni reps). Devuelve
// { grupoMuscular, tipo } o null si falta alguno de los dos: entonces queda "sin emparejar".
// Las tablas se pueden pasar para las pruebas (por defecto, las de arriba).
export const adivinarEjercicio = (
  nombreStrong,
  { cardio = false, grupos = GRUPO_POR_PALABRA, equipos = TIPO_POR_EQUIPO } = {}
) => {
  const n = normalizarNombre(nombreStrong);
  if (cardio) return { grupoMuscular: 'Cardio', tipo: 'Cardio' };
  const grupoMuscular = mejorCoincidencia(n, grupos);
  if (grupoMuscular === 'Cardio') return { grupoMuscular, tipo: 'Cardio' };

  // El equipo, entre paréntesis ("Face Pull (Cable)"); si no hay, en el propio nombre ("Cable
  // Crossover").
  const equipo = /\(([^)]*)\)/.exec(n)?.[1] ?? n;
  let tipo = mejorCoincidencia(equipo, equipos);
  if (!tipo && PESO_CORPORAL.some((p) => contiene(n, p))) tipo = 'Peso corporal';

  return grupoMuscular && tipo ? { grupoMuscular, tipo } : null;
};

export const ESTADOS = ['sinEmparejar', 'propuesto', 'recordado'];

// Propone un emparejamiento para cada ejercicio del CSV.
//   resumen: [{ nombreStrong, sesiones, series, cardio }] (lo que el CSV trae de cada ejercicio);
//   ejercicios: los del usuario, [{ _id, nombre, grupoMuscular, tipo, tracking }];
//   recordados: [{ nombreOrigen, exerciseId }] de EmparejamientoImport.
// Devuelve una fila por ejercicio, en el orden de la vista previa:
//   { nombreStrong, sesiones, series, estado, motivo, exerciseId, crear }
//   - estado: 'sinEmparejar' | 'propuesto' | 'recordado';
//   - motivo: 'recordado' | 'nombre' | 'equivalencia' | 'crear' | null;
//   - exerciseId: el ejercicio propuesto (string) o null;
//   - crear: { nombre, grupoMuscular, tipo } si se propone uno nuevo, o null.
export const proponerEmparejamientos = ({ resumen, ejercicios, recordados }) => {
  const porId = new Map(ejercicios.map((e) => [String(e._id), e]));
  const porNombre = new Map();
  for (const e of ejercicios) {
    const clave = normalizarNombre(e.nombre);
    if (!porNombre.has(clave)) porNombre.set(clave, []);
    porNombre.get(clave).push(e);
  }
  const recordado = new Map(recordados.map((r) => [r.nombreOrigen, String(r.exerciseId)]));

  const filas = resumen.map(({ nombreStrong, sesiones, series, cardio }) => {
    const base = { nombreStrong, sesiones, series };

    // 1. Recordado, si el ejercicio sigue existiendo (borrarlo ya borra el emparejamiento, pero
    //    no cuesta nada comprobarlo).
    const idRecordado = recordado.get(nombreStrong);
    if (idRecordado && porId.has(idRecordado)) {
      return { ...base, estado: 'recordado', motivo: 'recordado', exerciseId: idRecordado, crear: null };
    }
    // 2. Mismo nombre. Si hay dos con el mismo nombre, el primero (el usuario lo verá y lo cambia).
    const mismoNombre = porNombre.get(normalizarNombre(nombreStrong));
    if (mismoNombre) {
      return { ...base, estado: 'propuesto', motivo: 'nombre', exerciseId: String(mismoNombre[0]._id), crear: null };
    }
    // 3. Equivalencia del diccionario, con su grupo (por los presets con el mismo nombre).
    const eq = EQUIVALENCIAS.get(normalizarNombre(nombreStrong));
    const delDiccionario = eq && (porNombre.get(normalizarNombre(eq.nombre)) ?? []).find((e) => e.grupoMuscular === eq.grupoMuscular);
    if (delDiccionario) {
      return { ...base, estado: 'propuesto', motivo: 'equivalencia', exerciseId: String(delDiccionario._id), crear: null };
    }
    // 4. Crear uno nuevo, si se puede adivinar cómo.
    const adivinado = adivinarEjercicio(nombreStrong, { cardio });
    if (adivinado) {
      return { ...base, estado: 'propuesto', motivo: 'crear', exerciseId: null, crear: { nombre: nombreStrong, ...adivinado } };
    }
    // 5. El usuario elige.
    return { ...base, estado: 'sinEmparejar', motivo: null, exerciseId: null, crear: null };
  });

  return filas.sort(
    (a, b) => ESTADOS.indexOf(a.estado) - ESTADOS.indexOf(b.estado) || a.nombreStrong.localeCompare(b.nombreStrong, 'es')
  );
};

// Lo que trae el CSV de cada ejercicio, para la vista previa y para adivinar el cardio: en
// cuántas sesiones sale, cuántas series tiene y si es cardio (series con distancia o tiempo y
// ninguna con peso ni reps). `sesiones` es lo que devuelve agruparSesiones.
export const resumirEjercicios = (sesiones) => {
  const porNombre = new Map();
  for (const s of sesiones) {
    for (const e of s.ejercicios) {
      if (!porNombre.has(e.nombreStrong)) porNombre.set(e.nombreStrong, { nombreStrong: e.nombreStrong, sesiones: 0, series: 0, conPeso: false, conCardio: false });
      const r = porNombre.get(e.nombreStrong);
      r.sesiones++;
      r.series += e.series.length;
      for (const serie of e.series) {
        if (serie.peso > 0 || serie.reps > 0) r.conPeso = true;
        if (serie.distanciaMetros > 0 || serie.tiempoSegundos > 0) r.conCardio = true;
      }
    }
  }
  return [...porNombre.values()].map(({ conPeso, conCardio, ...r }) => ({ ...r, cardio: conCardio && !conPeso }));
};
