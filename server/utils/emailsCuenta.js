// Textos de los emails de la cuenta (bloque 11b). Funciones puras: reciben los datos y
// devuelven { asunto, texto }; quien envía es utils/email.js.
// Tono llano, en español y sin nada que parezca publicidad: ayuda a no caer en spam.

// Email con el enlace para poner una contraseña nueva.
export const emailRecuperacion = ({ nombre, enlace, minutos }) => ({
  asunto: 'Restablece tu contraseña de Yield Fit',
  texto: [
    `Hola, ${nombre}:`,
    '',
    'Has pedido restablecer tu contraseña de Yield Fit. Abre este enlace para elegir una nueva:',
    '',
    enlace,
    '',
    `El enlace caduca en ${minutos} minutos y solo sirve una vez.`,
    '',
    'Si no lo has pedido tú, ignora este mensaje: tu contraseña no cambia.',
    '',
    'Yield Fit',
  ].join('\n'),
});

// Aviso de que la contraseña ha cambiado: al restablecerla con el enlace y al cambiarla en
// Perfil (decisión de David). Si no fue el usuario, así se entera.
// La hora va en la de España: la beta es para conocidos de aquí. Si algún día no lo es, el
// cliente tendría que mandar su zona horaria, como hace el calendario.
export const emailContrasenaCambiada = ({ nombre, fecha, urlRecuperar }) => ({
  asunto: 'Tu contraseña de Yield Fit ha cambiado',
  texto: [
    `Hola, ${nombre}:`,
    '',
    `La contraseña de tu cuenta de Yield Fit se cambió el ${fecha.toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
      dateStyle: 'long',
      timeStyle: 'short',
    })} (hora de España). Se ha cerrado la sesión en tus otros dispositivos.`,
    '',
    'Si has sido tú, no tienes que hacer nada.',
    '',
    `Si no has sido tú, alguien conoce tu contraseña: restablécela ahora desde ${urlRecuperar}`,
    '',
    'Yield Fit',
  ].join('\n'),
});
