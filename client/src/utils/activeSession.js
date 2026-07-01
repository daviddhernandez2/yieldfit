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
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

// Guarda o actualiza la sesión activa completa.
export const writeActiveSession = (session) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Cuota excedida u otro problema: falla silenciosamente.
  }
};

// Limpia la sesión activa. Se llama tras "Terminar" o al descartar.
export const clearActiveSession = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// Construye el objeto inicial de una sesión activa a partir de una rutina.
// El campo "excluido" (masculino) coincide con el schema del backend
// para evitar mappings en el POST y en la lectura del historial.
export const buildActiveSessionFromWorkout = (workout) => {
  return {
    startTime: Date.now(),
    workoutId: workout._id,
    nombre: workout.nombre,
    ejercicios: workout.ejercicios.map((ej) => ({
      exerciseId: ej.exerciseId._id || ej.exerciseId,
      exerciseNombre: ej.exerciseId.nombre || 'Ejercicio',
      descansoSegundos: ej.descansoSegundos,
      sets: Array.from({ length: ej.numSeries }, () => ({
        peso: '',
        reps: '',
        excluido: false,
        completada: false,
      })),
    })),
  };
};