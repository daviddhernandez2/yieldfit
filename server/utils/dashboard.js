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

// Dashboard de un usuario nuevo o de uno que aún no tenía (los de antes del 9d): las dos cifras
// de resumen y sus grupos, "Todos" en grande y el resto en mediano, en orden de creación (el
// orden que cada dispositivo guardaba antes se pierde una vez: decisión de David).
// `charts`: los grupos del usuario, ya ordenados, con { _id, todos }.
export const dashboardPorDefecto = (charts) => [
  { tipo: 'progresoTotal', tamano: 'P' },
  { tipo: 'sesionesTotales', tamano: 'P' },
  ...charts.map((c) => ({ tipo: 'grupo', tamano: c.todos ? 'G' : 'M', chartId: c._id })),
];

// E11000: clave duplicada (otra petición acaba de crear el mismo documento).
const esDuplicado = (error) => error?.code === 11000;

// Devuelve el dashboard del usuario y, si no tiene, lo crea junto con su grupo "Todos".
// La llama GET /api/dashboard: así los usuarios de antes del 9d lo reciben la primera vez que
// abren el Dashboard nuevo, sin script de migración en producción.
//
// Se puede repetir sin efecto y aguanta dos peticiones a la vez: los índices únicos (un
// dashboard y un "Todos" por usuario) hacen fallar la segunda creación, y entonces se lee lo
// que creó la primera. Por eso no hace falta una transacción.
//
// Si el usuario ya tiene dashboard, no se toca: si borró "Todos", no vuelve a aparecer.
export const asegurarDashboard = async (userId) => {
  const existente = await Dashboard.findOne({ userId });
  if (existente) return existente;

  try {
    await Chart.create({ userId, nombre: NOMBRE_TODOS, todos: true, exerciseIds: [] });
  } catch (error) {
    if (!esDuplicado(error)) throw error; // ya lo tenía: se usa ese
  }

  const charts = await Chart.find({ userId }, { todos: 1 }).sort({ createdAt: 1 }).lean();
  // "Todos" primero; el resto, en orden de creación.
  charts.sort((a, b) => Number(Boolean(b.todos)) - Number(Boolean(a.todos)));

  try {
    return await Dashboard.create({ userId, widgets: dashboardPorDefecto(charts) });
  } catch (error) {
    if (!esDuplicado(error)) throw error;
    return Dashboard.findOne({ userId });
  }
};
