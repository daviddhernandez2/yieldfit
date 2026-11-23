// Envío de emails con Resend (bloque 11b): recuperar la contraseña y avisar de que ha cambiado.
//
// Con fetch, sin la librería de Resend: Node 20 ya trae fetch y es una sola petición POST,
// así que no hace falta otra dependencia que mantener.
//
// MODO CONSOLA: si no hay RESEND_API_KEY (en local), no se envía nada: el email se escribe
// en la consola del servidor, con su enlace, para seguir el flujo sin mandar emails reales.
// En producción ese modo no existe: sin clave el servidor no arranca (comprobarConfigEmail).

const API_RESEND = 'https://api.resend.com/emails';
const TIEMPO_MAXIMO_MS = 10_000; // si Resend no responde en 10 s, se da por fallido

// Se llama al arrancar (app.js). Sin valores por defecto a propósito, como CLIENT_ORIGINS:
// es mejor no arrancar y ver el motivo en los logs que arrancar "bien" y que la recuperación
// de contraseña falle sin que nadie se entere.
//   - APP_URL siempre: es la base del enlace del email (en local, http://localhost:5173).
//   - En producción, además, la clave de Resend y el remitente.
export const comprobarConfigEmail = () => {
  const obligatorias = ['APP_URL'];
  if (process.env.NODE_ENV === 'production') obligatorias.push('RESEND_API_KEY', 'EMAIL_REMITENTE');
  for (const nombre of obligatorias) {
    if (!process.env[nombre]) throw new Error(`${nombre} no está definida en las variables de entorno`);
  }
};

const modoConsola = () => !process.env.RESEND_API_KEY;

// Envía un email de solo texto. Sin HTML a propósito: se lee bien en cualquier cliente, el
// enlace se puede pulsar igual y sin HTML no hay imágenes ni píxeles de seguimiento.
// Lanza un error si Resend lo rechaza; quien llama decide qué hacer (normalmente, anotarlo).
export const enviarEmail = async ({ para, asunto, texto }) => {
  if (modoConsola()) {
    console.log(
      [
        '',
        '──────── EMAIL (modo consola: no se envía) ────────',
        `Para:   ${para}`,
        `Asunto: ${asunto}`,
        '',
        texto,
        '───────────────────────────────────────────────────',
        '',
      ].join('\n')
    );
    return;
  }

  const respuesta = await fetch(API_RESEND, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      // Resend rechaza con 403 las peticiones sin User-Agent (su documentación lo exige).
      'User-Agent': 'yieldfit-server/1.0',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_REMITENTE,
      to: [para],
      subject: asunto,
      text: texto,
    }),
    signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
  });

  if (!respuesta.ok) {
    // Solo el código y el mensaje de Resend: nunca la clave ni el contenido del email.
    const cuerpo = await respuesta.json().catch(() => ({}));
    throw new Error(`Resend respondió ${respuesta.status}: ${cuerpo.message ?? 'sin mensaje'}`);
  }
};
