// Rangos y preferencias de los grupos de progreso del Dashboard (bloque 9, DECISIONS.md 0034).

// Rangos del selector. El % se mide desde el primer punto del rango (lo calcula el
// servidor); aquí solo se decide desde qué fecha se pide. "Total" no pone límite.
export const RANGOS = [
  { valor: '1S', etiqueta: '1S', titulo: '1 semana' },
  { valor: '1M', etiqueta: '1M', titulo: '1 mes' },
  { valor: '1A', etiqueta: '1A', titulo: '1 año' },
  { valor: '5A', etiqueta: '5A', titulo: '5 años' },
  { valor: '10A', etiqueta: '10A', titulo: '10 años' },
  { valor: 'TOTAL', etiqueta: 'Total', titulo: 'todo el historial' },
];

export const RANGO_POR_DEFECTO = 'TOTAL';

// Fecha de inicio de un rango (ISO), o undefined para "Total". `ahora` se pasa para
// poder probarlo con una fecha fija.
export const desdeDeRango = (valor, ahora = new Date()) => {
  const fecha = new Date(ahora);
  switch (valor) {
    case '1S':
      fecha.setDate(fecha.getDate() - 7);
      break;
    case '1M':
      fecha.setMonth(fecha.getMonth() - 1);
      break;
    case '1A':
      fecha.setFullYear(fecha.getFullYear() - 1);
      break;
    case '5A':
      fecha.setFullYear(fecha.getFullYear() - 5);
      break;
    case '10A':
      fecha.setFullYear(fecha.getFullYear() - 10);
      break;
    default:
      return undefined; // TOTAL
  }
  return fecha.toISOString();
};

// Preferencias de cada grupo en ESTE dispositivo: el rango elegido y si la lista de
// ejercicios está plegada. Van en localStorage (decisión de David): no tocan el modelo y
// "Todos" no es un Chart. Si algún día se sincronizan entre dispositivos (bloque 12), irán
// al servidor. Cualquier fallo de localStorage (modo privado, lleno) se ignora: se usan
// los valores por defecto.
const clave = (grupoId) => `yieldfit_grupo_${grupoId ?? 'todos'}`;
const POR_DEFECTO = { rango: RANGO_POR_DEFECTO, plegado: false };

export const leerPreferencias = (grupoId) => {
  try {
    const guardadas = JSON.parse(localStorage.getItem(clave(grupoId)) ?? '{}');
    const rango = RANGOS.some((r) => r.valor === guardadas.rango) ? guardadas.rango : POR_DEFECTO.rango;
    return { rango, plegado: guardadas.plegado === true };
  } catch {
    return { ...POR_DEFECTO };
  }
};

export const guardarPreferencias = (grupoId, preferencias) => {
  try {
    localStorage.setItem(clave(grupoId), JSON.stringify(preferencias));
  } catch {
    // Sin localStorage, la preferencia dura hasta recargar. No pasa nada.
  }
};
