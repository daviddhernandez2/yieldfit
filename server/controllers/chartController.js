import mongoose from 'mongoose';
import Chart from '../models/Chart.js';
import Exercise from '../models/Exercise.js';
import Dashboard from '../models/Dashboard.js';

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
    // En orden de creación: en el Dashboard, cada grupo nuevo aparece debajo de los anteriores.
    const charts = await Chart.find({ userId: req.user._id }).sort({ createdAt: 1 });
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
// Con `todos: true` crea el grupo "Todos" (bloque 9d), p. ej. al volver a añadirlo desde el
// catálogo después de borrarlo: sin lista de ejercicios y como mucho uno (409 si ya existe).
export const create = async (req, res, next) => {
  try {
    const { nombre, exerciseIds = [], todos } = req.body;

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
      // Solo se guarda si es true: en los grupos normales el campo no existe.
      todos: todos === true ? true : undefined,
    });
    await chart.save();

    res.status(201).json({ chart });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Conflict', message: 'Ya tienes el grupo Todos' });
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
// Su widget del Dashboard se quita en la misma transacción (bloque 9d): un widget que apunta a
// un grupo que no existe no se podría pintar. Vale también para "Todos".
export const remove = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await Chart.deleteOne({ _id: req.params.id, userId: req.user._id }, { session });
      if (result.deletedCount === 0) return;
      await Dashboard.updateOne(
        { userId: req.user._id },
        { $pull: { widgets: { chartId: req.params.id } } },
        { session }
      );
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
  } finally {
    await session.endSession();
  }
};