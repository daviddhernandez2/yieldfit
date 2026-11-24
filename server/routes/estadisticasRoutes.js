import express from 'express';
import { actividad } from '../controllers/estadisticasController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Estadísticas para los widgets del Dashboard (bloque 9d). Todas requieren autenticación.
router.use(requireAuth);

router.get('/actividad', actividad);

export default router;
