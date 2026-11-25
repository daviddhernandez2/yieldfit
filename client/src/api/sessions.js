import apiClient from '@/api/client.js';

// POST /api/sessions
// Crea una nueva sesión finalizada. El backend genera snapshots inmutables.
export const createSession = (data) => {
  return apiClient.post('/sessions', data);
};

// GET /api/sessions?cursor=…&limite=…
// Sesiones del usuario, más recientes primero, de 20 en 20. Devuelve
// { sessions, siguienteCursor }: para la página siguiente se pasa ese cursor; null
// significa que no hay más.
export const listSessions = ({ cursor, limite } = {}) => {
  return apiClient.get('/sessions', { params: { cursor, limite } });
};

// GET /api/sessions/:id
export const getSession = (id) => {
  return apiClient.get(`/sessions/${id}`);
};

// DELETE /api/sessions/:id
export const deleteSession = (id) => {
  return apiClient.delete(`/sessions/${id}`);
};

// GET /api/sessions/previous-sets?exerciseIds=a,b,c
// Para cada ejercicio, las series de la última sesión guardada que lo incluye (en
// cualquier rutina). Devuelve { anteriores: { <exerciseId>: { fecha, sets } } }; los
// ejercicios que no se han hecho nunca no aparecen.
export const getPreviousSets = (exerciseIds) => {
  return apiClient.get('/sessions/previous-sets', {
    params: { exerciseIds: [...new Set(exerciseIds)].join(',') },
  });
};

// GET /api/sessions/previous-note?workoutId=…
// "La nota de la última vez" (bloque 11d): la nota de la sesión más reciente de esa rutina, si
// la tiene. Devuelve { notaAnterior: { texto, fecha } } o { notaAnterior: null }.
export const getPreviousNote = (workoutId) => {
  return apiClient.get('/sessions/previous-note', { params: { workoutId } });
};

// GET /api/sessions/days?desde=…&hasta=…&zona=…
// Días entrenados en un rango (como mucho un año), para el calendario. Devuelve
// { dias: [{ dia: '2026-11-03', sesiones: [{ _id, nombre, fecha, duracionSegundos,
// numEjercicios }] }] } (sin series: bloque 8b). La zona es la del
// dispositivo, para que una sesión a las 00:30 cuente en el día que se vio.
export const getTrainedDays = ({ desde, hasta }) => {
  const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return apiClient.get('/sessions/days', { params: { desde, hasta, zona } });
};


// GET /api/sessions/records?limite=5 → { records: [{ sessionId, fecha, exerciseId, nombre,
// anterior, nuevo }] }: los récords personales más recientes, con el 1RM estimado anterior y
// el nuevo (widget "Nuevos récords" del Dashboard, bloque 9d).
export const getRecordsRecientes = (limite = 5) => {
  return apiClient.get('/sessions/records', { params: { limite } });
};
