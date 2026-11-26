import apiClient from '@/api/client.js';

// Importar el historial desde Strong (bloque 7b). El CSV viaja como texto dentro del JSON: el
// servidor no lo guarda, lo lee y lo descarta.

// GET /api/importar/opciones → { opciones: { maxBytes, unidades } }
export const getOpcionesImportar = () => apiClient.get('/importar/opciones');

// POST /api/importar/strong/vista-previa → { vistaPrevia }. No escribe nada.
export const vistaPreviaStrong = ({ csv, zona, unidad }) =>
  apiClient.post('/importar/strong/vista-previa', { csv, zona, unidad });

// POST /api/importar/strong → { importacion }. Tarda de verdad (hasta unos 10 s con un archivo
// grande): no cuenta como "servidor dormido" (vigilarLentitud: false). Sin timeout: axios no
// tiene ninguno por defecto y la importación no debe cortarse antes que el servidor.
export const importarStrong = (cuerpo) =>
  apiClient.post('/importar/strong', cuerpo, { vigilarLentitud: false });

// GET /api/importar/lotes → { lotes: [{ lote, fecha, sesiones }] }
export const listarLotes = () => apiClient.get('/importar/lotes');

// DELETE /api/importar/lotes/:lote → { deshecha }. También tarda (recalcula récords).
export const deshacerLote = (lote) =>
  apiClient.delete(`/importar/lotes/${lote}`, { vigilarLentitud: false });
