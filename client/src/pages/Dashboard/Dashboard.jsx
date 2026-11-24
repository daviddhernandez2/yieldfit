import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listCharts } from '@/api/charts.js';
import { getCatalogo, getDashboard, updateDashboard } from '@/api/dashboard.js';
import { getActividad } from '@/api/estadisticas.js';
import { getProgress } from '@/api/progress.js';
import { getRecordsRecientes, listSessions } from '@/api/sessions.js';
import Esqueleto, { ZonaCarga } from '@/components/Esqueleto/Esqueleto.jsx';
import useColumnasDashboard from '@/hooks/useColumnasDashboard.js';
import WidgetCifra from '@/pages/Dashboard/widgets/WidgetCifra.jsx';
import WidgetFrecuencia from '@/pages/Dashboard/widgets/WidgetFrecuencia.jsx';
import WidgetGrupo from '@/pages/Dashboard/widgets/WidgetGrupo.jsx';
import WidgetNuevosRecords from '@/pages/Dashboard/widgets/WidgetNuevosRecords.jsx';
import WidgetRacha from '@/pages/Dashboard/widgets/WidgetRacha.jsx';
import WidgetUltimaSesion from '@/pages/Dashboard/widgets/WidgetUltimaSesion.jsx';
import { limpiarPreferenciasAntiguas } from '@/utils/grupos.js';
import { colocarWidgets } from '@/utils/reticula.js';
import styles from '@/pages/Dashboard/Dashboard.module.css';

// Icono + para el botón "Nuevo grupo" del header.
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// Silueta mientras carga: la forma del dashboard por defecto con dos grupos (P P M, G G, M M),
// en la misma retícula.
const ESQUELETO = [
  { _id: 'e1', tamano: 'P' },
  { _id: 'e2', tamano: 'P' },
  { _id: 'e3', tamano: 'M' },
  { _id: 'e4', tamano: 'G' },
  { _id: 'e5', tamano: 'G' },
  { _id: 'e6', tamano: 'M' },
  { _id: 'e7', tamano: 'M' },
];

// Datos que comparten varios widgets (bloque 9d): se piden una sola vez, y solo si algún widget
// del dashboard los usa. Devuelve { datos, error }; datos es undefined mientras carga.
const useCarga = (activo, cargar) => {
  const [estado, setEstado] = useState({ datos: undefined, error: false });
  useEffect(() => {
    if (!activo) return;
    let montado = true;
    cargar()
      .then((datos) => montado && setEstado({ datos, error: false }))
      .catch(() => montado && setEstado({ datos: undefined, error: true }));
    return () => {
      montado = false;
    };
    // `cargar` es una función fija de este módulo: solo importa si hace falta o no.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo]);
  return estado;
};

const TIPOS_ACTIVIDAD = ['sesionesTotales', 'racha', 'frecuenciaSemanal'];
const cargarActividad = () => getActividad().then((res) => res.data.actividad);
// 6: los que caben en el tamaño G (en M se ven 2).
const cargarRecords = () => getRecordsRecientes(6).then((res) => res.data.records);
const cargarUltima = () => listSessions({ limite: 1 }).then((res) => res.data.sessions[0] ?? null);

// Posición de un widget en la retícula: fila y columna explícitas (utils/reticula.js).
const estiloCelda = ({ fila, columna, ancho, alto }) => ({
  gridRow: `${fila} / span ${alto}`,
  gridColumn: `${columna} / span ${ancho}`,
});

// Dashboard personalizable (bloque 9d, DECISIONS 0052): widgets en una retícula estricta de 4 o 2
// columnas, en el orden y con los tamaños que el usuario guardó en el servidor. Fuera del modo
// edición (paso 3) solo se mira; el rango de cada grupo sí se cambia aquí.
//
// Cada widget de grupo pide su propio progreso; "Progreso total" y "Sesiones" comparten el de
// todo el historial, que se pide aquí una sola vez.
export default function Dashboard() {
  const navigate = useNavigate();
  const [ref, columnas] = useColumnasDashboard();
  const [widgets, setWidgets] = useState(null);
  const [grupos, setGrupos] = useState(null); // Map id → grupo
  const [rangos, setRangos] = useState(null);
  const [general, setGeneral] = useState({ progreso: null, error: false });
  const [error, setError] = useState('');
  const [errorGuardar, setErrorGuardar] = useState('');
  // Filas de los grupos desplegados ({ widgetId: filas }). Solo para mirar: no se guarda.
  const [filasDesplegadas, setFilasDesplegadas] = useState({});

  // Un grupo pide más filas al desplegar su lista, o null para volver a su tamaño. Si no cambia
  // nada, se devuelve el mismo objeto para no volver a pintar.
  const cambiarFilas = useCallback((widgetId, filas) => {
    setFilasDesplegadas((actual) => {
      if ((actual[widgetId] ?? null) === filas) return actual;
      const nuevo = { ...actual };
      if (filas === null) delete nuevo[widgetId];
      else nuevo[widgetId] = filas;
      return nuevo;
    });
  }, []);

  useEffect(() => {
    // El rango, el plegado y el orden que antes guardaba cada dispositivo ya no se usan.
    limpiarPreferenciasAntiguas();

    const cargar = async () => {
      try {
        // Primero el dashboard: la primera vez el servidor crea el grupo "Todos", y la lista de
        // grupos tiene que pedirse después para incluirlo.
        const [resDashboard, resCatalogo] = await Promise.all([getDashboard(), getCatalogo()]);
        const resGrupos = await listCharts();
        setRangos(resCatalogo.data.rangos);
        setGrupos(new Map(resGrupos.data.charts.map((g) => [g._id, g])));
        setWidgets(resDashboard.data.dashboard.widgets);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar tu progreso.');
      }
    };
    cargar();
  }, []);

  // El progreso de todo el historial, solo si algún widget lo usa.
  const usaGeneral = widgets?.some((w) => w.tipo === 'progresoTotal' || w.tipo === 'sesionesTotales');
  useEffect(() => {
    if (!usaGeneral) return;
    let montado = true;
    getProgress()
      .then((res) => montado && setGeneral({ progreso: res.data.progreso, error: false }))
      .catch(() => montado && setGeneral({ progreso: null, error: true }));
    return () => {
      montado = false;
    };
  }, [usaGeneral]);

  // Datos compartidos: actividad (Sesiones, Racha y Frecuencia), récords y última sesión.
  const actividad = useCarga(widgets?.some((w) => TIPOS_ACTIVIDAD.includes(w.tipo)), cargarActividad);
  const records = useCarga(widgets?.some((w) => w.tipo === 'nuevosRecords'), cargarRecords);
  const ultima = useCarga(widgets?.some((w) => w.tipo === 'ultimaSesion'), cargarUltima);

  // Cambiar el rango de un grupo: se ve al momento y se guarda en el servidor. Si falla, vuelve
  // al rango anterior y se avisa.
  const cambiarRango = async (widgetId, rango) => {
    const anteriores = widgets;
    const nuevos = widgets.map((w) => (w._id === widgetId ? { ...w, rango } : w));
    setWidgets(nuevos);
    setErrorGuardar('');
    try {
      const res = await updateDashboard(nuevos);
      setWidgets(res.data.dashboard.widgets);
    } catch {
      setWidgets(anteriores);
      setErrorGuardar('No se ha podido guardar el rango. Inténtalo de nuevo.');
    }
  };

  // Un widget de grupo cuyo grupo no está en la lista (borrado en otra pestaña) no se pinta.
  const visibles = widgets?.filter((w) => w.tipo !== 'grupo' || grupos.has(w.chartId)) ?? [];
  const conFilas = visibles.map((w) => (filasDesplegadas[w._id] ? { ...w, filas: filasDesplegadas[w._id] } : w));
  const { colocados } = colocarWidgets(widgets ? conFilas : ESQUELETO, columnas);

  const pintar = (widget) => {
    if (widget.tipo === 'grupo') {
      return (
        <WidgetGrupo
          grupo={grupos.get(widget.chartId)}
          rango={widget.rango}
          rangos={rangos}
          onCambiarRango={(rango) => cambiarRango(widget._id, rango)}
          onCambiarFilas={(filas) => cambiarFilas(widget._id, filas)}
        />
      );
    }
    switch (widget.tipo) {
      case 'progresoTotal':
        return <WidgetCifra tipo="progresoTotal" progreso={general.progreso} error={general.error} />;
      case 'sesionesTotales':
        return <WidgetCifra tipo="sesionesTotales" progreso={general.progreso} error={general.error} mes={actividad.datos?.mes ?? null} />;
      case 'racha':
        return <WidgetRacha actividad={actividad.datos} error={actividad.error} />;
      case 'frecuenciaSemanal':
        return <WidgetFrecuencia tamano={widget.tamano} actividad={actividad.datos} error={actividad.error} />;
      case 'ultimaSesion':
        return <WidgetUltimaSesion tamano={widget.tamano} sesion={ultima.datos} error={ultima.error} />;
      case 'nuevosRecords':
        return <WidgetNuevosRecords tamano={widget.tamano} records={records.datos} error={records.error} />;
      default:
        return null; // tipo que este cliente aún no sabe pintar
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        {/* "Inicio", como en el menú: la pantalla ya no es solo el progreso (bloque 9d). */}
        <h1 className={styles.title}>Inicio</h1>
        {/* Hasta el catálogo del modo edición (paso 3), los grupos se siguen creando aquí. */}
        <button type="button" className={styles.newGroupButton} onClick={() => navigate('/groups/new')} aria-label="Nuevo grupo">
          <IconPlus />
          <span className={styles.newGroupButtonLabel}>Nuevo grupo</span>
        </button>
      </header>

      {error && <p className={styles.feedbackError}>{error}</p>}
      {errorGuardar && (
        <p className={styles.errorGuardar} role="alert">
          {errorGuardar}
        </p>
      )}

      {!error && !widgets && (
        <ZonaCarga etiqueta="Cargando tu progreso">
          <div ref={ref} className={styles.reticula} style={{ '--columnas': columnas }}>
            {colocados.map((c) => (
              <div key={c.widget._id} className={styles.celda} style={estiloCelda(c)}>
                <Esqueleto forma="bloque" alto="100%" />
              </div>
            ))}
          </div>
        </ZonaCarga>
      )}

      {widgets && (
        // data-reticula: el grupo desplegado lee de aquí el alto de fila para pedir sus filas.
        <div ref={ref} className={styles.reticula} style={{ '--columnas': columnas }} data-reticula>
          {colocados.map((c) => (
            <div key={c.widget._id} className={styles.celda} style={estiloCelda(c)}>
              {pintar(c.widget)}
            </div>
          ))}
        </div>
      )}

      {widgets && visibles.length === 0 && (
        <p className={styles.vacio}>Tu dashboard está vacío. Crea un grupo para ver su progreso aquí.</p>
      )}
    </div>
  );
}
