// Funciones puras para reordenar listas al arrastrar (bloque 9b). Sin React: se prueban con
// node src/utils/orden.test.js (desde /client).

// Copia de la lista con el elemento de la posición `desde` movido a `hasta`. Los demás se
// desplazan para hacerle sitio: mover [A,B,C,D] de 0 a 2 da [B,C,A,D].
export const moverElemento = (lista, desde, hasta) => {
  if (desde === hasta || desde < 0 || hasta < 0 || desde >= lista.length || hasta >= lista.length) return lista;
  const copia = [...lista];
  const [movido] = copia.splice(desde, 1);
  copia.splice(hasta, 0, movido);
  return copia;
};

// Dónde queda un índice después de mover un elemento de `desde` a `hasta`. Sirve para que
// lo que señala un ejercicio por su posición (el temporizador de descanso, el ejercicio
// abierto) siga señalando al mismo ejercicio tras arrastrar.
export const indiceTrasMover = (indice, desde, hasta) => {
  if (indice === desde) return hasta; // el que se movió
  if (desde < indice && indice <= hasta) return indice - 1; // se movió uno de delante hacia atrás
  if (hasta <= indice && indice < desde) return indice + 1; // se movió uno de detrás hacia delante
  return indice;
};
