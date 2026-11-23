import apiClient from '@/api/client.js';

// Página /developer (bloque 11b). Todas responden 403 si el usuario no es admin: el
// servidor decide, aunque el cliente ya oculte la página.

// GET /api/admin/reports?estado&usuario&desde&hasta&cursor&limite → { reports, siguienteCursor }
// desde/hasta: instantes ISO (utils/filtroFechas.js). siguienteCursor null = no hay más.
export const listReports = (params = {}) => {
  return apiClient.get('/admin/reports', { params });
};

// PATCH /api/admin/reports/:id  { estado: 'pendiente' | 'resuelto' } → { report }
export const updateReportEstado = (id, estado) => {
  return apiClient.patch(`/admin/reports/${id}`, { estado });
};

// GET /api/admin/users → { users, total }. Sin fecha de nacimiento, peso, altura ni género.
export const listUsers = () => {
  return apiClient.get('/admin/users');
};
