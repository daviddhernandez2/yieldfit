// Actividad del Dashboard (bloque 9d, paso 4): sesiones por semana (Frecuencia semanal y los
// círculos de la Racha) y la racha de semanas seguidas (Racha).
// Pura: recibe las sesiones y la zona horaria y no toca la base de datos (pruebas en
// actividad.test.js).
//
// Las semanas empiezan en lunes (ISO) y los días son los de la zona del usuario: una sesión del
// domingo a las 23:30 en Madrid es del domingo, aunque en UTC ya sea lunes.

// Semanas hacia atrás que se miran para la racha (2 años). Más allá se dice "más de 104": así
// la consulta no crece con el historial.
export const MAX_SEMANAS_RACHA = 104;

// Semanas que se devuelven, de la más antigua a la actual. La fila de la Racha muestra las que
// caben en su ancho (hasta unas 32 a 1024 px); Frecuencia semanal usa las 12 últimas.
export const SEMANAS_HISTORIAL = 32;

// 'YYYY-MM-DD' de una fecha en una zona horaria (en-CA da justo ese formato).
const formatos = new Map();
export const diaLocal = (fecha, zona) => {
  if (!formatos.has(zona)) {
    formatos.set(zona, new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }));
  }
  return formatos.get(zona).format(fecha);
};

// Suma días a un día de calendario 'YYYY-MM-DD' (en UTC, así no hay cambios de hora por medio).
const sumarDias = (dia, n) => {
  const d = new Date(`${dia}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// Lunes de la semana de un día 'YYYY-MM-DD'.
export const lunesDe = (dia) => {
  const dow = (new Date(`${dia}T00:00:00Z`).getUTCDay() + 6) % 7; // lunes = 0
  return sumarDias(dia, -dow);
};

// sesiones: [{ fecha, duracionSegundos }] (al menos las de los últimos MAX_SEMANAS_RACHA + 1
// semanas). Devuelve:
//   - semanas: las últimas `numSemanas` (SEMANAS_HISTORIAL), de la más antigua a la actual:
//     [{ inicio, sesiones, segundos }].
//   - racha: { semanas, masDe, estado } con las semanas seguidas con al menos una sesión,
//     contando desde la actual. La semana en curso no rompe la racha mientras no termina: si aún
//     no tiene sesiones, se empieza a contar por la anterior. masDe: se llegó al tope que se mira.
//     estado (el símbolo de la llama, bloque 9d):
//       - 'activa': ya se ha entrenado esta semana.
//       - 'enRiesgo': la racha sigue, pero esta semana aún no se ha entrenado.
//       - 'rota': una semana completa sin entrenar (o aún sin racha).
export const calcularActividad = (sesiones, zona, ahora = new Date(), numSemanas = SEMANAS_HISTORIAL) => {
  const porSemana = new Map();
  for (const s of sesiones) {
    const dia = diaLocal(new Date(s.fecha), zona);
    const lunes = lunesDe(dia);
    const semana = porSemana.get(lunes) ?? { sesiones: 0, segundos: 0 };
    semana.sesiones += 1;
    semana.segundos += s.duracionSegundos ?? 0;
    porSemana.set(lunes, semana);
  }

  const hoy = diaLocal(ahora, zona);
  const lunesActual = lunesDe(hoy);

  const semanas = [];
  for (let i = numSemanas - 1; i >= 0; i--) {
    const inicio = sumarDias(lunesActual, -7 * i);
    semanas.push({ inicio, ...(porSemana.get(inicio) ?? { sesiones: 0, segundos: 0 }) });
  }

  let lunes = porSemana.has(lunesActual) ? lunesActual : sumarDias(lunesActual, -7);
  let racha = 0;
  while (porSemana.has(lunes) && racha < MAX_SEMANAS_RACHA) {
    racha++;
    lunes = sumarDias(lunes, -7);
  }

  const estado = porSemana.has(lunesActual) ? 'activa' : racha > 0 ? 'enRiesgo' : 'rota';
  return {
    semanas,
    racha: { semanas: racha, masDe: racha === MAX_SEMANAS_RACHA, estado },
  };
};
