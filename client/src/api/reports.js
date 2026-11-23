import apiClient from '@/api/client.js';

// Reportes de fallos (bloque 11b). El navegador no se manda: el servidor lo toma de la
// cabecera User-Agent de la propia petición.

// POST /api/reports  { descripcion, contexto?, ruta, pantalla: { ancho, alto } } → { report }
// 429 si se pasan 5 reportes en una hora (el mensaje dice cuánto falta).
export const crearReporte = (data) => {
  return apiClient.post('/reports', data);
};
