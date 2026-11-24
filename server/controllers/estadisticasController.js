import Session from '../models/Session.js';
import { MAX_SEMANAS_RACHA, calcularActividad } from '../utils/actividad.js';
import { zonaValida } from '../utils/zona.js';

// GET /api/estadisticas/actividad?zona=Europe/Madrid
// Datos de los widgets Frecuencia semanal y Racha del Dashboard (bloque 9d):
// { actividad: { semanas: [{ inicio, sesiones, segundos }] (12), racha: { semanas, masDe } } }.
// El cálculo, en utils/actividad.js.
//
// No crece con el historial: lee solo `fecha` y `duracionSegundos` de las sesiones de las
// últimas MAX_SEMANAS_RACHA + 1 semanas (2 años), con el índice { userId, fecha }.
export const actividad = async (req, res, next) => {
  try {
    const zona = req.query.zona ?? 'UTC';
    if (!zonaValida(zona)) {
      return res.status(400).json({ error: 'Validation Error', message: 'zona horaria no válida' });
    }
    const ahora = new Date();
    // Una semana de margen más: la semana en curso y la frontera de la zona horaria.
    const desde = new Date(ahora.getTime() - (MAX_SEMANAS_RACHA + 2) * 7 * 24 * 60 * 60 * 1000);
    const sesiones = await Session.find(
      { userId: req.user._id, fecha: { $gte: desde } },
      { fecha: 1, duracionSegundos: 1, _id: 0 }
    ).lean();
    res.status(200).json({ actividad: calcularActividad(sesiones, zona, ahora) });
  } catch (error) {
    next(error);
  }
};
