import express from 'express';
import { register, login, me } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { limiteLogin, limiteRegistro } from '../middlewares/limiteIntentos.js';

const router = express.Router();

// Límite de intentos antes del controlador (bloque 11): ver middlewares/limiteIntentos.js.
router.post('/register', limiteRegistro, register);
router.post('/login', limiteLogin, login);
router.get('/me', requireAuth, me);

export default router;