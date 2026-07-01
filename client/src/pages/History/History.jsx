import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listSessions, deleteSession } from '../../api/sessions.js';
import Button from '../../components/Button/Button.jsx';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx';
import styles from './History.module.css';

// Formatea segundos como "1h 24 min" o "24 min" según duración.
const formatDuracion = (segundos) => {
  const totalMin = Math.floor(segundos / 60);
  if (totalMin < 60) return `${totalMin} min`;
  const horas = Math.floor(totalMin / 60);
  const minutos = totalMin % 60;
  return `${horas}h ${minutos} min`;
};

// Formatea la fecha como "Sábado, 16 may 2026".
// Locale es-ES con formato largo del día, sin año redundante si el mes lo aclara.
// Formatea fecha + hora: "Sábado, 16 may 2026 · 18:34"
// La hora ayuda a recordar en qué momento del día se entrenó.
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
// Ignora sets con peso=0 (típicamente peso corporal), donde el "volumen kg" no aplica.
const calcularPesoTotal = (sesion) => {
  let total = 0;
  for (const ej of sesion.ejercicios) {
    for (const set of ej.sets) {
      total += (set.peso || 0) * (set.reps || 0);
    }
  }
  return total;
};

const IconTrash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Pantalla de historial de sesiones.
// Lista las sesiones completadas del usuario ordenadas por fecha descendente.
// Cada card muestra métricas resumen (duración, peso total) y permite navegar al detalle.
export default function History() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      setError('');
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
  }, [refreshKey]);

  const handleAskDelete = (sesion, e) => {
    e.stopPropagation();
    setSessionToDelete(sesion);
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    setDeleting(true);
    try {
      await deleteSession(sessionToDelete._id);
      setSessionToDelete(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      const message = err.response?.data?.message || 'Error al eliminar la sesión.';
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Historial</h1>
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
            <div key={sesion._id} className={styles.card}>
              <button
                type="button"
                className={styles.cardMain}
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
              <button
                type="button"
                className={styles.deleteIcon}
                onClick={(e) => handleAskDelete(sesion, e)}
                aria-label={`Eliminar sesión ${sesion.nombre}`}
              >
                <IconTrash />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botones de features previstas para pulido. Deshabilitados por ahora. */}
      {!loading && !error && sessions.length > 0 && (
        <div className={styles.futureActions}>
          <Button variant="outline" disabled title="Próximamente">
            Exportar datos
          </Button>
          <Button variant="outline" disabled title="Próximamente">
            Ver calendario
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(sessionToDelete)}
        title="¿Eliminar esta sesión?"
        message={
          sessionToDelete
            ? `"${sessionToDelete.nombre}" del ${formatFecha(sessionToDelete.fecha)} se eliminará permanentemente.`
            : ''
        }
        confirmLabel={deleting ? 'Eliminando...' : 'Eliminar'}
        cancelLabel="Cancelar"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setSessionToDelete(null)}
      />
    </div>
  );
}