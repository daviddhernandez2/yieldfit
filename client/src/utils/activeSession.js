// Utilidades para gestionar la sesión activa en localStorage.
// Centralizar aquí la clave y los métodos evita errores de tipeo
// y facilita cambios futuros (por ejemplo, migrar a IndexedDB).

const STORAGE_KEY = "yieldfit_active_session";

// Evento personalizado que se dispara en la misma pestaña cuando la
// sesión activa cambia. El hook useActiveSession lo escucha para
// mantenerse sincronizado.
const EVENT_NAME = "yieldfit:active-session-changed";

// Lee la sesión activa. Devuelve null si no hay o si el JSON está corrupto.
export const readActiveSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

// Guarda o actualiza la sesión activa completa.
// Dispara el evento global para que los componentes suscritos
// (MiniSession, etc.) se re-rendericen.
export const writeActiveSession = (session) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    // Cuota excedida u otro problema: falla silenciosamente.
  }
};

// Limpia la sesión activa. Se llama tras "Terminar" o al descartar.
// Dispara el evento global para ocultar la MiniSession.
export const clearActiveSession = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(EVENT_NAME));
};

// Construye el objeto inicial de una sesión activa a partir de una rutina.
//
// Como el backend puede devolver el exerciseId de una rutina bien populado
// (objeto con nombre) o sin popular (solo el ObjectId), soportamos los dos
// casos. Adicionalmente se acepta un mapa opcional exerciseNombreById para
// resolver el nombre por ID cuando la rutina viene sin popular.
// detalleById (bloque 9b): Map(id → { grupoMuscular, tipo }), para mostrar "Pecho ·
// Máquinas" bajo el nombre en la sesión. Opcional: sin él, esos campos no se guardan.
// bloqueados: Set con los exerciseId que no se pueden registrar todavía (cardio,
// DECISIONS.md 0030). Se decide al empezar, con las opciones del servidor, y se guarda en
// la sesión: así la sesión sabe qué filas bloquear aunque se recargue sin cobertura.
export const buildActiveSessionFromWorkout = (
  workout,
  exerciseNombreById = null,
  bloqueados = new Set(),
  detalleById = new Map(),
) => {
  return {
    startTime: Date.now(),
    workoutId: workout._id,
    nombre: workout.nombre,
    ejercicios: workout.ejercicios.map((ej) => {
      // Normalizamos el exerciseId a string (viene como objeto si el
      // backend hizo populate, o como string plano si no).
      const exerciseIdStr =
        typeof ej.exerciseId === "string" ? ej.exerciseId : ej.exerciseId._id;

      // Resolvemos el nombre por prioridad:
      // 1. El nombre del ejercicio populado en la rutina, si existe.
      // 2. El nombre del mapa de catálogo pasado como argumento.
      // 3. Fallback "Ejercicio" (no debería ocurrir en producción).
      const nombreDesdePopulate =
        typeof ej.exerciseId === "object" ? ej.exerciseId.nombre : null;
      const nombreDesdeMapa = exerciseNombreById
        ? exerciseNombreById.get(exerciseIdStr)
        : null;
      const exerciseNombre =
        nombreDesdePopulate || nombreDesdeMapa || "Ejercicio";

      // Un ejercicio bloqueado entra en la sesión (se ve que está en la rutina) pero sin
      // series: no se puede marcar nada, no cuenta en el resumen y no se envía al guardar.
      const bloqueado = bloqueados.has(exerciseIdStr);

      const detalle = detalleById.get(exerciseIdStr);

      return {
        exerciseId: exerciseIdStr,
        exerciseNombre,
        // Campos opcionales (bloque 9b): una sesión empezada antes no los tiene y se ve igual,
        // solo sin la línea de grupo y tipo.
        ...(detalle && { grupoMuscular: detalle.grupoMuscular, tipo: detalle.tipo }),
        bloqueado,
        descansoSegundos: ej.descansoSegundos,
        // Cada set recibe un id local estable (no confundir con el _id de Mongo,
        // que solo existe tras persistir). Se usa como key de React para que
        // añadir/quitar series en medio de la lista no desincronice el estado
        // interno de los inputs de las filas siguientes.
        sets: Array.from({ length: bloqueado ? 0 : ej.numSeries }, () => ({
          id: crypto.randomUUID(),
          peso: "",
          reps: "",
          completada: false,
        })),
      };
    }),
  };
};

// Ejercicios de la sesión activa que tienen alguna serie completada pero ya no
// existen en el catálogo del usuario (se borraron durante el entreno, o la sesión
// es de antes de que el borrado limpiara las rutinas). El servidor rechazaría la
// sesión entera con un 400 si se enviaran, así que hay que quitarlos y avisar.
// `idsExistentes` es un Set con los _id de los ejercicios que existen hoy.
export const ejerciciosBorradosConSeries = (session, idsExistentes) =>
  session.ejercicios.filter(
    (ej) => ej.sets.some((s) => s.completada) && !idsExistentes.has(ej.exerciseId),
  );

// Aviso exacto de lo que se pierde: una frase por ejercicio, con su nombre.
export const avisoEjerciciosBorrados = (borrados) =>
  borrados
    .map(
      (ej) =>
        `No se guardarán las series de «${ej.exerciseNombre}» porque ese ejercicio ya no existe.`,
    )
    .join(" ");

// "1 ejercicio" / "3 ejercicios": el número con la palabra en singular o plural.
// Se pasan las dos formas porque en español no siempre basta con añadir una "s"
// (p. ej. "1 sesión" / "2 sesiones").
export const contar = (n, singular, plural) => `${n} ${n === 1 ? singular : plural}`;

// ---------------------------------------------------------------------------
// Serie anterior (bloque 5, DECISIONS.md 0029)
// La sesión activa guarda en `anteriores` lo que devuelve GET /api/sessions/previous-sets:
// { <exerciseId>: { fecha, sets } }. Se guarda dentro de la sesión (localStorage) para que
// siga disponible si se recarga o se pierde la cobertura en mitad del entreno.

// Peso y reps de la vez anterior para una serie, emparejando por posición (la 2.ª serie
// con la 2.ª). null si ese ejercicio no se ha hecho nunca o la vez anterior tuvo menos series.
export const serieAnterior = (session, exerciseIndex, setIndex) => {
  const ej = session.ejercicios[exerciseIndex];
  const anterior = session.anteriores?.[ej.exerciseId]?.sets?.[setIndex];
  if (!anterior) return null;
  return { peso: anterior.peso ?? null, reps: anterior.reps ?? null };
};

// Atajo de repetir: al marcar como completada una serie, cada campo que esté VACÍO se
// rellena con el valor de la vez anterior. Lo que el usuario haya escrito no se toca.
// Devuelve solo los cambios (para mezclarlos con { completada: true }).
export const rellenarConAnterior = (set, anterior) => {
  if (!anterior) return {};
  const cambios = {};
  if (set.peso === "" && anterior.peso != null) cambios.peso = String(anterior.peso);
  if (set.reps === "" && anterior.reps != null) cambios.reps = String(anterior.reps);
  return cambios;
};
