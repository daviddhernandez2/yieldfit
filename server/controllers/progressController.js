import Session from '../models/Session.js';
import mongoose from 'mongoose';
import Exercise from '../models/Exercise.js';
import Chart from '../models/Chart.js';
import { calcularProgreso, reducirSerie } from '../utils/progreso.js';

// Convierte un parámetro de fecha (ISO, p. ej. 2026-01-31 o 2026-01-31T00:00:00Z).
// Devuelve undefined si no viene, o null si viene pero no es una fecha válida.
const leerFecha = (valor) => {
  if (valor === undefined) return undefined;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

// GET /api/progress?desde=…&hasta=…&grupo=…
// Progreso del usuario en un rango de fechas (los dos extremos son opcionales: sin
// ninguno, todo el historial). Devuelve { progreso: { sesiones, porcentaje, ejercicios,
// serie } }; el cálculo está explicado en utils/progreso.js (DECISIONS.md, 0026).
//
// grupo (bloque 9, 0034): id de un Chart del usuario. Aplica EXACTAMENTE el mismo cálculo,
// pero solo a los ejercicios del grupo. La lista la lee el servidor del propio grupo: no
// viaja desde el cliente, así que no se puede desincronizar. Sin grupo, "Todos".
//
// La línea (serie) se reduce a ~150 puntos como mucho; el % se calcula con todos.
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

    // Ejercicios del grupo, si se pide uno. Solo un grupo del propio usuario.
    let idsDelGrupo = null;
    if (req.query.grupo !== undefined) {
      const grupo = mongoose.isValidObjectId(req.query.grupo)
        ? await Chart.findOne({ _id: req.query.grupo, userId: req.user._id }, { exerciseIds: 1 }).lean()
        : null;
      if (!grupo) {
        return res.status(404).json({ error: 'Not Found', message: 'Grupo no encontrado' });
      }
      idsDelGrupo = new Set(grupo.exerciseIds.map(String));
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

    // Los ejercicios que cuentan: los que existen hoy y, si hay grupo, los del grupo.
    const nombres = new Map(
      ejercicios
        .filter((ex) => !idsDelGrupo || idsDelGrupo.has(String(ex._id)))
        .map((ex) => [String(ex._id), ex.nombre])
    );
    const progreso = calcularProgreso(sesiones, nombres);
    res.status(200).json({ progreso: { ...progreso, serie: reducirSerie(progreso.serie) } });
  } catch (error) {
    next(error);
  }
};
