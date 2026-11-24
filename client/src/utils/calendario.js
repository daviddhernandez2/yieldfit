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

// ---------------------------------------------------------------------------
// Vista anual (como el mapa de contribuciones de GitHub)

// Rango de un año natural: del 1 de enero (00:00 local) al 1 de enero siguiente, que no
// entra. Cabe en el límite de 366 días del servidor. Las dos vistas usan este rango: la
// mensual lee sus días del año ya pedido.
export const rangoDelAnio = (anio) => ({
  desde: new Date(anio, 0, 1).toISOString(),
  hasta: new Date(anio + 1, 0, 1).toISOString(),
});

// El año en columnas de semana (cada una de lunes a domingo, de arriba abajo). Los huecos
// antes del 1 de enero y después del 31 de diciembre son null.
export const rejillaDelAnio = (anio) => {
  const huecosAntes = (new Date(anio, 0, 1).getDay() + 6) % 7;
  const celdas = Array(huecosAntes).fill(null);
  for (let fecha = new Date(anio, 0, 1); fecha.getFullYear() === anio; fecha.setDate(fecha.getDate() + 1)) {
    celdas.push({ dia: claveDia(fecha), numero: fecha.getDate(), mes: fecha.getMonth() });
  }
  while (celdas.length % 7 !== 0) celdas.push(null);

  const semanas = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));
  return semanas;
};

// En qué columna empieza cada mes, para poner su nombre encima: [{ mes: 0, columna: 0 }, …].
export const inicioDeMeses = (semanas) =>
  semanas.flatMap((semana, columna) =>
    semana.filter((celda) => celda?.numero === 1).map((celda) => ({ mes: celda.mes, columna })),
  );

// Intensidad del color de un día según cuántas sesiones tiene: 0 (ninguna), 1 (una) o 2
// (dos o más). Con ~3 sesiones por semana, más niveles no aportarían nada.
export const nivelDeDia = (sesiones) => Math.min(sesiones, 2);

// ---------------------------------------------------------------------------
// Escritorio: cabecera y panel del día (bloque 8b)

// Número de semana ISO 8601 (la que se usa en España): las semanas empiezan en lunes y la
// semana 1 es la que contiene el primer jueves del año. Así el 1 de enero puede ser de la
// semana 52 o 53 del año anterior, y el 31 de diciembre de la semana 1 del siguiente.
export const semanaDelAnio = (fecha) => {
  const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7)); // el jueves de esa semana
  const primerJueves = new Date(d.getFullYear(), 0, 4);
  primerJueves.setDate(primerJueves.getDate() + 3 - ((primerJueves.getDay() + 6) % 7));
  return 1 + Math.round((d - primerJueves) / (7 * 24 * 60 * 60 * 1000));
};

// Resumen de un mes a partir de los días que da el servidor ({ "2026-11-03": [sesiones] }):
// cuántas sesiones, cuántos días distintos y cuánto tiempo en total (segundos).
// Devuelve null si no hay datos de ese mes (el año aún no se ha pedido).
export const resumenDelMes = (dias, anio, mes) => {
  if (!dias) return null;
  const prefijo = `${anio}-${dosCifras(mes + 1)}-`;
  let sesiones = 0;
  let diasEntrenados = 0;
  let segundos = 0;
  for (const [dia, lista] of Object.entries(dias)) {
    if (!dia.startsWith(prefijo)) continue;
    diasEntrenados += 1;
    sesiones += lista.length;
    segundos += lista.reduce((total, s) => total + (s.duracionSegundos ?? 0), 0);
  }
  return { sesiones, diasEntrenados, segundos };
};

