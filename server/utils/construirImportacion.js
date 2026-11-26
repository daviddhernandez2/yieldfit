// La importación de Strong (bloque 7b), la parte que no toca la base de datos: comprobar las
// decisiones que manda el cliente y montar las sesiones que se van a guardar. El controlador
// (importarController.importar) lee lo necesario, llama a estas funciones y escribe todo en una
// transacción. Pruebas en construirImportacion.test.js.

import { derivarTracking } from '../models/Exercise.js';
import { mejor1RMDeEjercicio } from './unaRM.js';
import { juntarNotas } from './importarStrong.js';
import { normalizarNombre, trackingDe } from './emparejarStrong.js';

const esObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// Comprueba lo que el usuario decidió para cada ejercicio de Strong que se va a importar.
//   necesarios: [{ nombreStrong, cardio }] (resumirEjercicios de las sesiones que se importan);
//   emparejamientos: { nombreStrong: exerciseId } y crear: { nombreStrong: { nombre, grupoMuscular, tipo } };
//   ejercicios: los del usuario, [{ _id, nombre, grupoMuscular, tipo, tracking }].
// Devuelve { error } con el primer problema (para un 400) o { asignacion }, un Map
// nombreStrong → { exerciseId } o { crear: { nombre, grupoMuscular, tipo, tracking } }.
// Lo que no hace: validar grupo y tipo contra los enums, que lo hace el modelo al crear el
// ejercicio (insertMany valida), con su propio mensaje.
export const validarDecisiones = ({ necesarios, emparejamientos = {}, crear = {}, ejercicios }) => {
  if (!esObjeto(emparejamientos) || !esObjeto(crear)) return { error: 'Las decisiones de emparejamiento no son válidas' };

  const porId = new Map(ejercicios.map((e) => [String(e._id), e]));
  const nombresExistentes = new Set(ejercicios.map((e) => normalizarNombre(e.nombre)));
  const nombresNuevos = new Map(); // nombre normalizado → nombre de Strong que lo crea
  const asignacion = new Map();

  for (const { nombreStrong, cardio } of necesarios) {
    const tracking = trackingDe(cardio);
    const id = emparejamientos[nombreStrong];
    const nuevo = crear[nombreStrong];
    if (id !== undefined && nuevo !== undefined) return { error: `«${nombreStrong}»: o se empareja o se crea, no las dos cosas` };
    if (id === undefined && nuevo === undefined) return { error: `Falta emparejar «${nombreStrong}»` };

    if (id !== undefined) {
      const ejercicio = porId.get(String(id));
      if (!ejercicio) return { error: `«${nombreStrong}»: el ejercicio elegido no existe` };
      if ((ejercicio.tracking ?? derivarTracking(ejercicio.grupoMuscular, ejercicio.tipo)) !== tracking) {
        return { error: `«${nombreStrong}» no se puede emparejar con «${ejercicio.nombre}»: uno es de ${tracking === '1RM' ? 'fuerza' : 'cardio'} y el otro no` };
      }
      asignacion.set(nombreStrong, { exerciseId: String(ejercicio._id) });
      continue;
    }

    if (!esObjeto(nuevo) || typeof nuevo.nombre !== 'string') return { error: `«${nombreStrong}»: falta el nombre del ejercicio nuevo` };
    const nombre = nuevo.nombre.trim();
    const clave = normalizarNombre(nombre);
    // Decisión de David: un nombre que ya tienes (sin mayúsculas ni tildes) no se crea otra vez;
    // la vista previa propone usar el existente.
    if (nombresExistentes.has(clave)) return { error: `Ya tienes un ejercicio llamado «${nombre}»: emparéjalo con ese` };
    if (nombresNuevos.has(clave)) return { error: `«${nombreStrong}» y «${nombresNuevos.get(clave)}» crearían dos ejercicios con el mismo nombre` };
    const trackingNuevo = derivarTracking(nuevo.grupoMuscular, nuevo.tipo);
    if (trackingNuevo !== tracking) {
      return { error: `«${nombreStrong}» trae series de ${tracking === '1RM' ? 'fuerza' : 'cardio'}: el ejercicio nuevo tiene que ser del mismo tipo` };
    }
    nombresNuevos.set(clave, nombreStrong);
    asignacion.set(nombreStrong, { crear: { nombre, grupoMuscular: nuevo.grupoMuscular, tipo: nuevo.tipo, tracking: trackingNuevo } });
  }
  return { asignacion };
};

// La serie tal como se guarda: solo los campos de su tracking. null si no queda nada que guardar
// (una serie solo con distancia en un ejercicio de fuerza; la compatibilidad lo hace raro).
const serieParaGuardar = (serie, tracking, numeroSerie) => {
  const base = tracking === '1RM'
    ? { peso: serie.peso, reps: serie.reps }
    : { tiempoSegundos: serie.tiempoSegundos, distanciaMetros: serie.distanciaMetros };
  if (Object.values(base).every((v) => !v)) return null;
  return { numeroSerie, ...base, ...(serie.rpe !== undefined && { rpe: serie.rpe }) };
};

// Monta los documentos de sesión que se van a guardar.
//   sesiones: las de agruparSesiones que se importan (ya sin las importadas ni las saltadas);
//   ejercicioDe: Map nombreStrong → { _id, nombre, tracking } (los elegidos y los recién creados);
//   rutinas: [{ _id, nombre }] del usuario; userId, lote: los de esta importación.
// Devuelve { documentos, seriesSinDatos, juntados, notasCortadas }: juntados cuenta los ejercicios
// de Strong que se unieron a otro en la misma sesión (decisión 2).
// Las notas se vuelven a montar aquí, con el número de serie que se verá en Yield Fit (decisión
// de David): al juntar dos ejercicios, la serie 1 del segundo pasa a ser la 3.
export const construirSesiones = ({ sesiones, ejercicioDe, rutinas, userId, lote, origen }) => {
  // Solo se enlaza la rutina si el nombre coincide exactamente con UNA (decisión del plan): con
  // dos rutinas del mismo nombre no se sabe cuál era.
  const rutinaPorNombre = new Map();
  for (const r of rutinas) rutinaPorNombre.set(r.nombre, rutinaPorNombre.has(r.nombre) ? null : r._id);

  let seriesSinDatos = 0;
  let juntados = 0;
  let notasCortadas = 0;
  const documentos = sesiones.map((s) => {
    // Un ejercicio de Yield Fit por sesión: si dos de Strong van al mismo, se juntan, con las
    // series seguidas en el orden del CSV.
    // Cada serie recuerda de qué ejercicio de Strong venía, para su nota.
    const porEjercicio = new Map();
    for (const e of s.ejercicios) {
      const destino = ejercicioDe.get(e.nombreStrong);
      const id = String(destino._id);
      const series = e.series.map((serie) => ({ serie, deStrong: e.nombreStrong }));
      if (porEjercicio.has(id)) {
        juntados++;
        const grupo = porEjercicio.get(id);
        grupo.series.push(...series);
        grupo.descansoSegundos ??= e.descansoSegundos;
      } else {
        porEjercicio.set(id, { destino, series, descansoSegundos: e.descansoSegundos });
      }
    }

    const ejercicios = [];
    const notasSerie = [];
    for (const { destino, series, descansoSegundos } of porEjercicio.values()) {
      const sets = [];
      for (const { serie, deStrong } of series) {
        const guardada = serieParaGuardar(serie, destino.tracking, sets.length + 1);
        if (!guardada) {
          seriesSinDatos++;
          continue;
        }
        sets.push(guardada);
        if (serie.nota) notasSerie.push({ ejercicio: deStrong, numeroSerie: guardada.numeroSerie, texto: serie.nota });
      }
      if (sets.length === 0) continue;
      ejercicios.push({
        exerciseId: destino._id,
        nombreSnapshot: destino.nombre,
        trackingSnapshot: destino.tracking,
        ...(descansoSegundos !== null && descansoSegundos !== undefined && { descansoSegundos }),
        orden: ejercicios.length,
        mejor1RM: mejor1RMDeEjercicio({ trackingSnapshot: destino.tracking, sets }) ?? undefined,
        sets,
      });
    }

    const { notas, cortadas } = juntarNotas(s.notaEntreno, notasSerie);
    if (cortadas) notasCortadas++;
    const workoutId = rutinaPorNombre.get(s.nombreStrong) ?? undefined;
    return {
      userId,
      ...(workoutId && { workoutId }),
      nombre: s.nombre,
      fecha: s.fecha,
      ...(s.duracionSegundos !== null && { duracionSegundos: s.duracionSegundos }),
      ...(notas && { notas }),
      ejercicios,
      importacion: { origen, clave: s.clave, lote },
    };
  }).filter((d) => d.ejercicios.length > 0);

  return { documentos, seriesSinDatos, juntados, notasCortadas };
};
