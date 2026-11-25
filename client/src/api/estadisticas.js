import apiClient from '@/api/client.js';

// GET /api/estadisticas/actividad?zona=… → { actividad: { semanas, racha, mes } }: datos de
// Frecuencia semanal, Racha y Sesiones totales del Dashboard (bloque 9d). La zona es la del
// dispositivo: las semanas y los meses se cuentan en la hora del usuario.
export const getActividad = () => {
  const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return apiClient.get('/estadisticas/actividad', { params: { zona } });
};

// GET /api/estadisticas/record?exerciseId=… → { record: { nombre, actual, historia, total } }:
// widget "Récord de un ejercicio" (bloque 9d). historia, del récord más nuevo al más antiguo:
// [{ fecha, valor, anterior, sessionId }]. actual es null si aún no hay récord.
export const getRecordEjercicio = (exerciseId) => {
  return apiClient.get('/estadisticas/record', { params: { exerciseId } });
};
