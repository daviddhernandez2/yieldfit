import apiClient from '@/api/client.js';

// GET /api/workouts
// Devuelve las rutinas del usuario, ordenadas por createdAt descendente.
export const listWorkouts = () => {
  return apiClient.get('/workouts');
};

// GET /api/workouts/:id
export const getWorkout = (id) => {
  return apiClient.get(`/workouts/${id}`);
};

// POST /api/workouts
// El servidor reasigna el campo "orden" de cada ejercicio según el índice del array.
export const createWorkout = (data) => {
  return apiClient.post('/workouts', data);
};

// PUT /api/workouts/:id
export const updateWorkout = (id, data) => {
  return apiClient.put(`/workouts/${id}`, data);
};

// DELETE /api/workouts/:id
export const deleteWorkout = (id) => {
  return apiClient.delete(`/workouts/${id}`);
};