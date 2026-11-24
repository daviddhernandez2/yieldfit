// Pruebas del Dashboard personalizable (utils/dashboard.js). Desde /server:
//   node utils/dashboard.test.js
// Solo las funciones puras: no conecta a la base de datos.

import { dashboardPorDefecto, validarWidgets } from './dashboard.js';
import { CATALOGO, MAX_WIDGETS } from '../data/catalogoWidgets.js';

let fallos = 0;
const ok = (desc, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bien) fallos++;
  console.log(`${bien ? 'OK   ' : 'FALLO'} ${desc}: ${JSON.stringify(real)}${bien ? '' : '  (esperado ' + JSON.stringify(esperado) + ')'}`);
};

// --- validarWidgets ---
ok('lista vacía', validarWidgets([]), { widgets: [] });
ok('no es una lista', validarWidgets({}), { error: 'widgets tiene que ser una lista' });
ok('tipo desconocido', validarWidgets([{ tipo: 'clima', tamano: 'P' }]), { error: 'Tipo de widget no válido: clima' });
ok('tipo aún no disponible', validarWidgets([{ tipo: 'racha', tamano: 'P' }]), { error: '«Racha» aún no está disponible' });
ok('tamaño no permitido', validarWidgets([{ tipo: 'progresoTotal', tamano: 'G' }]), { error: '«Progreso total» no admite el tamaño G' });
ok('grupo sin chartId', validarWidgets([{ tipo: 'grupo', tamano: 'M' }]), { error: '«Grupo de progreso» necesita chartId' });
ok('mismo grupo dos veces',
  validarWidgets([{ tipo: 'grupo', tamano: 'M', chartId: 'a' }, { tipo: 'grupo', tamano: 'P', chartId: 'a' }]),
  { error: 'Ese grupo ya está en el dashboard' });
ok('rango no válido', validarWidgets([{ tipo: 'grupo', tamano: 'M', chartId: 'a', rango: '3D' }]), { error: 'Rango no válido: 3D' });
ok('limpia campos que no tocan y conserva _id y rango',
  validarWidgets([
    { _id: 'w1', tipo: 'grupo', tamano: 'G', chartId: 'a', rango: '1M', exerciseId: 'x', color: 'rojo' },
    { tipo: 'progresoTotal', tamano: 'P', chartId: 'b', rango: '1A' },
  ]),
  { widgets: [{ tipo: 'grupo', tamano: 'G', _id: 'w1', chartId: 'a', rango: '1M' }, { tipo: 'progresoTotal', tamano: 'P' }] });
const muchos = Array.from({ length: MAX_WIDGETS + 1 }, () => ({ tipo: 'progresoTotal', tamano: 'P' }));
ok(`más de ${MAX_WIDGETS}`, validarWidgets(muchos), { error: `Como mucho ${MAX_WIDGETS} widgets` });

// --- dashboardPorDefecto ---
ok('por defecto: con un grupo además de Todos, Todos en grande',
  dashboardPorDefecto([{ _id: 't', todos: true }, { _id: 'e' }]),
  [
    { tipo: 'progresoTotal', tamano: 'P' },
    { tipo: 'sesionesTotales', tamano: 'P' },
    { tipo: 'grupo', tamano: 'G', chartId: 't' },
    { tipo: 'grupo', tamano: 'M', chartId: 'e' },
  ]);
ok('por defecto: con dos grupos además de Todos, Todos en mediano',
  dashboardPorDefecto([{ _id: 't', todos: true }, { _id: 'e' }, { _id: 'p' }]).map((w) => w.tamano),
  ['P', 'P', 'M', 'M', 'M']);
ok('el dashboard por defecto pasa la validación',
  'widgets' in validarWidgets(dashboardPorDefecto([{ _id: 't', todos: true }, { _id: 'e' }])), true);

// Colocación en orden y sin dense, como la retícula del cliente (client/src/utils/reticula.js):
// devuelve las celdas libres que quedan, también al final de la última fila.
const TAM = { P: [1, 1], M: [2, 1], G: [2, 2] };
const huecos = (widgets, columnas) => {
  const ocupado = new Set();
  let fila = 0, col = 0, ultimaFila = 0;
  for (const w of widgets) {
    const [ancho, alto] = TAM[w.tamano].map((n, i) => (i === 0 ? Math.min(n, columnas) : n));
    for (;;) {
      if (col + ancho > columnas) { fila++; col = 0; continue; }
      let libre = true;
      for (let f = fila; f < fila + alto; f++) for (let c = col; c < col + ancho; c++) if (ocupado.has(`${f},${c}`)) libre = false;
      if (libre) break;
      col++;
    }
    for (let f = fila; f < fila + alto; f++) for (let c = col; c < col + ancho; c++) ocupado.add(`${f},${c}`);
    ultimaFila = Math.max(ultimaFila, fila + alto - 1);
    col += ancho;
  }
  return (ultimaFila + 1) * columnas - ocupado.size;
};
const sinHuecos = [];
for (let n = 0; n <= 10; n++) {
  const charts = [{ _id: 't', todos: true }, ...Array.from({ length: n }, (_, i) => ({ _id: `g${i}` }))];
  const d = dashboardPorDefecto(charts);
  sinHuecos.push([n, huecos(d, 4), huecos(d, 2)]);
}
ok('por defecto, de 0 a 10 grupos además de Todos: 0 huecos a 4 y a 2 columnas',
  sinHuecos.filter(([, h4, h2]) => h4 || h2), []);
const sinTodos = [0, 1, 2, 3].map((n) => dashboardPorDefecto(Array.from({ length: n }, (_, i) => ({ _id: `g${i}` }))));
ok('sin Todos (lo borró): la parte de grupos con 2 columnas nunca deja huecos',
  sinTodos.map((d) => huecos(d, 2)), [0, 0, 0, 0]);
ok('como mucho MAX_WIDGETS', dashboardPorDefecto(Array.from({ length: 40 }, (_, i) => ({ _id: `g${i}` }))).length, MAX_WIDGETS);

// --- coherencia del catálogo ---
ok('cada tamaño por defecto está entre los permitidos',
  CATALOGO.filter((w) => !w.tamanos.includes(w.tamanoPorDefecto)).map((w) => w.tipo), []);
ok('tipos sin repetir', new Set(CATALOGO.map((w) => w.tipo)).size, CATALOGO.length);

console.log(fallos === 0 ? '\nTodo bien.' : `\n${fallos} fallo(s).`);
process.exitCode = fallos === 0 ? 0 : 1;
