// Pruebas del Dashboard personalizable (utils/dashboard.js). Desde /server:
//   node utils/dashboard.test.js
// Solo las funciones puras: no conecta a la base de datos.

import { cambiaEstructura, dashboardPorDefecto, mismoDashboard, normalizarWidgets, rehacerPorDefecto, validarWidgets } from './dashboard.js';
import { CATALOGO, MAX_WIDGETS } from '../data/catalogoWidgets.js';

let fallos = 0;
const ok = (desc, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bien) fallos++;
  console.log(`${bien ? 'OK   ' : 'FALLO'} ${desc}: ${JSON.stringify(real)}${bien ? '' : '  (esperado ' + JSON.stringify(esperado) + ')'}`);
};
// Desde el cierre del 9d todos los widgets del catálogo están disponibles, pero la regla sigue
// (un widget nuevo nace con disponible: false). Para probarla, un tipo se marca como no
// disponible solo mientras dura `fn`, y se deja como estaba aunque falle.
const conNoDisponible = (tipo, fn) => {
  const def = CATALOGO.find((w) => w.tipo === tipo);
  const antes = def.disponible;
  def.disponible = false;
  try {
    return fn();
  } finally {
    def.disponible = antes;
  }
};

// --- validarWidgets ---
ok('lista vacía', validarWidgets([]), { widgets: [] });
ok('no es una lista', validarWidgets({}), { error: 'widgets tiene que ser una lista' });
ok('tipo desconocido', validarWidgets([{ tipo: 'clima', tamano: 'P' }]), { error: 'Tipo de widget no válido: clima' });
ok('tipo aún no disponible',
  conNoDisponible('recordEjercicio', () => validarWidgets([{ tipo: 'recordEjercicio', tamano: 'P', exerciseId: 'x' }])),
  { error: '«Récord de un ejercicio» aún no está disponible' });
ok('y disponible, se acepta', 'widgets' in validarWidgets([{ tipo: 'recordEjercicio', tamano: 'P', exerciseId: 'x' }]), true);
ok('tamaño no permitido', validarWidgets([{ tipo: 'progresoTotal', tamano: 'G' }]), { error: '«Progreso total» no admite el tamaño G' });
ok('grupo sin chartId', validarWidgets([{ tipo: 'grupo', tamano: 'G' }]), { error: '«Grupo de progreso» necesita chartId' });
ok('mismo grupo dos veces',
  validarWidgets([{ tipo: 'grupo', tamano: 'G', chartId: 'a' }, { tipo: 'grupo', tamano: 'G', chartId: 'a' }]),
  { error: 'Ese grupo ya está en el dashboard' });
ok('rango no válido', validarWidgets([{ tipo: 'grupo', tamano: 'G', chartId: 'a', rango: '3D' }]), { error: 'Rango no válido: 3D' });
ok('grupo en M ya no se admite', validarWidgets([{ tipo: 'grupo', tamano: 'M', chartId: 'a' }]), { error: '«Grupo de progreso» no admite el tamaño M' });
ok('limpia campos que no tocan y conserva _id y rango',
  validarWidgets([
    { _id: 'w1', tipo: 'grupo', tamano: 'G', chartId: 'a', rango: '1M', exerciseId: 'x', color: 'rojo' },
    { tipo: 'progresoTotal', tamano: 'P', chartId: 'b', rango: '1A' },
  ]),
  { widgets: [{ tipo: 'grupo', tamano: 'G', _id: 'w1', chartId: 'a', rango: '1M' }, { tipo: 'progresoTotal', tamano: 'P' }] });
const muchos = Array.from({ length: MAX_WIDGETS + 1 }, () => ({ tipo: 'progresoTotal', tamano: 'P' }));
ok(`más de ${MAX_WIDGETS}`, validarWidgets(muchos), { error: `Como mucho ${MAX_WIDGETS} widgets` });

// --- dashboardPorDefecto ---
ok('por defecto: resumen, racha, grupos en G (Todos primero), última sesión y récords',
  dashboardPorDefecto([{ _id: 't', todos: true }, { _id: 'e' }]),
  [
    { tipo: 'progresoTotal', tamano: 'P' },
    { tipo: 'sesionesTotales', tamano: 'P' },
    { tipo: 'racha', tamano: 'M' },
    { tipo: 'grupo', tamano: 'G', chartId: 't' },
    { tipo: 'grupo', tamano: 'G', chartId: 'e' },
    { tipo: 'ultimaSesion', tamano: 'M' },
    { tipo: 'nuevosRecords', tamano: 'M' },
  ]);
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
const porGrupos = [];
for (let n = 0; n <= 10; n++) {
  const d = dashboardPorDefecto([{ _id: 't', todos: true }, ...Array.from({ length: n }, (_, i) => ({ _id: `g${i}` }))]);
  porGrupos.push([huecos(d, 2), huecos(d, 4)]);
}
ok('por defecto, de 0 a 10 grupos además de Todos: 0 huecos a 2 y a 4 columnas',
  [...new Set(porGrupos.map(([h2, h4]) => `${h2}/${h4}`))], ['0/0']);
ok('sin ningún grupo (borró Todos): tampoco', [huecos(dashboardPorDefecto([]), 2), huecos(dashboardPorDefecto([]), 4)], [0, 0]);
ok('como mucho MAX_WIDGETS', dashboardPorDefecto(Array.from({ length: 40 }, (_, i) => ({ _id: `g${i}` }))).length, MAX_WIDGETS);

// --- normalizarWidgets ---
ok('grupos en M o P pasan a G; lo válido no cambia',
  normalizarWidgets([{ tipo: 'grupo', tamano: 'M', chartId: 'a' }, { tipo: 'grupo', tamano: 'P', chartId: 'b' }, { tipo: 'progresoTotal', tamano: 'P' }]),
  { widgets: [{ tipo: 'grupo', tamano: 'G', chartId: 'a' }, { tipo: 'grupo', tamano: 'G', chartId: 'b' }, { tipo: 'progresoTotal', tamano: 'P' }], cambiado: true });
ok('tipo que ya no existe o no está disponible: se quita',
  conNoDisponible('empezarRutina', () => normalizarWidgets([{ tipo: 'clima', tamano: 'P' }, { tipo: 'empezarRutina', tamano: 'P', workoutId: 'w' }])),
  { widgets: [], cambiado: true });
ok('nada que ajustar', normalizarWidgets([{ tipo: 'sesionesTotales', tamano: 'P' }]).cambiado, false);

// --- rehacerPorDefecto ---
const antes = [
  { _id: 'w1', tipo: 'progresoTotal', tamano: 'P' },
  { _id: 'w2', tipo: 'grupo', tamano: 'M', chartId: 'e', rango: '1M' },
];
ok('rehecho: conserva _id y rango; lo nuevo, sin _id',
  rehacerPorDefecto(antes, [{ _id: 't', todos: true }, { _id: 'e' }]),
  [
    { tipo: 'progresoTotal', tamano: 'P', _id: 'w1' },
    { tipo: 'sesionesTotales', tamano: 'P' },
    { tipo: 'racha', tamano: 'M' },
    { tipo: 'grupo', tamano: 'G', chartId: 't' },
    { tipo: 'grupo', tamano: 'G', chartId: 'e', _id: 'w2', rango: '1M' },
    { tipo: 'ultimaSesion', tamano: 'M' },
    { tipo: 'nuevosRecords', tamano: 'M' },
  ]);

// --- cambiaEstructura y mismoDashboard ---
const base = [{ tipo: 'grupo', tamano: 'G', chartId: 'a' }, { tipo: 'progresoTotal', tamano: 'P' }];
ok('cambiar el rango no cambia la estructura', cambiaEstructura(base, [{ ...base[0], rango: '1A' }, base[1]]), false);
ok('mover sí', cambiaEstructura(base, [base[1], base[0]]), true);
ok('quitar sí', cambiaEstructura(base, [base[0]]), true);
ok('mismo dashboard con las claves en otro orden', mismoDashboard(base, [{ chartId: 'a', tamano: 'G', tipo: 'grupo' }, { tamano: 'P', tipo: 'progresoTotal' }]), true);
ok('otro rango: no es el mismo', mismoDashboard(base, [{ ...base[0], rango: '1A' }, base[1]]), false);

// --- coherencia del catálogo ---
ok('cada tamaño por defecto está entre los permitidos',
  CATALOGO.filter((w) => !w.tamanos.includes(w.tamanoPorDefecto)).map((w) => w.tipo), []);
ok('tipos sin repetir', new Set(CATALOGO.map((w) => w.tipo)).size, CATALOGO.length);

console.log(fallos === 0 ? '\nTodo bien.' : `\n${fallos} fallo(s).`);
process.exitCode = fallos === 0 ? 0 : 1;
