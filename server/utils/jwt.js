import jwt from 'jsonwebtoken';

// Genera un JWT firmado con el secret de la app y la duración configurada en .env
// El payload incluye solo el userId; no metemos datos sensibles
export const signToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

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