// Una sola operación pesada a la vez en todo el servidor (bloque 7b, decisión de David): importar
// o deshacer una importación, de cualquier usuario. Cada una puede usar unos 200 MB de memoria y
// Render free tiene 512 MB: dos a la vez podrían tumbar el servidor para todos. La siguiente
// recibe un 503 y vuelve a probar en un minuto.
//
// Es un indicador en la memoria del proceso: vale porque Render tiene UNA instancia. Con varias,
// cada una tendría el suyo y habría que llevarlo a algo compartido (p. ej. un documento en
// MongoDB con caducidad), como los contadores de limiteIntentos.js.

let ocupado = false;

// Intenta ocupar el turno. Devuelve la función que lo libera, o null si ya hay una en curso.
// Quien lo ocupa lo libera SIEMPRE en un finally; liberar dos veces no hace nada, para que un
// finally de más no pueda soltar el turno de la operación siguiente.
export const ocupar = () => {
  if (ocupado) return null;
  ocupado = true;
  let liberado = false;
  return () => {
    if (liberado) return;
    liberado = true;
    ocupado = false;
  };
};

export const MENSAJE_OCUPADO = 'Hay otra importación en curso, prueba en un minuto';

// Respuesta cuando el turno está ocupado: 503 con Retry-After (en segundos), que es lo estándar
// para "ahora no, vuelve luego".
export const responderOcupado = (res) =>
  res.status(503).set('Retry-After', '60').json({ error: 'Service Unavailable', message: MENSAJE_OCUPADO });
