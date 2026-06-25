import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

// Middleware: protege rutas exigiendo un JWT válido en la cabecera Authorization
// Si el token es válido, adjunta el usuario a req.user y llama a next()
// Si no, responde 401 Unauthorized
export const requireAuth = async (req, res, next) => {
  try {
    // 1. Extraer el token de la cabecera Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token no proporcionado',
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verificar el token (firma y expiración)
    let payload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      // jwt.verify lanza diferentes errores según el caso
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'El token ha expirado',
        });
      }
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token inválido',
      });
    }

    // 3. Cargar el usuario desde la base de datos
    // Por seguridad: si el usuario fue borrado, no debe poder hacer peticiones aunque tenga token
    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Usuario no encontrado',
      });
    }

    // 4. Adjuntar el usuario a la petición y continuar
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};