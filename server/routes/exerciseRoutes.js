import express from 'express';
import { opciones, list, getOne, create, update, remove } from '../controllers/exerciseController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas las rutas de este recurso requieren autenticación.
// requireAuth se aplica una sola vez al router en lugar de repetirlo por ruta.
router.use(requireAuth);

router.get('/', list);
// Antes de '/:id': Express prueba las rutas en orden, y '/:id' capturaría "opciones"
// como si fuera un id (y respondería 404 al no ser un ObjectId válido).
router.get('/opciones', opciones);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;