import apiClient from '@/api/client.js';

// Grupos de progreso (modelo Chart en el servidor; en la app se llaman "grupos").
// Un grupo es un nombre y una lista de ejercicios: su progreso lo calcula
// GET /api/progress?grupo=<id> (ver api/progress.js).

// GET /api/charts → { charts }, en orden de creación.
export const listCharts = () => {
  return apiClient.get('/charts');
};

// GET /api/charts/:id → { chart }
export const getChart = (id) => {
  return apiClient.get(`/charts/${id}`);
};

// POST /api/charts  { nombre, exerciseIds } → { chart }
export const createChart = (data) => {
  return apiClient.post('/charts', data);
};

// PUT /api/charts/:id  { nombre?, exerciseIds? } → { chart }
export const updateChart = (id, data) => {
  return apiClient.put(`/charts/${id}`, data);
};

// DELETE /api/charts/:id → 204. Solo borra el grupo: los ejercicios y sus sesiones no se tocan.
export const deleteChart = (id) => {
  return apiClient.delete(`/charts/${id}`);
};
