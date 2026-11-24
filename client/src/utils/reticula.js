// Colocación de los widgets del Dashboard en la retícula (bloque 9d, DECISIONS 0052).
//
// Hace lo mismo que la colocación automática del navegador SIN `dense`: cada widget, en orden,
// en el primer sitio libre a partir del anterior (de izquierda a derecha y de arriba abajo),
// sin volver atrás. Se calcula aquí, y no se deja al navegador, para saber dónde quedan los
// huecos: el modo edición los marca ("Hueco libre"). El Dashboard pinta cada widget con su fila
// y columna explícitas, así que lo que se ve es exactamente esto.
//
// Tamaños: P = 1×1, M = 2×1, G = 2×2. Con menos columnas que el ancho del widget (no ocurre con
// 2 y 4), ocupa todas.

export const DIMENSIONES = { P: { ancho: 1, alto: 1 }, M: { ancho: 2, alto: 1 }, G: { ancho: 2, alto: 2 } };

// widgets: [{ tamano, filas?, ... }] en orden. columnas: 2 o 4. `filas` sustituye al alto del
// tamaño (un grupo desplegado ocupa más filas que su G); no se guarda, es solo para mirar.
// Devuelve { colocados: [{ widget, fila, columna, ancho, alto }], huecos: [{ fila, columna }], filas }
// con filas y columnas desde 1 (como grid-row y grid-column en CSS). Los huecos incluyen las
// celdas vacías al final de la última fila.
export const colocarWidgets = (widgets, columnas) => {
  const ocupado = new Set();
  const libre = (fila, columna, ancho, alto) => {
    for (let f = fila; f < fila + alto; f++) {
      for (let c = columna; c < columna + ancho; c++) if (ocupado.has(`${f},${c}`)) return false;
    }
    return true;
  };

  const colocados = [];
  let fila = 1;
  let columna = 1;
  let filas = 0;
  for (const widget of widgets) {
    const dim = DIMENSIONES[widget.tamano] ?? DIMENSIONES.P;
    const ancho = Math.min(dim.ancho, columnas);
    const alto = widget.filas ?? dim.alto;
    // Avanza el cursor hasta un sitio donde quepa.
    for (;;) {
      if (columna + ancho - 1 > columnas) {
        fila++;
        columna = 1;
      } else if (libre(fila, columna, ancho, alto)) {
        break;
      } else {
        columna++;
      }
    }
    for (let f = fila; f < fila + alto; f++) {
      for (let c = columna; c < columna + ancho; c++) ocupado.add(`${f},${c}`);
    }
    colocados.push({ widget, fila, columna, ancho, alto });
    filas = Math.max(filas, fila + alto - 1);
    columna += ancho;
  }

  const huecos = [];
  for (let f = 1; f <= filas; f++) {
    for (let c = 1; c <= columnas; c++) if (!ocupado.has(`${f},${c}`)) huecos.push({ fila: f, columna: c });
  }
  return { colocados, huecos, filas };
};

// Columnas según el ancho del propio Dashboard (no de la pantalla: a 1024 px la barra lateral
// le deja unos 650 px). Con 880 px o más caben 4 widgets P sin que se aprieten los textos.
export const ANCHO_CUATRO_COLUMNAS = 880;
export const columnasParaAncho = (ancho) => (ancho >= ANCHO_CUATRO_COLUMNAS ? 4 : 2);

// Filas que necesita un contenido de `alto` px en la retícula `reticula` (el elemento): lee el
// alto de fila y el hueco entre filas de su CSS, así no se repiten aquí los valores de
// variables.css. Una fila más por cada (fila + hueco) que pase de la primera.
export const filasParaAlto = (alto, reticula) => {
  const estilo = getComputedStyle(reticula);
  const fila = parseFloat(estilo.gridAutoRows);
  const hueco = parseFloat(estilo.rowGap) || 0;
  return Math.max(1, Math.ceil((alto + hueco) / (fila + hueco)));
};
