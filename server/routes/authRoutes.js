import express from 'express';
import { register, login, me, refresh, logout, deleteMe } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { limiteBorrarCuenta, limiteLogin, limiteRegistro } from '../middlewares/limiteIntentos.js';

const router = express.Router();

// Límite de intentos antes del controlador (bloque 11): ver middlewares/limiteIntentos.js.
router.post('/register', limiteRegistro, register);
router.post('/login', limiteLogin, login);
router.get('/me', requireAuth, me);
// Borrar la cuenta (bloque 11b): el límite va tras requireAuth porque cuenta por usuario.
router.delete('/me', requireAuth, limiteBorrarCuenta, deleteMe);
// Sin requireAuth: la prueba de identidad es la cookie de renovación (bloque 11).
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;