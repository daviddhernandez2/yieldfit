import express from 'express';
import { create } from '../controllers/reportController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { limiteReportes } from '../middlewares/limiteIntentos.js';

const router = express.Router();

// Reportes de fallos (bloque 11b). Solo usuarios con sesión.
router.use(requireAuth);

// El límite va después de requireAuth porque cuenta por usuario (req.user).
router.post('/', limiteReportes, create);

export default router;
