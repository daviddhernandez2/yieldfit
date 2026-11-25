// Modo edición del Dashboard (bloque 9d, paso 3c, tarjeta "Editar dashboard" del design system).
// Funciones puras sobre el BORRADOR: la lista de widgets que se edita y que "Hecho" guarda de una
// vez con PUT /api/dashboard. Sin React: se prueban con node src/utils/edicionDashboard.test.js.
//
// Las reglas que importan de verdad (tamaños permitidos, referencias del usuario, como mucho
// maxWidgets) las vuelve a comprobar el servidor al guardar: aquí solo se evita ofrecer lo que
// él rechazaría.

import { moverElemento } from './orden.js';

// Los widgets nuevos aún no tienen _id (lo pone el servidor al guardar). Mientras se edita
// llevan uno provisional con este prefijo, para que React y el arrastre los distingan; se quita
// al guardar (paraGuardar).
const PREFIJO_NUEVO = 'nuevo-';

// Copia de los widgets para editarlos: sin `filas` (un grupo desplegado solo se ve así al mirar).
export const empezarBorrador = (widgets) => widgets.map(({ filas: _filas, ...w }) => ({ ...w }));

export const quitarWidget = (borrador, id) => borrador.filter((w) => w._id !== id);

export const cambiarTamano = (borrador, id, tamano) => borrador.map((w) => (w._id === id ? { ...w, tamano } : w));

// Mover el widget `idDesde` al sitio de `idHasta` (los demás se desplazan, como en una lista).
export const moverWidget = (borrador, idDesde, idHasta) =>
  moverElemento(
    borrador,
    borrador.findIndex((w) => w._id === idDesde),
    borrador.findIndex((w) => w._id === idHasta)
  );

// Un widget nuevo del catálogo, en su tamaño por defecto. `referencia`: el id del grupo, el
// ejercicio o la rutina, si el tipo lo necesita (camposReferencia dice en qué campo va: viene
// del servidor con el catálogo). `idNuevo`: lo genera quien llama (crypto.randomUUID), para que
// esta función sea pura.
export const nuevoWidget = (def, referencia, camposReferencia, idNuevo) => {
  const widget = { _id: `${PREFIJO_NUEVO}${idNuevo}`, tipo: def.tipo, tamano: def.tamanoPorDefecto };
  if (def.necesita) widget[camposReferencia[def.necesita]] = referencia;
  return widget;
};

// Inserta `widget` en la posición `indice` (al final si no se indica).
export const insertarWidget = (borrador, widget, indice = borrador.length) => {
  const copia = [...borrador];
  copia.splice(Math.max(0, Math.min(indice, copia.length)), 0, widget);
  return copia;
};

// Dónde insertar un widget para que ocupe un hueco libre: delante del primer widget que la
// retícula coloca después del hueco (de izquierda a derecha y de arriba abajo). Como la
// colocación no vuelve atrás (utils/reticula.js), así el nuevo cae en el hueco si cabe.
// colocados: lo que devuelve colocarWidgets, en el orden del borrador.
export const indiceParaHueco = (colocados, hueco) => {
  const despues = colocados.findIndex(
    (c) => c.fila > hueco.fila || (c.fila === hueco.fila && c.columna > hueco.columna)
  );
  return despues === -1 ? colocados.length : despues;
};

// Tipos que ya están y no se pueden repetir: los que no apuntan a nada (Racha, Progreso total…)
// van una sola vez (decisión de David). Los que eligen algo (un grupo, un ejercicio, una
// rutina) se pueden repetir con otra referencia.
export const tiposYaPuestos = (borrador, catalogo) => {
  const sinReferencia = new Set(catalogo.filter((d) => !d.necesita).map((d) => d.tipo));
  return new Set(borrador.map((w) => w.tipo).filter((t) => sinReferencia.has(t)));
};

// Grupos que ya están en el borrador: el servidor no deja poner el mismo grupo dos veces.
export const gruposYaPuestos = (borrador) => new Set(borrador.filter((w) => w.tipo === 'grupo').map((w) => w.chartId));

// Lo que se envía al guardar: sin los _id provisionales de los nuevos.
export const paraGuardar = (borrador) =>
  borrador.map(({ _id, ...w }) => (String(_id).startsWith(PREFIJO_NUEVO) ? w : { _id, ...w }));
