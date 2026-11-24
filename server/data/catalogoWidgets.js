// Catálogo de widgets del Dashboard (bloque 9d, DECISIONS 0052). Es la ÚNICA fuente de verdad de
// los tipos, sus tamaños y los rangos: el modelo Dashboard los usa como enum, PUT /api/dashboard
// valida con ellos y el cliente los pide a GET /api/dashboard/catalogo (como las opciones de los
// ejercicios, 0024). El cliente no tiene copias.
//
// Cada widget:
//   - tipo: lo que se guarda en la base. No se cambia nunca (hay documentos que lo usan).
//   - nombre y descripcion: lo que se ve en el catálogo. Se pueden cambiar sin migrar nada.
//   - tamanos: los permitidos, de la retícula estricta. P = 1×1, M = 2×1, G = 2×2.
//   - tamanoPorDefecto: el que tiene al añadirlo.
//   - necesita: la referencia que hay que elegir al añadirlo ('chart', 'exercise', 'workout').
//   - conRango: guarda el rango elegido (1S … Total).
//   - disponible: false mientras el cliente aún no sabe pintarlo. Se pone a true en el paso del
//     bloque que lo construye; el servidor no deja guardar uno no disponible.

export const TAMANOS = ['P', 'M', 'G'];

// Como mucho, widgets por dashboard: el documento no crece sin límite (0015).
export const MAX_WIDGETS = 24;

// Rangos del progreso (antes en el cliente, utils/grupos.js; bloque 9). El % se mide desde el
// primer punto del rango. La fecha de inicio la calcula el cliente con su reloj.
export const RANGOS = [
  { valor: '1S', etiqueta: '1S', titulo: '1 semana' },
  { valor: '1M', etiqueta: '1M', titulo: '1 mes' },
  { valor: '1A', etiqueta: '1A', titulo: '1 año' },
  { valor: '5A', etiqueta: '5A', titulo: '5 años' },
  { valor: '10A', etiqueta: '10A', titulo: '10 años' },
  { valor: 'TOTAL', etiqueta: 'Total', titulo: 'todo el historial' },
];
export const RANGO_POR_DEFECTO = 'TOTAL';

export const CATALOGO = [
  {
    tipo: 'grupo',
    nombre: 'Grupo de progreso',
    // Solo G (decisión de David): un grupo siempre se ve con su gráfica y su lista de
    // ejercicios (tres, y el resto en un desplegable). Antes también P y M; los dashboards que
    // los tenían se corrigen solos al pedirlos (utils/dashboard.js, normalizarWidgets).
    descripcion: 'El % de un grupo de ejercicios, como en bolsa, con su gráfica y sus ejercicios.',
    tamanos: ['G'],
    tamanoPorDefecto: 'G',
    necesita: 'chart',
    conRango: true,
    disponible: true,
  },
  {
    tipo: 'progresoTotal',
    nombre: 'Progreso total',
    descripcion: 'El % de todo tu historial, con flecha y signo.',
    tamanos: ['P'],
    tamanoPorDefecto: 'P',
    disponible: true,
  },
  {
    tipo: 'sesionesTotales',
    nombre: 'Sesiones totales',
    descripcion: 'Cuántas sesiones llevas.',
    tamanos: ['P'],
    tamanoPorDefecto: 'P',
    disponible: true,
  },
  {
    tipo: 'racha',
    nombre: 'Racha',
    descripcion: 'Semanas seguidas entrenando.',
    tamanos: ['P'],
    tamanoPorDefecto: 'P',
    disponible: false,
  },
  {
    tipo: 'frecuenciaSemanal',
    nombre: 'Frecuencia semanal',
    descripcion: 'Sesiones por semana de las últimas semanas.',
    tamanos: ['M', 'G'],
    tamanoPorDefecto: 'M',
    disponible: false,
  },
  {
    tipo: 'ultimaSesion',
    nombre: 'Última sesión',
    descripcion: 'Qué hiciste y cuándo, con acceso al detalle.',
    tamanos: ['M', 'G'],
    tamanoPorDefecto: 'M',
    disponible: false,
  },
  {
    tipo: 'nuevosRecords',
    nombre: 'Nuevos récords',
    descripcion: 'Tus récords personales más recientes.',
    tamanos: ['M', 'G'],
    tamanoPorDefecto: 'M',
    disponible: false,
  },
  {
    tipo: 'recordEjercicio',
    nombre: 'Récord de un ejercicio',
    descripcion: 'Tu mejor 1RM estimado en el ejercicio que elijas.',
    tamanos: ['P', 'M'],
    tamanoPorDefecto: 'P',
    necesita: 'exercise',
    disponible: false,
  },
  {
    tipo: 'empezarRutina',
    nombre: 'Empezar rutina',
    descripcion: 'Acceso directo para empezar la rutina que elijas.',
    tamanos: ['P', 'M'],
    tamanoPorDefecto: 'P',
    necesita: 'workout',
    disponible: false,
  },
];

export const TIPOS = CATALOGO.map((w) => w.tipo);
export const VALORES_RANGO = RANGOS.map((r) => r.valor);
export const widgetDelCatalogo = (tipo) => CATALOGO.find((w) => w.tipo === tipo);

// Campo del widget que guarda cada referencia.
export const CAMPO_REFERENCIA = { chart: 'chartId', exercise: 'exerciseId', workout: 'workoutId' };
