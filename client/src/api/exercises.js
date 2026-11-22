import apiClient from '@/api/client.js';

// GET /api/exercises
// Devuelve la lista de ejercicios del usuario.
// Acepta query params para filtrar: { grupoMuscular, tipo, search }.
export const listExercises = (params = {}) => {
  return apiClient.get('/exercises', { params });
};

// GET /api/exercises/opciones
// Grupos musculares y tipos válidos, cada uno { value, label }. Mejor usar el hook
// useOpcionesEjercicio, que hace una sola petición aunque varias pantallas lo pidan.
export const getOpcionesEjercicio = () => {
  return apiClient.get('/exercises/opciones');
};

// GET /api/exercises/:id
export const getExercise = (id) => {
  return apiClient.get(`/exercises/${id}`);
};

// POST /api/exercises
export const createExercise = (data) => {
  return apiClient.post('/exercises', data);
};

// PUT /api/exercises/:id
export const updateExercise = (id, data) => {
  return apiClient.put(`/exercises/${id}`, data);
};

// DELETE /api/exercises/:id
export const deleteExercise = (id) => {
  return apiClient.delete(`/exercises/${id}`);
};