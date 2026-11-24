// Rangos del progreso de los grupos del Dashboard (bloque 9, DECISIONS.md 0034).
//
// Desde el bloque 9d (0052) la lista de rangos (1S … Total) la da el servidor
// (GET /api/dashboard/catalogo) y el rango elegido se guarda en el widget, en el servidor. Aquí
// solo queda traducir un rango a la fecha desde la que se pide el progreso: depende del reloj
// del dispositivo, así que se calcula en el cliente.

// Fecha de inicio de un rango (ISO), o undefined para "Total" (o un valor desconocido: todo el
// historial). `ahora` se pasa para poder probarlo con una fecha fija.
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

// Hasta el 9d, cada dispositivo guardaba el rango, el plegado y el orden de los grupos en
// localStorage ("yieldfit_grupo_<id>" y "yieldfit_orden_grupos"). Ya no se usan: se borran para
// no dejar basura. Se puede llamar siempre; si no hay nada (o no hay localStorage), no hace nada.
export const limpiarPreferenciasAntiguas = () => {
  try {
    const claves = [];
    for (let i = 0; i < localStorage.length; i++) {
      const clave = localStorage.key(i);
      if (clave === 'yieldfit_orden_grupos' || clave?.startsWith('yieldfit_grupo_')) claves.push(clave);
    }
    claves.forEach((clave) => localStorage.removeItem(clave));
  } catch {
    // Sin localStorage (modo privado): no hay nada que limpiar.
  }
};
