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