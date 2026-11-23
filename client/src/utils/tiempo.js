// Formatos de duración para mostrar el descanso (bloque 9b). Por dentro se guardan siempre
// segundos (descansoSegundos); esto es solo cómo se enseñan.

// 90 → "1:30"; 45 → "0:45"; 0 → "0:00".
export const minutosYSegundos = (segundos) =>
  `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;

// Para lectores de pantalla: 90 → "1 minuto 30 segundos"; 0 → "sin descanso".
export const duracionHablada = (segundos) => {
  if (segundos === 0) return 'sin descanso';
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  const partes = [];
  if (minutos) partes.push(`${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`);
  if (resto) partes.push(`${resto} ${resto === 1 ? 'segundo' : 'segundos'}`);
  return partes.join(' ');
};
