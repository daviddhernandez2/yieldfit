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
