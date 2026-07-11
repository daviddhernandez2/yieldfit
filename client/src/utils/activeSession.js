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
export const buildActiveSessionFromWorkout = (
  workout,
  exerciseNombreById = null,
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

      return {
        exerciseId: exerciseIdStr,
        exerciseNombre,
        descansoSegundos: ej.descansoSegundos,
        // Cada set recibe un id local estable (no confundir con el _id de Mongo,
        // que solo existe tras persistir). Se usa como key de React para que
        // añadir/quitar series en medio de la lista no desincronice el estado
        // interno de los inputs de las filas siguientes.
        sets: Array.from({ length: ej.numSeries }, () => ({
          id: crypto.randomUUID(),
          peso: "",
          reps: "",
          completada: false,
        })),
      };
    }),
  };
};
