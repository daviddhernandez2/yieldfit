import apiClient from '@/api/client.js';

// POST /api/auth/register
// Registra un nuevo usuario. Devuelve { message, token, user }.
export const register = (userData) => {
  return apiClient.post('/auth/register', userData);
};

// POST /api/auth/login
// Inicia sesión. Devuelve { message, token, user }.
export const login = (credentials) => {
  return apiClient.post('/auth/login', credentials);
};

// GET /api/auth/me
// Devuelve los datos del usuario autenticado. Requiere token válido.
export const getMe = () => {
  return apiClient.get('/auth/me');
};