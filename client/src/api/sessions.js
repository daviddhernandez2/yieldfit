import apiClient from './client.js';

// POST /api/sessions
// Crea una nueva sesión finalizada. El backend genera snapshots inmutables.
export const createSession = (data) => {
  return apiClient.post('/sessions', data);
};

// GET /api/sessions
// Devuelve las sesiones del usuario, más recientes primero.
export const listSessions = () => {
  return apiClient.get('/sessions');
};

// GET /api/sessions/:id
export const getSession = (id) => {
  return apiClient.get(`/sessions/${id}`);
};

// DELETE /api/sessions/:id
export const deleteSession = (id) => {
  return apiClient.delete(`/sessions/${id}`);
};