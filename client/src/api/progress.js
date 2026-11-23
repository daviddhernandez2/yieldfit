import apiClient from '@/api/client.js';

// GET /api/progress?desde=…&hasta=…
// Progreso calculado en el servidor (DECISIONS.md, 0026). Fechas opcionales en ISO;
// sin ninguna, todo el historial. Devuelve { progreso: { sesiones, porcentaje,
// ejercicios: [{ exerciseId, nombre, porcentaje }], serie: [{ fecha, indice }] } }.
export const getProgress = (params = {}) => {
  return apiClient.get('/progress', { params });
};
