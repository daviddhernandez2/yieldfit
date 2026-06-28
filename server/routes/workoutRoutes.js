import express from 'express';
import { list, getOne, create, update, remove } from '../controllers/workoutController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas las rutas de rutinas requieren autenticación.
router.use(requireAuth);

router.get('/', list);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;