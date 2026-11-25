import Chart from '../models/Chart.js';
import Exercise from '../models/Exercise.js';
import Workout from '../models/Workout.js';
import { CAMPO_REFERENCIA, CATALOGO, MAX_WIDGETS, RANGOS, RANGO_POR_DEFECTO, TAMANOS } from '../data/catalogoWidgets.js';
import { asegurarDashboard, cambiaEstructura, validarWidgets } from '../utils/dashboard.js';

// Dashboard personalizable (bloque 9d, DECISIONS 0052).

// GET /api/dashboard/catalogo
// El catálogo de widgets, los tamaños y los rangos: el cliente no tiene copias (0024).
export const catalogo = (req, res) => {
  res.status(200).json({
    catalogo: CATALOGO,
    tamanos: TAMANOS,
    rangos: RANGOS,
    rangoPorDefecto: RANGO_POR_DEFECTO,
    maxWidgets: MAX_WIDGETS,
    // En qué campo del widget va cada referencia ({ chart: 'chartId', … }): el modo edición lo
    // usa al añadir un widget que apunta a un grupo, un ejercicio o una rutina (bloque 9d).
    camposReferencia: CAMPO_REFERENCIA,
  });
};

// GET /api/dashboard
// El dashboard del usuario. La primera vez lo crea, con su grupo "Todos" (asegurarDashboard).
export const get = async (req, res, next) => {
  try {
    const dashboard = await asegurarDashboard(req.user._id);
    res.status(200).json({ dashboard });
  } catch (error) {
    next(error);
  }
};

// ¿Son del usuario todos los ids de `ids`? Una consulta por colección, sin repetir ids.
const sonDelUsuario = async (Modelo, ids, userId) => {
  const unicos = [...new Set(ids.map(String))];
  if (unicos.length === 0) return true;
  const count = await Modelo.countDocuments({ _id: { $in: unicos }, userId });
  return count === unicos.length;
};

// PUT /api/dashboard   { widgets: [...] }
// Guarda el dashboard entero de una vez (el botón "Hecho" del modo edición): orden, tamaños,
// rangos, añadidos y quitados. Primero las reglas del catálogo (validarWidgets) y después que
// cada grupo, ejercicio y rutina referenciados sean del usuario.
export const update = async (req, res, next) => {
  try {
    const { widgets, error } = validarWidgets(req.body?.widgets);
    if (error) return res.status(400).json({ error: 'Validation Error', message: error });

    const userId = req.user._id;
    const de = (campo) => widgets.filter((w) => w[campo]).map((w) => w[campo]);
    const [chartsOk, ejerciciosOk, rutinasOk] = await Promise.all([
      sonDelUsuario(Chart, de('chartId'), userId),
      sonDelUsuario(Exercise, de('exerciseId'), userId),
      sonDelUsuario(Workout, de('workoutId'), userId),
    ]);
    if (!chartsOk || !ejerciciosOk || !rutinasOk) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Algún grupo, ejercicio o rutina no existe o no pertenece al usuario',
      });
    }

    const dashboard = await asegurarDashboard(userId);
    // Mover, añadir, quitar o cambiar tamaños lo personaliza: desde entonces ya no se rehace con
    // el dashboard por defecto. Cambiar solo el rango no cuenta (utils/dashboard.js).
    if (cambiaEstructura(dashboard.widgets.map((w) => w.toObject()), widgets)) dashboard.porDefecto = false;
    dashboard.widgets = widgets;
    await dashboard.save();
    res.status(200).json({ dashboard });
  } catch (error) {
    // Un id con formato no válido (chartId: "abc") llega como CastError: es un dato mal
    // enviado, no un fallo del servidor.
    if (error.name === 'CastError' || error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation Error', message: 'Datos no válidos' });
    }
    next(error);
  }
};
