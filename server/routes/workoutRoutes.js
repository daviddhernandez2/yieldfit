import express from 'express';
import { list, resumen, getOne, create, update, remove } from '../controllers/workoutController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas las rutas de rutinas requieren autenticación.
router.use(requireAuth);

router.get('/', list);
// Antes de '/:id': si no, Express tomaría "resumen" por un id.
router.get('/resumen', resumen);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;