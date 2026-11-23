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
// plegado: lista de ejercicios oculta. tarjetaPlegada: la tarjeta entera, solo nombre y %.
const POR_DEFECTO = { rango: RANGO_POR_DEFECTO, plegado: false, tarjetaPlegada: false };

export const leerPreferencias = (grupoId) => {
  try {
    const guardadas = JSON.parse(localStorage.getItem(clave(grupoId)) ?? '{}');
    const rango = RANGOS.some((r) => r.valor === guardadas.rango) ? guardadas.rango : POR_DEFECTO.rango;
    return { rango, plegado: guardadas.plegado === true, tarjetaPlegada: guardadas.tarjetaPlegada === true };
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

// ---------------------------------------------------------------------------
// Orden de las tarjetas del Dashboard (también en este dispositivo). "Todos" usa el id
// 'todos'. Se guarda la lista de ids en el orden elegido.

export const ID_TODOS = 'todos';
const CLAVE_ORDEN = 'yieldfit_orden_grupos';

// Aplica el orden guardado a los grupos que existen hoy: primero los que estaban en el
// orden guardado (en ese orden), después los nuevos (en orden de creación). Los ids
// guardados de grupos que ya no existen se ignoran.
export const ordenarGrupos = (ids, ordenGuardado) => {
  const enOrden = ordenGuardado.filter((id) => ids.includes(id));
  const nuevos = ids.filter((id) => !enOrden.includes(id));
  return [...enOrden, ...nuevos];
};

export const leerOrden = () => {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_ORDEN) ?? '[]');
    return Array.isArray(guardado) ? guardado.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

export const guardarOrden = (orden) => {
  try {
    localStorage.setItem(CLAVE_ORDEN, JSON.stringify(orden));
  } catch {
    // Sin localStorage, el orden dura hasta recargar.
  }
};

