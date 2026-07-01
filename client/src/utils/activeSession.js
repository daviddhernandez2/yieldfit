// Utilidades para gestionar la sesión activa en localStorage.
// Centralizar aquí la clave y los métodos evita errores de tipeo
// y facilita cambios futuros (por ejemplo, migrar a IndexedDB).

const STORAGE_KEY = 'yieldfit_active_session';

// Lee la sesión activa. Devuelve null si no hay o si el JSON está corrupto.
export const readActiveSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Datos corruptos: los limpiamos para evitar bloquear al usuario.
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

// Guarda o actualiza la sesión activa completa.
// Se llama en cada cambio significativo del formulario de sesión.
export const writeActiveSession = (session) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Cuota excedida u otro problema: falla silenciosamente.
    // No queremos que un fallo de storage rompa la UI del usuario entrenando.
  }
};

// Limpia la sesión activa. Se llama tras "Terminar" o al descartar.
export const clearActiveSession = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// Construye el objeto inicial de una sesión activa a partir de una rutina.
// Cada ejercicio de la rutina genera un objeto con:
//  - referencias al Exercise
//  - descansoSegundos copiado (para el timer)
//  - array de sets vacíos según numSeries planificado
export const buildActiveSessionFromWorkout = (workout) => {
  return {
    startTime: Date.now(),
    workoutId: workout._id,
    nombre: workout.nombre,
    ejercicios: workout.ejercicios.map((ej) => ({
      exerciseId: ej.exerciseId._id || ej.exerciseId,
      // Guardamos el nombre para renderizarlo sin re-consultar el catálogo
      // (el backend hace populate, así ej.exerciseId es el objeto Exercise).
      exerciseNombre: ej.exerciseId.nombre || 'Ejercicio',
      descansoSegundos: ej.descansoSegundos,
      sets: Array.from({ length: ej.numSeries }, () => ({
        peso: '',
        reps: '',
        excluida: false,
        completada: false,
      })),
    })),
  };
};