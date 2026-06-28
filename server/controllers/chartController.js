import Chart from '../models/Chart.js';
import Exercise from '../models/Exercise.js';

// Comprueba que todos los exerciseIds existan y pertenezcan al usuario.
// Una sola query con countDocuments es más eficiente que un find + comparación.
// Devuelve true si todos pertenecen, false si alguno es ajeno o inexistente.
const verificarOwnershipDeEjercicios = async (exerciseIds, userId) => {
  if (!exerciseIds || exerciseIds.length === 0) {
    return true;
  }

  const count = await Exercise.countDocuments({
    _id: { $in: exerciseIds },
    userId,
  });

  return count === exerciseIds.length;
};

// GET /api/charts
// Devuelve todas las gráficas del usuario, ordenadas por fecha de creación
// descendente (las más recientes arriba, como suele esperar el usuario).
export const list = async (req, res, next) => {
  try {
    const charts = await Chart.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ charts });
  } catch (error) {
    next(error);
  }
};

// GET /api/charts/:id
// Devuelve una gráfica concreta del usuario. 404 si no existe o es ajena.
export const getOne = async (req, res, next) => {
  try {
    const chart = await Chart.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!chart) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Gráfica no encontrada',
      });
    }

    res.status(200).json({ chart });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Gráfica no encontrada',
      });
    }
    next(error);
  }
};

// POST /api/charts
// Crea una nueva gráfica. Valida que los exerciseIds (si los hay) pertenezcan al usuario.
export const create = async (req, res, next) => {
  try {
    const { nombre, exerciseIds = [] } = req.body;

    // Validación de ownership cross-resource antes de guardar.
    // Evita que se creen referencias a ejercicios de otros usuarios.
    const ownershipOk = await verificarOwnershipDeEjercicios(exerciseIds, req.user._id);
    if (!ownershipOk) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Alguno de los ejercicios no existe o no pertenece al usuario',
      });
    }

    const chart = new Chart({
      userId: req.user._id,
      nombre,
      exerciseIds,
    });
    await chart.save();

    res.status(201).json({ chart });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Datos no válidos',
        details: messages,
      });
    }
    next(error);
  }
};

// PUT /api/charts/:id
// Actualiza una gráfica del usuario. Si se modifica exerciseIds, se revalida ownership.
export const update = async (req, res, next) => {
  try {
    const chart = await Chart.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!chart) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Gráfica no encontrada',
      });
    }

    const { nombre, exerciseIds } = req.body;

    // Solo revalidamos ownership si vienen exerciseIds nuevos en el body.
    if (exerciseIds !== undefined) {
      const ownershipOk = await verificarOwnershipDeEjercicios(exerciseIds, req.user._id);
      if (!ownershipOk) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Alguno de los ejercicios no existe o no pertenece al usuario',
        });
      }
      chart.exerciseIds = exerciseIds;
    }

    if (nombre !== undefined) chart.nombre = nombre;

    await chart.save();

    res.status(200).json({ chart });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Gráfica no encontrada',
      });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Datos no válidos',
        details: messages,
      });
    }
    next(error);
  }
};

// DELETE /api/charts/:id
// Borra una gráfica del usuario. Las sesiones de los ejercicios referenciados
// no se ven afectadas: una chart es solo una agrupación visual, no datos primarios.
export const remove = async (req, res, next) => {
  try {
    const result = await Chart.deleteOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Gráfica no encontrada',
      });
    }

    res.status(204).send();
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Gráfica no encontrada',
      });
    }
    next(error);
  }
};