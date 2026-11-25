import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { listSessions } from '@/api/sessions.js';
import Button from '@/components/Button/Button.jsx';
import Calendario from '@/components/Calendario/Calendario.jsx';
import { formatDuracion } from '@/utils/formato.js';
import Esqueleto, { ZonaCarga } from '@/components/Esqueleto/Esqueleto.jsx';
import MarcaPR from '@/components/MarcaPR/MarcaPR.jsx';
import AvisoRecords from '@/components/AvisoRecords/AvisoRecords.jsx';
import { listarNombres, recordsDeSesion } from '@/utils/records.js';
import styles from '@/pages/History/History.module.css';

// Formatea fecha + hora en el estilo del historial.
const formatFecha = (fecha) => {
  const d = new Date(fecha);
  const fechaStr = d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const horaStr = d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${fechaStr} · ${horaStr}`;
};

// Suma total de peso × reps de todas las series de la sesión.
const calcularPesoTotal = (sesion) => {
  let total = 0;
  for (const ej of sesion.ejercicios) {
    for (const set of ej.sets) {
      total += (set.peso || 0) * (set.reps || 0);
    }
  }
  return total;
};

// Icono "download" para el botón de exportar. Placeholder en MVP.
const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// Sesión con notas (bloque 11d): una hoja con líneas, de trazo 1.5 como los iconos del tema
// Premium. role="img" con etiqueta: el lector de pantalla dice "Con notas".
const IconNota = () => (
  <svg className={styles.iconoNota} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Con notas">
    <title>Con notas</title>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <polyline points="14 3 14 8 19 8" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="13" y2="17" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Pantalla de historial de sesiones.
// Lista las sesiones completadas del usuario ordenadas por fecha descendente, de 20
// en 20: el botón "Cargar más" pide las siguientes (paginación por cursor, 0027).
// El borrado se hace desde el detalle de cada sesión, no desde esta lista.
export default function History() {
  const navigate = useNavigate();
  const location = useLocation();

  // Récords del entreno que se acaba de terminar (bloque 4b): llegan de ActiveSession en el
  // estado de la navegación. Se copian aquí y se borran de ese estado (replace), para que no
  // vuelvan a salir al recargar la página ni al volver atrás desde el detalle de una sesión.
  const [avisoRecords, setAvisoRecords] = useState(() => location.state?.records ?? []);
  useEffect(() => {
    if (location.state?.records) navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  const [sessions, setSessions] = useState([]);
  // Cursor de la página siguiente; null cuando ya están todas.
  const [siguienteCursor, setSiguienteCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState('');
  // Error al cargar más, separado de `error`: no debe ocultar las sesiones ya cargadas.
  const [errorMas, setErrorMas] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const response = await listSessions();
        setSessions(response.data.sessions);
        setSiguienteCursor(response.data.siguienteCursor);
      } catch (err) {
        const message = err.response?.data?.message || 'Error al cargar el historial.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const cargarMas = async () => {
    setErrorMas('');
    setCargandoMas(true);
    try {
      const response = await listSessions({ cursor: siguienteCursor });
      // Se añaden al final: son más antiguas que las que ya se ven.
      setSessions((actuales) => [...actuales, ...response.data.sessions]);
      setSiguienteCursor(response.data.siguienteCursor);
    } catch (err) {
      setErrorMas(err.response?.data?.message || 'No se han podido cargar más sesiones.');
    } finally {
      setCargandoMas(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header con título y botón de exportar como acción secundaria a la
          derecha. La exportación se implementará en el pulido. */}
      <header className={styles.header}>
        <h1 className={styles.title}>Historial</h1>
        {sessions.length > 0 && (
          <button
            type="button"
            className={styles.exportButton}
            disabled
            title="Próximamente"
            aria-label="Exportar datos"
          >
            <IconDownload />
            <span className={styles.exportButtonLabel}>Exportar datos</span>
          </button>
        )}
      </header>

      {avisoRecords.length > 0 && (
        <AvisoRecords records={avisoRecords} onCerrar={() => setAvisoRecords([])} />
      )}

      {/* Días entrenados (bloque 8): vista de mes o de año, arriba de la lista. En escritorio
          va en dos columnas (bloque 8b). */}
      {!loading && !error && sessions.length > 0 && <Calendario />}

      {/* Mientras llegan las sesiones: cuatro tarjetas con la forma de las de verdad. */}
      {loading && (
        <ZonaCarga etiqueta="Cargando el historial" className={styles.list}>
          {[40, 34, 46, 38].map((ancho) => (
            <div key={ancho} className={`${styles.card} glassCard`}>
              <div className={styles.cardText}>
                <Esqueleto ancho={`${ancho}%`} alto="1rem" />
                <Esqueleto ancho="60%" alto="0.75rem" />
              </div>
              <Esqueleto ancho="64px" />
            </div>
          ))}
        </ZonaCarga>
      )}

      {error && <p className={styles.feedbackError}>{error}</p>}

      {!loading && !error && sessions.length === 0 && (
        <div className={styles.emptyState}>
          <p>Aún no has terminado ninguna sesión.</p>
          <p className={styles.emptyHint}>
            Empieza una desde la sección de Entrenamiento.
          </p>
        </div>
      )}

      {!loading && !error && sessions.length > 0 && (
        <div className={styles.list}>
          {sessions.map((sesion) => {
            // Récords de la sesión (bloque 4b): la marca junto al nombre y, debajo, en qué
            // ejercicios. Los marca el servidor; aquí solo se leen.
            const records = recordsDeSesion(sesion);
            return (
            <button
              type="button"
              key={sesion._id}
              className={`${styles.card} glassCard`}
              onClick={() => navigate(`/history/${sesion._id}`)}
            >
              <div className={styles.cardText}>
                <span className={styles.cardTitulo}>
                  <span className={styles.cardName}>{sesion.nombre}</span>
                  {records.length > 0 && <MarcaPR />}
                  {sesion.notas && <IconNota />}
                </span>
                <span className={styles.cardDate}>{formatFecha(sesion.fecha)}</span>
              </div>
              <div className={styles.cardStats}>
                <span className={styles.stat}>
                  {formatDuracion(sesion.duracionSegundos)}
                </span>
                <span className={styles.stat}>
                  {calcularPesoTotal(sesion).toLocaleString('es-ES')} kg
                </span>
              </div>
              <span className={styles.chevron}>
                <IconChevronRight />
              </span>
              {/* En una fila propia, a todo el ancho de la tarjeta: al lado de las cifras no
                  cabía ni un nombre en el móvil. */}
              {records.length > 0 && (
                <span className={styles.cardRecords}>
                  {records.length === 1 ? 'Récord en ' : 'Récords en '}
                  {listarNombres(records.map((r) => r.nombre))}
                </span>
              )}
            </button>
            );
          })}
        </div>
      )}

      {errorMas && <p className={styles.feedbackError}>{errorMas}</p>}

      {!loading && !error && siguienteCursor && (
        <div className={styles.cargarMas}>
          <Button variant="outline" onClick={cargarMas} disabled={cargandoMas}>
            {cargandoMas ? 'Cargando...' : 'Cargar más'}
          </Button>
        </div>
      )}
    </div>
  );
}