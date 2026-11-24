import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listCharts } from '@/api/charts.js';
import { getCatalogo, getDashboard, updateDashboard } from '@/api/dashboard.js';
import { getProgress } from '@/api/progress.js';
import Esqueleto, { ZonaCarga } from '@/components/Esqueleto/Esqueleto.jsx';
import useColumnasDashboard from '@/hooks/useColumnasDashboard.js';
import WidgetCifra from '@/pages/Dashboard/widgets/WidgetCifra.jsx';
import WidgetGrupo from '@/pages/Dashboard/widgets/WidgetGrupo.jsx';
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

// Silueta mientras carga: el dashboard por defecto (P P, un G y un M), en la misma retícula.
const ESQUELETO = [
  { _id: 'e1', tamano: 'P' },
  { _id: 'e2', tamano: 'P' },
  { _id: 'e3', tamano: 'G' },
  { _id: 'e4', tamano: 'M' },
];

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
    if (widget.tipo === 'progresoTotal' || widget.tipo === 'sesionesTotales') {
      return <WidgetCifra tipo={widget.tipo} progreso={general.progreso} error={general.error} />;
    }
    return null; // tipo que este cliente aún no sabe pintar
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Progreso</h1>
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
