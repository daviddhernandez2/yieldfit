import express from 'express';
import {
  register,
  login,
  me,
  refresh,
  logout,
  deleteMe,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import {
  limiteConfirmarContrasena,
  limiteLogin,
  limiteRecuperacionEmail,
  limiteRecuperacionIp,
  limiteRegistro,
  limiteRestablecer,
} from '../middlewares/limiteIntentos.js';

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
// Recuperar la contraseña por email (bloque 11b). Públicas: quien la ha olvidado no tiene
// sesión. Primero el límite por IP, después el de email.
router.post('/forgot-password', limiteRecuperacionIp, limiteRecuperacionEmail, forgotPassword);
router.post('/reset-password', limiteRestablecer, resetPassword);

export default router;