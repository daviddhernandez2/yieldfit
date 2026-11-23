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

// DELETE /api/auth/me  { password } → 204
// Borra la cuenta y todos sus datos (bloque 11b). Contraseña incorrecta → 403 (no 401: un
// 401 haría que el cliente renovara la sesión y la cerrara). 429 tras 5 fallos.
// axios manda el cuerpo de un DELETE en `data`.
export const deleteAccount = (password) => {
  return apiClient.delete('/auth/me', { data: { password } });
};
