import { createHash, randomBytes, randomUUID } from 'node:crypto';
import RefreshToken from '../models/RefreshToken.js';

// Emisión, rotación y revocación de tokens de renovación (bloque 11, DECISIONS.md 0037).

export const DURACION_RENOVACION_MS = 30 * 24 * 60 * 60 * 1000; // 30 días
// Margen para dos renovaciones casi a la vez (p. ej. dos pestañas abiertas al volver a la
// app): las dos usan el mismo token; la segunda llega cuando la primera ya lo ha gastado.
// Dentro de este margen se acepta; fuera, se trata como un token copiado.
export const GRACIA_MS = 30 * 1000;

const huella = (token) => createHash('sha256').update(token).digest('hex');

// Crea un token nuevo y guarda su huella. Devuelve el token en claro, que solo viaja en la
// cookie: en la base nunca está. `familia` nueva en cada inicio de sesión; la misma al rotar.
export const emitirRenovacion = async (userId, familia = randomUUID()) => {
  const token = randomBytes(32).toString('base64url');
  await RefreshToken.create({
    userId,
    hash: huella(token),
    familia,
    expiresAt: new Date(Date.now() + DURACION_RENOVACION_MS),
  });
  return token;
};

// Gasta un token y devuelve { userId, token } con el siguiente de su familia (rotación: cada
// token sirve una sola vez). Devuelve null si no vale: no existe, ha caducado, o es uno ya
// gastado fuera del margen de gracia; en este último caso, además, borra la familia entera.
export const rotarRenovacion = async (token) => {
  if (!token) return null;
  const ahora = new Date();

  // Marcar como usado de forma atómica: si llegan dos renovaciones a la vez, solo una
  // encuentra usadoEn a null; la otra va por el camino de "ya usado".
  const doc = await RefreshToken.findOneAndUpdate(
    { hash: huella(token), usadoEn: null, expiresAt: { $gt: ahora } },
    { $set: { usadoEn: ahora } },
    { new: false }
  );
  if (doc) {
    return { userId: doc.userId, token: await emitirRenovacion(doc.userId, doc.familia) };
  }

  const gastado = await RefreshToken.findOne({ hash: huella(token) });
  if (!gastado || gastado.expiresAt <= ahora) return null;
  if (gastado.usadoEn && ahora - gastado.usadoEn <= GRACIA_MS) {
    // Renovación casi simultánea: vale, con un token nuevo de la misma familia.
    return { userId: gastado.userId, token: await emitirRenovacion(gastado.userId, gastado.familia) };
  }
  // Un token gastado hace rato vuelve a aparecer: alguien lo ha copiado. Se cierra esa
  // sesión entera (todos los tokens de la familia); el usuario tendrá que volver a entrar.
  await RefreshToken.deleteMany({ familia: gastado.familia });
  return null;
};

// Cerrar sesión en este dispositivo: borra la familia del token (los demás dispositivos del
// usuario tienen otras familias y siguen dentro).
export const revocarRenovacion = async (token) => {
  if (!token) return;
  const doc = await RefreshToken.findOne({ hash: huella(token) }, { familia: 1 });
  if (doc) await RefreshToken.deleteMany({ familia: doc.familia });
};
