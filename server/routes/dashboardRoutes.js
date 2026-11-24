import express from 'express';
import { catalogo, get, update } from '../controllers/dashboardController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas las rutas del dashboard requieren autenticación.
router.use(requireAuth);

router.get('/catalogo', catalogo);
router.get('/', get);
router.put('/', update);

export default router;
