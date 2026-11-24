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
