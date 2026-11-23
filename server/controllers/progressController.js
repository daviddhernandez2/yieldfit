import Session from '../models/Session.js';
import Exercise from '../models/Exercise.js';
import { calcularProgreso } from '../utils/progreso.js';

// Convierte un parámetro de fecha (ISO, p. ej. 2026-01-31 o 2026-01-31T00:00:00Z).
// Devuelve undefined si no viene, o null si viene pero no es una fecha válida.
const leerFecha = (valor) => {
  if (valor === undefined) return undefined;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

// GET /api/progress?desde=…&hasta=…
// Progreso del usuario en un rango de fechas (los dos extremos son opcionales: sin
// ninguno, todo el historial). Devuelve { progreso: { sesiones, porcentaje, ejercicios,
// serie } }; el cálculo está explicado en utils/progreso.js (DECISIONS.md, 0026).
//
// Lo que crece con el historial está acotado: solo se leen fecha, exerciseId y mejor1RM
// de las sesiones del rango (nunca las series), usando el índice { userId, fecha }.
export const get = async (req, res, next) => {
  try {
    const desde = leerFecha(req.query.desde);
    const hasta = leerFecha(req.query.hasta);
    if (desde === null || hasta === null) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'desde y hasta tienen que ser fechas válidas (p. ej. 2026-01-31)',
      });
    }

    const filtro = { userId: req.user._id };
    if (desde || hasta) {
      filtro.fecha = {};
      if (desde) filtro.fecha.$gte = desde;
      if (hasta) filtro.fecha.$lte = hasta;
    }

    // Las dos consultas en paralelo: una no depende de la otra.
    const [sesiones, ejercicios] = await Promise.all([
      Session.find(filtro, { fecha: 1, 'ejercicios.exerciseId': 1, 'ejercicios.mejor1RM': 1 })
        .sort({ fecha: 1 })
        .lean(),
      // Solo los ejercicios que existen hoy: los borrados no cuentan (0020). Se usa su
      // nombre actual, que es el que el usuario reconoce.
      Exercise.find({ userId: req.user._id }, { nombre: 1 }).lean(),
    ]);

    const nombres = new Map(ejercicios.map((ex) => [String(ex._id), ex.nombre]));
    res.status(200).json({ progreso: calcularProgreso(sesiones, nombres) });
  } catch (error) {
    next(error);
  }
};
