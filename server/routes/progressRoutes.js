import express from 'express';
import { get } from '../controllers/progressController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

// Solo lectura: el progreso se calcula a partir de las sesiones, no se guarda.
router.get('/', get);

export default router;
