import Chart from '../models/Chart.js';
import Dashboard from '../models/Dashboard.js';
import {
  CAMPO_REFERENCIA,
  MAX_WIDGETS,
  VALORES_RANGO,
  widgetDelCatalogo,
} from '../data/catalogoWidgets.js';

// Lógica del Dashboard personalizable (bloque 9d, DECISIONS 0052).
//   - validarWidgets y dashboardPorDefecto: puras (sin base de datos), con pruebas en
//     dashboard.test.js.
//   - asegurarDashboard: crea el grupo "Todos" y el dashboard la primera vez.

const NOMBRE_TODOS = 'Todos';

// Comprueba la lista que envía el cliente con el catálogo y la deja limpia: solo los campos que
// tocan a cada tipo (un widget de "Racha" no guarda chartId aunque venga). La propiedad de las
// referencias (que el grupo, ejercicio o rutina sean del usuario) la comprueba el controlador.
// Devuelve { widgets } o { error } con el primer problema, en español para el usuario.
export const validarWidgets = (widgets) => {
  if (!Array.isArray(widgets)) return { error: 'widgets tiene que ser una lista' };
  if (widgets.length > MAX_WIDGETS) return { error: `Como mucho ${MAX_WIDGETS} widgets` };

  const limpios = [];
  const gruposVistos = new Set();
  for (const w of widgets) {
    const def = widgetDelCatalogo(w?.tipo);
    if (!def) return { error: `Tipo de widget no válido: ${w?.tipo}` };
    if (!def.disponible) return { error: `«${def.nombre}» aún no está disponible` };
    if (!def.tamanos.includes(w.tamano)) {
      return { error: `«${def.nombre}» no admite el tamaño ${w.tamano}` };
    }

    const limpio = { tipo: w.tipo, tamano: w.tamano };
    // _id: el que ya tenía, para que el cliente conserve la clave al arrastrar. Los nuevos no
    // lo traen y Mongoose les pone uno.
    if (w._id) limpio._id = w._id;

    if (def.necesita) {
      const campo = CAMPO_REFERENCIA[def.necesita];
      if (!w[campo]) return { error: `«${def.nombre}» necesita ${campo}` };
      limpio[campo] = w[campo];
    }
    // El mismo grupo dos veces no aporta nada y confunde al editar.
    if (def.tipo === 'grupo') {
      if (gruposVistos.has(String(w.chartId))) return { error: 'Ese grupo ya está en el dashboard' };
      gruposVistos.add(String(w.chartId));
    }
    if (def.conRango && w.rango !== undefined) {
      if (!VALORES_RANGO.includes(w.rango)) return { error: `Rango no válido: ${w.rango}` };
      limpio.rango = w.rango;
    }
    limpios.push(limpio);
  }
  return { widgets: limpios };
};

// Dashboard de un usuario nuevo, de uno de antes del 9d o de uno que aún no lo ha personalizado
// (porDefecto). En este orden:
//   1. Progreso total (P), Sesiones totales (P) y Racha (M): una fila a 4 columnas.
//   2. Los grupos, siempre en G: "Todos" primero y el resto en orden de creación.
//   3. Última sesión (M) y Nuevos récords (M).
// `charts`: los grupos del usuario, ya ordenados ("Todos" primero), con { _id, todos }.
//
// Sin huecos ni a 4 ni a 2 columnas (P = 1×1, M = 2×1, G = 2×2; colocación en orden, sin dense):
//   - A 4 columnas, los G van de dos en dos. Con un número par de grupos, los dos M del final
//     llenan una fila; con uno impar, quedan apilados junto al último G y llenan su hueco.
//   - A 2 columnas, P P llenan una fila y cada M o G ocupa el ancho entero.
// Si hay tantos grupos que no caben (como mucho MAX_WIDGETS widgets), entran los primeros.
// Frecuencia semanal y los demás quedan en el catálogo.
export const dashboardPorDefecto = (charts) => {
  const inicio = [
    { tipo: 'progresoTotal', tamano: 'P' },
    { tipo: 'sesionesTotales', tamano: 'P' },
    { tipo: 'racha', tamano: 'M' },
  ];
  const final = [
    { tipo: 'ultimaSesion', tamano: 'M' },
    { tipo: 'nuevosRecords', tamano: 'M' },
  ];
  const grupos = charts.slice(0, MAX_WIDGETS - inicio.length - final.length);
  return [...inicio, ...grupos.map((c) => ({ tipo: 'grupo', tamano: 'G', chartId: c._id })), ...final];
};

// Ajusta un dashboard guardado al catálogo actual: un tamaño que el tipo ya no admite pasa a su
// tamaño por defecto (p. ej. los grupos en M o P de antes de que solo existiera G), y un tipo
// que ya no existe o no está disponible se quita. Pura: devuelve { widgets, cambiado }.
export const normalizarWidgets = (widgets) => {
  let cambiado = false;
  const resultado = [];
  for (const w of widgets) {
    const def = widgetDelCatalogo(w.tipo);
    if (!def || !def.disponible) {
      cambiado = true;
      continue;
    }
    if (!def.tamanos.includes(w.tamano)) {
      cambiado = true;
      resultado.push({ ...w, tamano: def.tamanoPorDefecto });
    } else {
      resultado.push(w);
    }
  }
  return { widgets: resultado, cambiado };
};

// Clave de un widget para reconocerlo entre dos versiones del dashboard: su tipo y su
// referencia (dos grupos distintos son widgets distintos).
const claveWidget = (w) => `${w.tipo}:${w.chartId ?? w.exerciseId ?? w.workoutId ?? ''}`;

// El dashboard por defecto para unos grupos, conservando de `actuales` el _id (el cliente lo usa
// de clave) y el rango que el usuario eligiera en cada widget. Pura.
export const rehacerPorDefecto = (actuales, charts) => {
  const previos = new Map(actuales.map((w) => [claveWidget(w), w]));
  return dashboardPorDefecto(charts).map((w) => {
    const previo = previos.get(claveWidget(w));
    if (!previo) return w;
    return { ...w, _id: previo._id, ...(previo.rango ? { rango: previo.rango } : {}) };
  });
};

// ¿Cambia la estructura (orden, tipos, tamaños o referencias) entre dos listas? Cambiar solo el
// rango no cuenta: no es personalizar el dashboard, es una forma de mirarlo. Pura.
const estructura = (widgets) =>
  JSON.stringify(widgets.map((w) => [w.tipo, w.tamano, String(w.chartId ?? ''), String(w.exerciseId ?? ''), String(w.workoutId ?? '')]));
export const cambiaEstructura = (antes, despues) => estructura(antes) !== estructura(despues);

// ¿Son el mismo dashboard? Misma estructura y mismos rangos (las claves de cada objeto pueden
// venir en otro orden, por eso no se comparan los objetos tal cual). Pura.
const rangos = (widgets) => widgets.map((w) => w.rango ?? '').join(',');
export const mismoDashboard = (a, b) => !cambiaEstructura(a, b) && rangos(a) === rangos(b);

// E11000: clave duplicada (otra petición acaba de crear el mismo documento).
const esDuplicado = (error) => error?.code === 11000;

// Grupos del usuario en el orden del dashboard por defecto: "Todos" primero y el resto en orden
// de creación.
const gruposEnOrden = async (userId) => {
  const charts = await Chart.find({ userId }, { todos: 1 }).sort({ createdAt: 1 }).lean();
  return charts.sort((a, b) => Number(Boolean(b.todos)) - Number(Boolean(a.todos)));
};

// Devuelve el dashboard del usuario, al día:
//   - Si no tiene, lo crea junto con su grupo "Todos" (los usuarios de antes del 9d lo reciben
//     la primera vez que abren el Dashboard nuevo, sin script de migración en producción).
//   - Si no lo ha personalizado (porDefecto), lo rehace con el dashboard por defecto: así
//     recibe los widgets nuevos de cada paso y sus grupos, sin perder los rangos elegidos.
//   - Si lo ha personalizado, solo lo ajusta al catálogo (normalizarWidgets).
// Solo escribe si algo cambia.
//
// La creación aguanta dos peticiones a la vez: los índices únicos (un dashboard y un "Todos"
// por usuario) hacen fallar la segunda, y entonces se lee lo que creó la primera. Por eso no
// hace falta una transacción. Si el usuario borró "Todos", no vuelve a aparecer.
export const asegurarDashboard = async (userId) => {
  const existente = await Dashboard.findOne({ userId });
  if (existente) {
    const actuales = existente.widgets.map((w) => w.toObject());
    const nuevos = existente.porDefecto
      ? rehacerPorDefecto(actuales, await gruposEnOrden(userId))
      : normalizarWidgets(actuales).widgets;
    if (!mismoDashboard(nuevos, actuales)) {
      existente.widgets = nuevos;
      await existente.save();
    }
    return existente;
  }

  try {
    await Chart.create({ userId, nombre: NOMBRE_TODOS, todos: true, exerciseIds: [] });
  } catch (error) {
    if (!esDuplicado(error)) throw error; // ya lo tenía: se usa ese
  }

  try {
    return await Dashboard.create({ userId, widgets: dashboardPorDefecto(await gruposEnOrden(userId)) });
  } catch (error) {
    if (!esDuplicado(error)) throw error;
    return Dashboard.findOne({ userId });
  }
};
