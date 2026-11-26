// ¿Es una zona horaria IANA válida ("Europe/Madrid")? Intl lanza un error si no.
// La usan el calendario (GET /api/sessions/days) y la actividad del Dashboard
// (GET /api/estadisticas/actividad): las fechas se guardan en UTC y el servidor está en
// Frankfurt, así que los días y las semanas se calculan en la zona que envía el cliente.
export const zonaValida = (zona) => {
  try {
    new Intl.DateTimeFormat('es-ES', { timeZone: zona });
    return true;
  } catch {
    return false;
  }
};

// Una fecha y hora "de reloj" sin zona ("2026-05-16 13:26:22", como las exporta Strong) vista en
// la zona `zona` → el instante en UTC (bloque 7b). Tiene en cuenta el cambio de hora: en Madrid,
// las 13:26 de mayo son las 11:26 UTC y las de enero, las 12:26. Sin librerías: usa Intl para
// saber qué hora marca el reloj de la zona. `zona` tiene que venir validada con zonaValida.
//
// Devuelve { fecha, ajuste }, o null si el texto no es una fecha real. `ajuste` dice si la hora
// cae en un cambio de hora (decisión de David):
//   - 'inexistente': el último domingo de marzo, en Madrid, el reloj salta de las 02:00 a las 03:00,
//     así que las 02:30 no existen. Se mueve a la hora siguiente válida (03:30) y quien la usa avisa.
//   - 'doble': el último domingo de octubre el reloj vuelve de las 03:00 a las 02:00, así que las
//     02:30 pasan dos veces. Se toma la primera (todavía en horario de verano).
//   - null: el caso normal.
export const fechaLocalAUtc = (texto, zona) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(texto).trim());
  if (!m) return null;
  const [, a, mes, d, h, min, s = '0'] = m;
  const relojComoUtc = Date.UTC(+a, +mes - 1, +d, +h, +min, +s);
  // Date.UTC no protesta con fechas imposibles: el 31 de febrero lo pasa al 3 de marzo. Si al
  // volver a leerla no da el mismo día y hora, el texto no era una fecha real.
  const leida = new Date(relojComoUtc);
  if (
    leida.getUTCFullYear() !== +a || leida.getUTCMonth() !== +mes - 1 || leida.getUTCDate() !== +d ||
    leida.getUTCHours() !== +h || leida.getUTCMinutes() !== +min || leida.getUTCSeconds() !== +s
  ) {
    return null;
  }
  // Cuánto adelanta el reloj de la zona respecto a UTC en un instante dado (en Madrid, una o dos
  // horas según la época del año).
  const formato = new Intl.DateTimeFormat('en-US', {
    timeZone: zona, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const desfase = (instante) => {
    const p = Object.fromEntries(formato.formatToParts(new Date(instante)).map((x) => [x.type, x.value]));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - instante;
  };
  // Los desfases posibles ese día: el de un día antes y el de un día después (un cambio de hora
  // queda entre los dos; sin cambio, son el mismo). Cada desfase da un instante candidato, y vale
  // si en ese instante el reloj de la zona marca de verdad la hora pedida.
  const DIA = 24 * 60 * 60 * 1000;
  const antes = desfase(relojComoUtc - DIA);
  const despues = desfase(relojComoUtc + DIA);
  const validos = [...new Set([antes, despues])]
    .map((o) => relojComoUtc - o)
    .filter((instante) => instante + desfase(instante) === relojComoUtc)
    .sort((x, y) => x - y);
  // Uno: el caso normal. Dos: la hora pasa dos veces y se toma la primera.
  if (validos.length >= 1) return { fecha: new Date(validos[0]), ajuste: validos.length > 1 ? 'doble' : null };
  // Ninguno: la hora no existe. Con el desfase de antes del salto se llega a la misma distancia
  // pasado el salto: las 02:30 inexistentes quedan en las 03:30.
  return { fecha: new Date(relojComoUtc - antes), ajuste: 'inexistente' };
};
