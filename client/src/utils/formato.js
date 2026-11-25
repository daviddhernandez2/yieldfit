// Formato de cifras en español (coma decimal), compartido por las tarjetas de progreso y las
// métricas del Dashboard (bloque 9c). Funciones puras: prueba en formato.test.js.

// Número con un decimal y signo + si es positivo: 3.14 → "+3,1"; -2 → "-2"; 0 → "0".
export const formatConSigno = (n) => {
  const redondeado = Number(n.toFixed(1));
  const signo = redondeado > 0 ? '+' : '';
  return `${signo}${redondeado.toString().replace('.', ',')}`;
};

// Porcentaje con signo: 3.14 → "+3,1%".
export const formatPorcentaje = (n) => `${formatConSigno(n)}%`;

// Duración legible: 52 min · 1h 5 min. La misma que usa la lista del Historial.
export const formatDuracion = (segundos) => {
  const totalMin = Math.floor(segundos / 60);
  if (totalMin < 60) return `${totalMin} min`;
  const horas = Math.floor(totalMin / 60);
  const minutos = totalMin % 60;
  return `${horas}h ${minutos} min`;
};

// Hora local de una fecha: "18:30".
export const formatHora = (fecha) =>
  new Date(fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });


// Kilos con un decimal como mucho y coma: 103.33 → "103,3"; 110 → "110". Para el 1RM estimado
// de los récords (bloque 4b): más decimales no aportan nada en una estimación.
export const formatKg = (n) => n.toLocaleString('es-ES', { maximumFractionDigits: 1 });

// Fecha de una sesión respecto a hoy, en la hora del dispositivo: "hoy, 18:15", "ayer, 18:15",
// "lunes, 18:15" (en la última semana), "12 nov, 18:15" y, de otro año, "12 nov 2025, 18:15".
// `ahora` se pasa para poder probarlo con una fecha fija.
export const formatFechaRelativa = (fecha, ahora = new Date()) => {
  const d = new Date(fecha);
  const hora = formatHora(d);
  const inicioDia = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const dias = Math.round((inicioDia(ahora) - inicioDia(d)) / (24 * 60 * 60 * 1000));
  if (dias === 0) return `hoy, ${hora}`;
  if (dias === 1) return `ayer, ${hora}`;
  if (dias > 1 && dias < 7) return `${d.toLocaleDateString('es-ES', { weekday: 'long' })}, ${hora}`;
  const opciones = d.getFullYear() === ahora.getFullYear() ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' };
  return `${d.toLocaleDateString('es-ES', opciones)}, ${hora}`;
};

// Cronómetro (bloque 11d): "07:05" por debajo de una hora y "1:30:05" desde la hora, en vez de
// "90:05". Lo usan el cronómetro y el descanso de la sesión activa y la MiniSession.
export const formatCronometro = (segundos) => {
  const total = Math.max(0, Math.floor(segundos));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const dos = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${dos(m)}:${dos(s)}` : `${dos(m)}:${dos(s)}`;
};

// Cuánto hace de una fecha, en días (widget "Empezar rutina", bloque 9d): "hoy", "ayer",
// "hace 3 días", "hace 2 semanas", "hace 3 meses", "hace más de un año". Cuenta días de
// calendario en la hora del dispositivo. Sin fecha (nunca), "aún sin hacer".
// `ahora` se pasa para poder probarlo con una fecha fija.
export const formatHace = (fecha, ahora = new Date()) => {
  if (!fecha) return 'aún sin hacer';
  const d = new Date(fecha);
  const inicioDia = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const dias = Math.max(0, Math.round((inicioDia(ahora) - inicioDia(d)) / (24 * 60 * 60 * 1000)));
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 14) return `hace ${dias} días`;
  if (dias < 60) return `hace ${Math.floor(dias / 7)} semanas`;
  if (dias < 365) return `hace ${Math.floor(dias / 30)} meses`;
  return 'hace más de un año';
};
