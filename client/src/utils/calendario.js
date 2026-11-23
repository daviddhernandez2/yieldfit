// Funciones puras del calendario de días entrenados (bloque 8, DECISIONS.md 0033).
// Sin librerías: la rejilla de un mes son unas pocas líneas. Todo en hora LOCAL del
// dispositivo, que es la misma zona que se envía al servidor para agrupar las sesiones.
// Pruebas: node src/utils/calendario.test.js (desde /client).

const dosCifras = (n) => String(n).padStart(2, '0');

// "2026-11-03" para una fecha, en hora local. Es la misma forma que devuelve el servidor
// en `dia`, así que sirve para buscar si un día está entrenado.
export const claveDia = (fecha) =>
  `${fecha.getFullYear()}-${dosCifras(fecha.getMonth() + 1)}-${dosCifras(fecha.getDate())}`;

// Rejilla de un mes (mes: 0 = enero), en semanas de lunes a domingo, como un calendario
// español. Los huecos antes del día 1 y después del último son null.
//   rejillaDelMes(2026, 10) → [[null, null, null, null, null, null, {dia:'2026-11-01', numero:1}], ...]
export const rejillaDelMes = (anio, mes) => {
  const diasDelMes = new Date(anio, mes + 1, 0).getDate(); // día 0 del mes siguiente = último de este
  // getDay(): 0 = domingo. Se pasa a 0 = lunes.
  const huecosAntes = (new Date(anio, mes, 1).getDay() + 6) % 7;

  const celdas = Array(huecosAntes).fill(null);
  for (let numero = 1; numero <= diasDelMes; numero++) {
    celdas.push({ dia: claveDia(new Date(anio, mes, numero)), numero });
  }
  while (celdas.length % 7 !== 0) celdas.push(null);

  const semanas = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));
  return semanas;
};

// Rango para pedir los días de un mes al servidor: del día 1 a las 00:00 (hora local) al
// día 1 del mes siguiente, que no entra. toISOString lo pasa a UTC con el desfase correcto
// (también en los meses con cambio de hora).
export const rangoDelMes = (anio, mes) => ({
  desde: new Date(anio, mes, 1).toISOString(),
  hasta: new Date(anio, mes + 1, 1).toISOString(),
});

// "noviembre de 2026" (es-ES lo escribe así).
export const nombreDelMes = (anio, mes) =>
  new Date(anio, mes, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

// El mes anterior o siguiente: { anio, mes } con el cambio de año resuelto.
export const moverMes = ({ anio, mes }, paso) => {
  const fecha = new Date(anio, mes + paso, 1);
  return { anio: fecha.getFullYear(), mes: fecha.getMonth() };
};
