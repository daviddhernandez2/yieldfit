import { rateLimit } from 'express-rate-limit';

// Límite de intentos en el login y el registro (bloque 11, DECISIONS.md 0035).
// Sin límite, cualquiera podía probar contraseñas contra una cuenta sin parar.
//
// Los contadores viven en la memoria del servidor: un reinicio de Render los pone a cero.
// Con una sola instancia es suficiente; con varias habría que llevarlos a una base
// compartida (p. ej. Redis).

const QUINCE_MINUTOS = 15 * 60 * 1000;
const UNA_HORA = 60 * 60 * 1000;

// Respuesta común: 429 con el mismo formato de error que el resto de la API y los minutos
// que faltan, que el formulario muestra tal cual.
const responder = (req, res, next, opciones) => {
  const minutos = Math.ceil((req.rateLimit.resetTime - Date.now()) / 60000);
  res.status(opciones.statusCode).json({
    error: 'Too Many Requests',
    message: `${opciones.message} Vuelve a intentarlo en ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}.`,
  });
};

// Login: 5 intentos FALLIDOS cada 15 minutos por IP y email. Los correctos no cuentan
// (skipSuccessfulRequests), así que un usuario que se equivoca una vez no se bloquea.
// La clave junta IP y email: frena a quien prueba contraseñas desde una conexión, sin que
// esa persona pueda bloquear con sus fallos a otros usuarios que entran desde otra IP.
// Límite conocido: un ataque repartido entre muchas IP no se frena así (haría falta un
// bloqueo por cuenta, con su propio riesgo de que un tercero bloquee la tuya).
export const limiteLogin = rateLimit({
  windowMs: QUINCE_MINUTOS,
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${req.ip}|${String(req.body?.email ?? '').toLowerCase().trim()}`,
  message: 'Demasiados intentos de inicio de sesión.',
  handler: responder,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Registro: 5 cuentas por hora y por IP. Frena la creación masiva de cuentas (cada una
// clona 58 ejercicios en la base) sin molestar a una persona que se registra.
export const limiteRegistro = rateLimit({
  windowMs: UNA_HORA,
  limit: 5,
  message: 'Demasiados registros desde esta conexión.',
  handler: responder,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Reportes de fallos (bloque 11b): 5 por hora y por USUARIO, no por IP (va después de
// requireAuth). Suficiente para contar varios fallos seguidos; frena a quien quiera llenar
// la bandeja. Los envíos rechazados por datos no válidos (400) no cuentan.
export const limiteReportes = rateLimit({
  windowMs: UNA_HORA,
  limit: 5,
  skipFailedRequests: true,
  keyGenerator: (req) => String(req.user._id),
  message: 'Has enviado muchos reportes seguidos.',
  handler: responder,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Rutas que vuelven a pedir la contraseña con la sesión ya abierta (bloque 11b): borrar la
// cuenta y cambiar la contraseña. Sin límite, quien encontrara una sesión abierta podría
// probar contraseñas aquí sin parar. 5 fallos cada 15 minutos por usuario, como el login; un
// acierto no cuenta. El contador es COMPARTIDO entre las dos rutas: las dos adivinan la misma
// contraseña, así que no deben sumar 5 + 5 intentos.
export const limiteConfirmarContrasena = rateLimit({
  windowMs: QUINCE_MINUTOS,
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => String(req.user._id),
  message: 'Demasiados intentos con una contraseña incorrecta.',
  handler: responder,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
