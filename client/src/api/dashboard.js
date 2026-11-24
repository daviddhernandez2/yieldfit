import apiClient from '@/api/client.js';

// Dashboard personalizable (bloque 9d, DECISIONS 0052).

// GET /api/dashboard → { dashboard: { widgets } }. La primera vez lo crea el servidor.
export const getDashboard = () => apiClient.get('/dashboard');

// PUT /api/dashboard  { widgets } → { dashboard }. Guarda la lista entera.
export const updateDashboard = (widgets) => apiClient.put('/dashboard', { widgets });

// GET /api/dashboard/catalogo → { catalogo, tamanos, rangos, rangoPorDefecto, maxWidgets }.
// Tipos, tamaños y rangos vienen del servidor: el cliente no tiene copias (0024).
export const getCatalogo = () => apiClient.get('/dashboard/catalogo');
