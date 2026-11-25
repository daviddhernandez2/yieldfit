import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { listCharts } from '@/api/charts.js';
import { getCatalogo, getDashboard, updateDashboard } from '@/api/dashboard.js';
import { getActividad } from '@/api/estadisticas.js';
import { getProgress } from '@/api/progress.js';
import { getRecordsRecientes, listSessions } from '@/api/sessions.js';
import { getResumenRutinas } from '@/api/workouts.js';
import Button from '@/components/Button/Button.jsx';
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog.jsx';
import GrupoBotones from '@/components/GrupoBotones/GrupoBotones.jsx';
import Esqueleto, { ZonaCarga } from '@/components/Esqueleto/Esqueleto.jsx';
import useColumnasDashboard from '@/hooks/useColumnasDashboard.js';
import { useActiveSession } from '@/hooks/useActiveSession.js';
import { useAvisoSalir } from '@/hooks/useAvisoSalir.js';
import { useStartSession } from '@/hooks/useStartSession.js';
import WidgetCifra from '@/pages/Dashboard/widgets/WidgetCifra.jsx';
import WidgetEmpezarRutina from '@/pages/Dashboard/widgets/WidgetEmpezarRutina.jsx';
import WidgetFrecuencia from '@/pages/Dashboard/widgets/WidgetFrecuencia.jsx';
import WidgetGrupo from '@/pages/Dashboard/widgets/WidgetGrupo.jsx';
import WidgetNuevosRecords from '@/pages/Dashboard/widgets/WidgetNuevosRecords.jsx';
import WidgetRacha from '@/pages/Dashboard/widgets/WidgetRacha.jsx';
import WidgetRecordEjercicio from '@/pages/Dashboard/widgets/WidgetRecordEjercicio.jsx';
import WidgetUltimaSesion from '@/pages/Dashboard/widgets/WidgetUltimaSesion.jsx';
import CatalogoWidgets from '@/pages/Dashboard/CatalogoWidgets.jsx';
import CeldaEditable from '@/pages/Dashboard/CeldaEditable.jsx';
import { hayCambios } from '@/utils/cambios.js';
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
} from '@/utils/edicionDashboard.js';
import { limpiarPreferenciasAntiguas } from '@/utils/grupos.js';
import { colocarWidgets } from '@/utils/reticula.js';
import styles from '@/pages/Dashboard/Dashboard.module.css';

// Lápiz del botón "Editar" de la cabecera (trazo 1.5, como los iconos del tema Premium).
const IconLapiz = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

// Al arrastrar, los demás widgets NO se desplazan mientras tanto (con tamaños distintos darían
// saltos: al moverse uno, el puntero queda sobre otro). Se marca el destino y se recoloca al
// soltar. Una estrategia de dnd-kit que no mueve nada.
const sinDesplazar = () => null;

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

const TIPOS_ACTIVIDAD = ['racha', 'frecuenciaSemanal'];
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
// edición solo se mira; el rango de cada grupo sí se cambia aquí, y se guarda al momento.
//
// Modo edición (paso 3c, tarjeta "Editar dashboard" del design system): "Editar" copia los
// widgets a un BORRADOR (utils/edicionDashboard.js) y todo se hace sobre él: mover, cambiar de
// tamaño, quitar y añadir desde el catálogo. "Hecho" lo guarda de una vez (PUT /api/dashboard);
// "Cancelar" lo tira, preguntando si había cambios. Salir de la página con cambios, también.
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
  // Catálogo de widgets del servidor (tipos, tamaños, rangos, campos de referencia).
  const [catalogo, setCatalogo] = useState(null);
  // Modo edición: el borrador, la foto de cómo estaba al entrar (para saber si hay cambios),
  // dónde se inserta lo que se añada (null: catálogo cerrado) y qué se está arrastrando.
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState([]);
  const [inicial, setInicial] = useState(null);
  const [insertarEn, setInsertarEn] = useState(null);
  const [arrastrando, setArrastrando] = useState(null);
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const conCambios = editando && hayCambios(inicial, borrador);
  const aviso = useAvisoSalir(conCambios);
  const sensores = useSensors(
    // distance: hay que mover 4 px antes de que empiece el arrastre (un toque sin querer no mueve).
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  // Empezar rutina (bloque 9d): el mismo flujo que en Rutinas. Si hay otra sesión en curso,
  // pregunta antes con su diálogo, que va aquí y no dentro de la tarjeta del widget.
  const { start, conflicto, confirmarDescartar, cancelarConflicto, error: errorEmpezar } = useStartSession();
  const activa = useActiveSession();

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
        setCatalogo(resCatalogo.data);
        setGrupos(new Map(resGrupos.data.charts.map((g) => [g._id, g])));
        setWidgets(resDashboard.data.dashboard.widgets);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar tu progreso.');
      }
    };
    cargar();
  }, []);

  // Lo que se ve: el borrador mientras se edita (así lo que se añade ya pide sus datos).
  const lista = editando ? borrador : widgets;

  // El progreso de todo el historial, solo si algún widget lo usa.
  const usaGeneral = lista?.some((w) => w.tipo === 'progresoTotal' || w.tipo === 'sesionesTotales');
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

  // Datos compartidos: actividad (Racha y Frecuencia), récords y última sesión.
  const actividad = useCarga(lista?.some((w) => TIPOS_ACTIVIDAD.includes(w.tipo)), cargarActividad);
  const records = useCarga(lista?.some((w) => w.tipo === 'nuevosRecords'), cargarRecords);
  const ultima = useCarga(lista?.some((w) => w.tipo === 'ultimaSesion'), cargarUltima);

  // Resumen de las rutinas de los widgets "Empezar rutina", todas en una petición. Se vuelve a
  // pedir solo si cambian las rutinas (la clave es la lista de ids, no el array de widgets).
  const idsRutinas = [...new Set((lista ?? []).filter((w) => w.tipo === 'empezarRutina').map((w) => w.workoutId))].join(',');
  const [rutinas, setRutinas] = useState({ datos: undefined, error: false });
  useEffect(() => {
    if (!idsRutinas) return;
    let montado = true;
    getResumenRutinas(idsRutinas.split(','))
      .then((res) => montado && setRutinas({ datos: res.data.resumenes, error: false }))
      .catch(() => montado && setRutinas({ datos: undefined, error: true }));
    return () => {
      montado = false;
    };
  }, [idsRutinas]);

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
  // Editando, sin grupos desplegados: cada widget en su tamaño, y con sus huecos.
  const { colocados, huecos } = colocarWidgets(editando ? borrador : widgets ? conFilas : ESQUELETO, columnas);

  // --- Modo edición ---
  const definicion = (tipo) => catalogo?.catalogo.find((d) => d.tipo === tipo);
  // Nombre de un widget para el lector de pantalla ("Mover Racha", "Quitar Empuje").
  const nombreDe = (w) => (w.tipo === 'grupo' ? grupos.get(w.chartId)?.nombre : null) ?? definicion(w.tipo)?.nombre ?? w.tipo;

  const entrarEnEdicion = () => {
    const copia = empezarBorrador(visibles);
    setBorrador(copia);
    setInicial(copia);
    setErrorGuardar('');
    setEditando(true);
  };
  const salirDeEdicion = () => {
    setEditando(false);
    setInsertarEn(null);
    setConfirmarCancelar(false);
  };
  const cancelarEdicion = () => (conCambios ? setConfirmarCancelar(true) : salirDeEdicion());
  const guardarEdicion = async () => {
    setGuardando(true);
    setErrorGuardar('');
    try {
      const res = await updateDashboard(paraGuardar(borrador));
      setWidgets(res.data.dashboard.widgets);
      salirDeEdicion();
    } catch (err) {
      setErrorGuardar(err.response?.data?.message || 'No se han podido guardar los cambios. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };
  // Del catálogo: el widget nuevo, en su tamaño por defecto, donde se pidió (al final o en un hueco).
  const anadir = (def, referencia) => {
    const nuevo = nuevoWidget(def, referencia, catalogo.camposReferencia, crypto.randomUUID());
    if (def.conRango) nuevo.rango = catalogo.rangoPorDefecto;
    setBorrador((b) => insertarWidget(b, nuevo, insertarEn));
    setInsertarEn(null);
  };
  const alSoltar = ({ active, over }) => {
    setArrastrando(null);
    if (over && active.id !== over.id) setBorrador((b) => moverWidget(b, active.id, over.id));
  };
  const posicion = (id) => `${borrador.findIndex((w) => w._id === id) + 1} de ${borrador.length}`;
  const nombrePorId = (id) => nombreDe(borrador.find((w) => w._id === id) ?? {});
  const anuncios = {
    onDragStart: ({ active }) => `Has cogido «${nombrePorId(active.id)}», posición ${posicion(active.id)}.`,
    onDragOver: ({ active, over }) => (over ? `«${nombrePorId(active.id)}» iría a la posición ${posicion(over.id)}.` : undefined),
    onDragEnd: ({ active, over }) => (over ? `«${nombrePorId(active.id)}» queda en la posición ${posicion(over.id)}.` : `«${nombrePorId(active.id)}» no se ha movido.`),
    onDragCancel: ({ active }) => `Cancelado. «${nombrePorId(active.id)}» vuelve a su sitio.`,
  };
  const lleno = catalogo && borrador.length >= catalogo.maxWidgets;
  const widgetArrastrado = arrastrando ? borrador.find((w) => w._id === arrastrando) : null;

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
        return <WidgetCifra tipo="sesionesTotales" progreso={general.progreso} error={general.error} />;
      case 'racha':
        return <WidgetRacha tamano={widget.tamano} actividad={actividad.datos} error={actividad.error} />;
      case 'frecuenciaSemanal':
        return <WidgetFrecuencia tamano={widget.tamano} actividad={actividad.datos} error={actividad.error} />;
      case 'ultimaSesion':
        return <WidgetUltimaSesion tamano={widget.tamano} sesion={ultima.datos} error={ultima.error} />;
      case 'nuevosRecords':
        return <WidgetNuevosRecords tamano={widget.tamano} records={records.datos} error={records.error} />;
      case 'recordEjercicio':
        return <WidgetRecordEjercicio tamano={widget.tamano} exerciseId={widget.exerciseId} />;
      case 'empezarRutina': {
        // Minutos de la sesión en curso, si es de esta rutina (se recalcula al volver a pintar).
        const enCurso =
          activa?.workoutId === widget.workoutId ? Math.floor((Date.now() - activa.startTime) / 60000) : null;
        return (
          <WidgetEmpezarRutina
            tamano={widget.tamano}
            // undefined mientras carga; null si la rutina ya no viene (se borró en otra pestaña).
            resumen={rutinas.datos === undefined ? undefined : (rutinas.datos[widget.workoutId] ?? null)}
            error={rutinas.error}
            enCurso={enCurso}
            onEmpezar={() => start(widget.workoutId)}
            onContinuar={() => navigate('/sessions/active')}
          />
        );
      }
      default:
        return null; // tipo que este cliente aún no sabe pintar
    }
  };

  return (
    <div className={styles.page}>
      <header className={`${styles.header} ${editando ? styles.headerEditando : ''}`}>
        {/* "Inicio", como en el menú: la pantalla ya no es solo el progreso (bloque 9d). */}
        <h1 className={styles.title}>{editando ? 'Editar inicio' : 'Inicio'}</h1>
        {editando ? (
          <div className={styles.accionesEdicion}>
            <GrupoBotones>
              <Button variant="ghost" size="sm" onClick={cancelarEdicion}>
                Cancelar
              </Button>
              <Button size="sm" onClick={guardarEdicion} disabled={guardando}>
                {guardando ? 'Guardando…' : 'Hecho'}
              </Button>
            </GrupoBotones>
          </div>
        ) : (
          widgets && (
            // Crear grupos pasa al catálogo del modo edición (Grupo de progreso → Crear grupo nuevo).
            <button type="button" className={styles.botonEditar} onClick={entrarEnEdicion} aria-label="Editar inicio">
              <IconLapiz />
              <span className={styles.botonEditarTexto}>Editar</span>
            </button>
          )
        )}
      </header>

      {error && <p className={styles.feedbackError}>{error}</p>}
      {(errorGuardar || errorEmpezar) && (
        <p className={styles.errorGuardar} role="alert">
          {errorGuardar || errorEmpezar}
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

      {editando && (
        <>
          <DndContext
            sensors={sensores}
            collisionDetection={closestCenter}
            onDragStart={({ active }) => setArrastrando(active.id)}
            onDragEnd={alSoltar}
            onDragCancel={() => setArrastrando(null)}
            accessibility={{
              announcements: anuncios,
              screenReaderInstructions: {
                draggable: 'Para mover este widget, pulsa espacio, usa las flechas y vuelve a pulsar espacio para soltarlo. Escape cancela.',
              },
            }}
          >
            <SortableContext items={borrador.map((w) => w._id)} strategy={sinDesplazar}>
              <div ref={ref} className={styles.reticula} style={{ '--columnas': columnas }} data-reticula>
                {colocados.map((c) => (
                  <CeldaEditable
                    key={c.widget._id}
                    id={c.widget._id}
                    nombre={nombreDe(c.widget)}
                    tamano={c.widget.tamano}
                    tamanos={definicion(c.widget.tipo)?.tamanos ?? [c.widget.tamano]}
                    estilo={estiloCelda(c)}
                    onTamano={(t) => setBorrador((b) => cambiarTamano(b, c.widget._id, t))}
                    onQuitar={() => setBorrador((b) => quitarWidget(b, c.widget._id))}
                  >
                    {pintar(c.widget)}
                  </CeldaEditable>
                ))}
                {/* Celdas que ningún widget cubre: se pueden dejar (se guardan así) o rellenar. */}
                {huecos.map((h) => (
                  <div key={`${h.fila}-${h.columna}`} className={styles.hueco} style={estiloCelda({ ...h, ancho: 1, alto: 1 })}>
                    <span>Hueco libre</span>
                    {!lleno && (
                      <button type="button" className={styles.anadirHueco} onClick={() => setInsertarEn(indiceParaHueco(colocados, h))}>
                        + Añadir
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </SortableContext>
            {/* La copia que sigue al dedo o al ratón; el original deja su sitio marcado. */}
            <DragOverlay>{widgetArrastrado && <div className={styles.levantado}>{pintar(widgetArrastrado)}</div>}</DragOverlay>
          </DndContext>
          {lleno ? (
            <p className={styles.vacio}>Tu inicio está lleno: como mucho {catalogo.maxWidgets} widgets.</p>
          ) : (
            <button type="button" className={styles.anadirWidget} onClick={() => setInsertarEn(borrador.length)}>
              + Añadir widget
            </button>
          )}
        </>
      )}

      {widgets && !editando && (
        // data-reticula: el grupo desplegado lee de aquí el alto de fila para pedir sus filas.
        <div ref={ref} className={styles.reticula} style={{ '--columnas': columnas }} data-reticula>
          {colocados.map((c) => (
            <div key={c.widget._id} className={styles.celda} style={estiloCelda(c)}>
              {pintar(c.widget)}
            </div>
          ))}
        </div>
      )}

      {widgets && !editando && visibles.length === 0 && (
        <p className={styles.vacio}>Tu inicio está vacío. Pulsa Editar para añadir widgets.</p>
      )}

      {insertarEn !== null && catalogo && (
        <CatalogoWidgets
          catalogo={catalogo.catalogo}
          yaPuestos={tiposYaPuestos(borrador, catalogo.catalogo)}
          gruposPuestos={gruposYaPuestos(borrador)}
          grupos={grupos}
          onElegir={anadir}
          onCerrar={() => setInsertarEn(null)}
        />
      )}

      <ConfirmDialog
        open={confirmarCancelar}
        title="¿Descartar los cambios?"
        message="Has cambiado tu inicio. Si cancelas, los cambios se pierden."
        confirmLabel="Descartar cambios"
        cancelLabel="Seguir editando"
        confirmVariant="danger"
        onConfirm={salirDeEdicion}
        onCancel={() => setConfirmarCancelar(false)}
      />
      {/* Salir de la página con cambios sin guardar (el menú, atrás, Crear grupo nuevo…). */}
      <ConfirmDialog {...aviso.dialogo} />

      {/* El mismo aviso que en Rutinas al empezar con otra sesión en curso. */}
      <ConfirmDialog
        open={conflicto}
        title="¿Descartar la sesión activa?"
        message="Tienes una sesión de entrenamiento sin terminar. Si continúas, la perderás."
        confirmLabel="Descartar y empezar nueva"
        cancelLabel="Cancelar"
        confirmVariant="danger"
        onConfirm={confirmarDescartar}
        onCancel={cancelarConflicto}
      />
    </div>
  );
}
