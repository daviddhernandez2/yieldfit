import express from 'express';
import { actividad, record } from '../controllers/estadisticasController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Estadísticas para los widgets del Dashboard (bloque 9d). Todas requieren autenticación.
router.use(requireAuth);

router.get('/actividad', actividad);
router.get('/record', record);

export default router;
