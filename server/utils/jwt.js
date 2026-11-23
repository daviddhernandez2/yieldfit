import jwt from 'jsonwebtoken';

// Token de ACCESO: corto (15 minutos) y solo en la memoria del cliente (bloque 11,
// DECISIONS.md 0037). Si se filtrara, caduca enseguida; para seguir dentro, el cliente pide
// otro con el token de renovación (cookie httpOnly, utils/refreshToken.js).
// La duración es una decisión de diseño, no una configuración: por eso está aquí y no en
// una variable de entorno (antes JWT_EXPIRES_IN, 7 días).
export const DURACION_ACCESO = '15m';

// Solo en local, para probar la renovación sin esperar 15 minutos:
//   DURACION_ACCESO_PRUEBA=20s npm run dev
// Con NODE_ENV=production se ignora siempre, aunque esté definida (como RETRASO_PRUEBA_MS).
const duracionAcceso = () =>
  (process.env.NODE_ENV !== 'production' && process.env.DURACION_ACCESO_PRUEBA) || DURACION_ACCESO;

// Genera un JWT firmado con el secret de la app. El payload incluye solo el userId; no
// metemos datos sensibles.
export const signToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = duracionAcceso();

  if (!secret) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }

  return jwt.sign({ userId }, secret, { expiresIn });
};

// Verifica un JWT y devuelve su payload decodificado
// Lanza un error si el token es inválido, ha expirado o tiene firma incorrecta
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }

  return jwt.verify(token, secret);
};