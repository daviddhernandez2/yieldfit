// Pruebas del modo edición del Dashboard (bloque 9d). Desde client/: node src/utils/edicionDashboard.test.js
import assert from 'node:assert/strict';
import { colocarWidgets } from './reticula.js';
import {
  cambiarTamano,
  empezarBorrador,
  gruposYaPuestos,
  indiceParaHueco,
  insertarWidget,
  moverWidget,
  nuevoWidget,
  paraGuardar,
  quitarWidget,
  tiposYaPuestos,
} from './edicionDashboard.js';

const W = [
  { _id: 'a', tipo: 'progresoTotal', tamano: 'P' },
  { _id: 'b', tipo: 'sesionesTotales', tamano: 'P' },
  { _id: 'c', tipo: 'racha', tamano: 'M' },
  { _id: 'd', tipo: 'grupo', tamano: 'G', chartId: 'g1', rango: 'TOTAL', filas: 4 },
];
const CATALOGO = [
  { tipo: 'grupo', tamanoPorDefecto: 'G', necesita: 'chart' },
  { tipo: 'progresoTotal', tamanoPorDefecto: 'P' },
  { tipo: 'sesionesTotales', tamanoPorDefecto: 'P' },
  { tipo: 'racha', tamanoPorDefecto: 'M' },
  { tipo: 'recordEjercicio', tamanoPorDefecto: 'P', necesita: 'exercise' },
];
const CAMPOS = { chart: 'chartId', exercise: 'exerciseId', workout: 'workoutId' };
const ids = (l) => l.map((w) => w._id);

const borrador = empezarBorrador(W);
assert.equal('filas' in borrador[3], false); // el desplegado no entra en el borrador
assert.notEqual(borrador[0], W[0]); // copia: editar no toca lo que se ve
assert.deepEqual(ids(quitarWidget(borrador, 'b')), ['a', 'c', 'd']);
assert.equal(cambiarTamano(borrador, 'c', 'P')[2].tamano, 'P');
assert.equal(cambiarTamano(borrador, 'c', 'P')[0], borrador[0]); // los demás, los mismos objetos
assert.deepEqual(ids(moverWidget(borrador, 'c', 'a')), ['c', 'a', 'b', 'd']);
assert.deepEqual(ids(moverWidget(borrador, 'a', 'd')), ['b', 'c', 'd', 'a']);

const nuevo = nuevoWidget(CATALOGO[4], 'ej1', CAMPOS, 'x1');
assert.deepEqual(nuevo, { _id: 'nuevo-x1', tipo: 'recordEjercicio', tamano: 'P', exerciseId: 'ej1' });
assert.deepEqual(nuevoWidget(CATALOGO[3], null, CAMPOS, 'x2'), { _id: 'nuevo-x2', tipo: 'racha', tamano: 'M' });
assert.deepEqual(ids(insertarWidget(borrador, nuevo)), ['a', 'b', 'c', 'd', 'nuevo-x1']);
assert.deepEqual(ids(insertarWidget(borrador, nuevo, 1)), ['a', 'nuevo-x1', 'b', 'c', 'd']);

// Huecos: a 4 columnas, sin Sesiones totales la Racha (M) pasa a las columnas 2 y 3 y queda un
// hueco en la 4 de la fila 1. Insertar en ese hueco pone el nuevo delante del grupo (fila 2).
const sinSesiones = quitarWidget(borrador, 'b');
const { colocados, huecos } = colocarWidgets(sinSesiones, 4);
assert.deepEqual(huecos[0], { fila: 1, columna: 4 });
const i = indiceParaHueco(colocados, huecos[0]);
assert.equal(i, 2);
const relleno = insertarWidget(sinSesiones, nuevo, i);
assert.equal(colocarWidgets(relleno, 4).huecos.filter((h) => h.fila === 1).length, 0); // ya no hay hueco en la fila 1
// Un hueco al final: el nuevo va al final.
assert.equal(indiceParaHueco(colocados, { fila: 9, columna: 1 }), colocados.length);

assert.deepEqual([...tiposYaPuestos(borrador, CATALOGO)].sort(), ['progresoTotal', 'racha', 'sesionesTotales']);
assert.deepEqual([...gruposYaPuestos(borrador)], ['g1']);

// Al guardar: los nuevos sin _id; los que ya existían, con el suyo.
const guardar = paraGuardar(insertarWidget(borrador, nuevo));
assert.deepEqual(guardar.at(-1), { tipo: 'recordEjercicio', tamano: 'P', exerciseId: 'ej1' });
assert.equal(guardar[0]._id, 'a');

console.log('edicionDashboard: todas las pruebas pasan');
