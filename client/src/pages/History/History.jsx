import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listSessions } from '../../api/sessions.js';
import styles from './History.module.css';

// Formatea segundos como "1h 24 min" o "24 min" según duración.
const formatDuracion = (segundos) => {
  const totalMin = Math.floor(segundos / 60);
  if (totalMin < 60) return `${totalMin} min`;
  const horas = Math.floor(totalMin / 60);
  const minutos = totalMin % 60;
  return `${horas}h ${minutos} min`;
};

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

const IconChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Pantalla de historial de sesiones.
// Lista las sesiones completadas del usuario ordenadas por fecha descendente.
// El borrado se hace desde el detalle de cada sesión, no desde esta lista.
export default function History() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const response = await listSessions();
        setSessions(response.data.sessions);
      } catch (err) {
        const message = err.response?.data?.message || 'Error al cargar el historial.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

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

      {loading && <p className={styles.feedback}>Cargando...</p>}

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
          {sessions.map((sesion) => (
            <button
              type="button"
              key={sesion._id}
              className={`${styles.card} glassCard`}
              onClick={() => navigate(`/history/${sesion._id}`)}
            >
              <div className={styles.cardText}>
                <span className={styles.cardName}>{sesion.nombre}</span>
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
            </button>
          ))}
        </div>
      )}
    </div>
  );
}