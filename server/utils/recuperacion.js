import { createHash, randomBytes } from 'node:crypto';
import PasswordReset from '../models/PasswordReset.js';

// Enlaces de recuperación de contraseña (bloque 11b).

export const DURACION_RECUPERACION_MS = 30 * 60 * 1000; // 30 minutos (decisión de David)

const huella = (token) => createHash('sha256').update(token).digest('hex');

// Crea un enlace nuevo para el usuario y devuelve el token en claro (va solo en el email).
// Antes borra los que tuviera sin usar: si pide otro enlace, el anterior deja de valer, y
// nunca hay más de uno vivo por usuario.
// 256 bits aleatorios: imposible de adivinar, aunque se probaran millones por segundo.
export const emitirRecuperacion = async (userId) => {
  await PasswordReset.deleteMany({ userId, usadoEn: null });
  const token = randomBytes(32).toString('base64url');
  await PasswordReset.create({
    userId,
    hash: huella(token),
    expiresAt: new Date(Date.now() + DURACION_RECUPERACION_MS),
  });
  return token;
};

// Gasta un enlace: lo marca como usado y devuelve su documento (con userId), o null si no
// vale (no existe, ya se usó o ha caducado). Atómico: si llegan dos peticiones con el mismo
// enlace, solo una lo encuentra sin usar. Va dentro de la transacción del cambio de
// contraseña: si el cambio falla, el enlace vuelve a estar sin usar.
export const gastarRecuperacion = async (token, session) => {
  if (typeof token !== 'string' || !token) return null;
  const ahora = new Date();
  return PasswordReset.findOneAndUpdate(
    { hash: huella(token), usadoEn: null, expiresAt: { $gt: ahora } },
    { $set: { usadoEn: ahora } },
    { session }
  );
};
