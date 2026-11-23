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

// POST /api/auth/logout
// Cierra la sesión de este dispositivo en el servidor: invalida el token de renovación y
// borra su cookie (bloque 11). sinRenovar: si falla con 401, no hay nada que renovar.
export const logout = () => {
  return apiClient.post('/auth/logout', null, { sinRenovar: true });
};