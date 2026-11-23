import express from 'express';
import { register, login, me, refresh, logout, deleteMe, changePassword } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { limiteConfirmarContrasena, limiteLogin, limiteRegistro } from '../middlewares/limiteIntentos.js';

const router = express.Router();

// Límite de intentos antes del controlador (bloque 11): ver middlewares/limiteIntentos.js.
router.post('/register', limiteRegistro, register);
router.post('/login', limiteLogin, login);
router.get('/me', requireAuth, me);
// Borrar la cuenta y cambiar la contraseña (bloque 11b): piden la contraseña actual. El
// límite va tras requireAuth porque cuenta por usuario, y es el mismo para las dos.
router.delete('/me', requireAuth, limiteConfirmarContrasena, deleteMe);
router.put('/me/password', requireAuth, limiteConfirmarContrasena, changePassword);
// Sin requireAuth: la prueba de identidad es la cookie de renovación (bloque 11).
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;