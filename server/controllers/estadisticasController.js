import mongoose from 'mongoose';
import Session from '../models/Session.js';
import Exercise from '../models/Exercise.js';
import { MAX_SEMANAS_RACHA, calcularActividad } from '../utils/actividad.js';
import { zonaValida } from '../utils/zona.js';

// GET /api/estadisticas/actividad?zona=Europe/Madrid
// Datos de los widgets Frecuencia semanal y Racha del Dashboard (bloque 9d):
// { actividad: { semanas: [{ inicio, sesiones, segundos }] (32), racha: { semanas, masDe, estado } } }.
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

// Puntos de la historia de récords que se devuelven (la gráfica en escalones del widget). Con
// más récords que estos, la gráfica empieza en el más antiguo de los que caben.
const MAX_HISTORIA_RECORD = 24;

// GET /api/estadisticas/record?exerciseId=…
// Datos del widget "Récord de un ejercicio" (bloque 9d):
// { record: { nombre, actual, historia: [{ fecha, valor, anterior, sessionId }], total } }
//   - actual: la marca de ahora (Exercise.record1RM), o null si aún no hay récord;
//   - historia: los récords de ese ejercicio, del más nuevo al más antiguo (como mucho 24);
//   - total: cuántos récords lleva en total.
// Solo ejercicios de fuerza: el cardio no tiene 1RM (400). Un ejercicio ajeno o inexistente, 404.
//
// No crece con el historial sino con los récords: lee solo las sesiones que tienen algún récord y
// en las que está este ejercicio, con el índice parcial 'records_por_ejercicio' (models/Session.js). Por eso la consulta incluye
// 'ejercicios.esPR': true (la condición del índice parcial), además del $elemMatch que exige que
// el récord sea de este ejercicio, y lo nombra con hint: sin él, MongoDB podía elegir el índice
// de todas las sesiones del ejercicio. Sin las series.
export const record = async (req, res, next) => {
  try {
    const { exerciseId } = req.query;
    if (!mongoose.isValidObjectId(exerciseId)) {
      return res.status(400).json({ error: 'Validation Error', message: 'exerciseId tiene que ser un id válido' });
    }
    const ejercicio = await Exercise.findOne({ _id: exerciseId, userId: req.user._id }, { nombre: 1, tracking: 1, record1RM: 1 }).lean();
    if (!ejercicio) {
      return res.status(404).json({ error: 'Not Found', message: 'Ejercicio no encontrado' });
    }
    if (ejercicio.tracking !== '1RM') {
      return res.status(400).json({ error: 'Validation Error', message: 'Solo los ejercicios de fuerza tienen récord' });
    }

    const filtro = {
      userId: req.user._id,
      'ejercicios.esPR': true,
      ejercicios: { $elemMatch: { exerciseId: ejercicio._id, esPR: true } },
    };
    const [sesiones, total] = await Promise.all([
      Session.find(filtro, { fecha: 1, ejercicios: { $elemMatch: { exerciseId: ejercicio._id } } })
        .sort({ fecha: -1 })
        .limit(MAX_HISTORIA_RECORD)
        .hint('records_por_ejercicio')
        .lean(),
      Session.countDocuments(filtro).hint('records_por_ejercicio'),
    ]);
    const historia = sesiones.map((s) => ({
      fecha: s.fecha,
      valor: s.ejercicios[0].mejor1RM,
      anterior: s.ejercicios[0].prAnterior,
      sessionId: s._id,
    }));
    res.status(200).json({
      record: { nombre: ejercicio.nombre, actual: ejercicio.record1RM ?? null, historia, total },
    });
  } catch (error) {
    next(error);
  }
};
