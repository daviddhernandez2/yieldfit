// Pruebas de la retícula del Dashboard. Desde client/: node src/utils/reticula.test.js
import assert from 'node:assert/strict';
import { colocarWidgets, columnasParaAncho } from './reticula.js';

const w = (...tamanos) => tamanos.map((tamano, i) => ({ id: i, tamano }));
const posiciones = (r) => r.colocados.map((c) => [c.fila, c.columna]);

// El dashboard por defecto con un grupo además de Todos: P P G M.
let r = colocarWidgets(w('P', 'P', 'G', 'M'), 4);
assert.deepEqual(posiciones(r), [[1, 1], [1, 2], [1, 3], [2, 1]]);
assert.deepEqual(r.huecos, []);
r = colocarWidgets(w('P', 'P', 'G', 'M'), 2);
assert.deepEqual(posiciones(r), [[1, 1], [1, 2], [2, 1], [4, 1]]);
assert.deepEqual(r.huecos, []);

// El caso del boceto: P P G M M a 4 columnas deja un hueco junto al último M.
r = colocarWidgets(w('P', 'P', 'G', 'M', 'M'), 4);
assert.deepEqual(r.huecos, [{ fila: 3, columna: 3 }, { fila: 3, columna: 4 }]);

// Un M que no cabe al final de la fila salta a la siguiente y deja hueco detrás.
r = colocarWidgets(w('P', 'M', 'P'), 4);
assert.deepEqual(posiciones(r), [[1, 1], [1, 2], [1, 4]]);
r = colocarWidgets(w('P', 'P', 'P', 'M'), 4);
assert.deepEqual(posiciones(r), [[1, 1], [1, 2], [1, 3], [2, 1]]);
assert.deepEqual(r.huecos, [{ fila: 1, columna: 4 }, { fila: 2, columna: 3 }, { fila: 2, columna: 4 }]);

// Sin dense: no vuelve atrás a rellenar un hueco anterior.
r = colocarWidgets(w('P', 'M', 'P'), 2);
assert.deepEqual(posiciones(r), [[1, 1], [2, 1], [3, 1]]);
assert.deepEqual(r.huecos, [{ fila: 1, columna: 2 }, { fila: 3, columna: 2 }]);

// G a la derecha y M debajo, a su izquierda.
r = colocarWidgets(w('M', 'G', 'M', 'M'), 4);
assert.deepEqual(posiciones(r), [[1, 1], [1, 3], [2, 1], [3, 1]]);
assert.equal(r.filas, 3);

assert.deepEqual(colocarWidgets([], 4), { colocados: [], huecos: [], filas: 0 });

// Un grupo desplegado ocupa más filas (filas sustituye al alto del G); lo de después baja.
r = colocarWidgets([{ tamano: 'G', filas: 4 }, { tamano: 'G' }, { tamano: 'P' }], 4);
assert.deepEqual(r.colocados.map((c) => [c.fila, c.columna, c.alto]), [[1, 1, 4], [1, 3, 2], [3, 3, 1]]);
r = colocarWidgets([{ tamano: 'G', filas: 4 }, { tamano: 'P' }], 2);
assert.deepEqual(r.colocados.map((c) => [c.fila, c.columna]), [[1, 1], [5, 1]]);
assert.equal(columnasParaAncho(879), 2);
assert.equal(columnasParaAncho(880), 4);

console.log('reticula: todo correcto');
