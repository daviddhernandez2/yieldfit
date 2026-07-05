import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSession, deleteSession } from '../../api/sessions.js';
import DeleteButton from '../../components/DeleteButton/DeleteButton.jsx';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx';
import styles from './SessionDetail.module.css';

const formatDuracion = (segundos) => {
  const totalMin = Math.floor(segundos / 60);
  if (totalMin < 60) return `${totalMin} min`;
  const horas = Math.floor(totalMin / 60);
  const minutos = totalMin % 60;
  return `${horas}h ${minutos} min`;
};

// Formatea fecha + hora: "sábado, 16 de mayo de 2026 · 18:34".
// Se mantiene en minúsculas para coherencia con el resto de textos de fecha
// de la app, en línea con el uso natural del español.
const formatFecha = (fecha) => {
  const d = new Date(fecha);
  const fechaStr = d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const horaStr = d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${fechaStr} · ${horaStr}`;
};

// Icono chevron-left para el botón de volver, alineado con el
// estilo de iconografía del resto de la app.
const IconChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

// Detalle de una sesión pasada. Solo lectura.
// Los datos vienen del backend con snapshots (nombreSnapshot del ejercicio),
// así que aunque el ejercicio original haya sido renombrado o borrado,
// el detalle sigue mostrando lo que hiciste ese día.
export default function SessionDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const response = await getSession(id);
        setSession(response.data.session);
      } catch (err) {
        const message = err.response?.data?.message || 'No se pudo cargar la sesión.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id]);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteSession(id);
      navigate('/history');
    } catch (err) {
      const message = err.response?.data?.message || 'Error al eliminar la sesión.';
      setError(message);
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <p className={styles.feedback}>Cargando...</p>;
  if (error) return <p className={styles.feedbackError}>{error}</p>;
  if (!session) return null;

  const pesoTotal = session.ejercicios.reduce((total, ej) => {
    return total + ej.sets.reduce((sub, set) => sub + (set.peso || 0) * (set.reps || 0), 0);
  }, 0);

  const totalSets = session.ejercicios.reduce((n, ej) => n + ej.sets.length, 0);

  return (
    <div className={styles.page}>
      {/* Header: título + fecha a la izquierda, botón atrás a la derecha.
          Se invierte respecto al patrón habitual porque el foco principal
          en esta vista es el nombre de la sesión, no la navegación. */}
      {/* Header: botón atrás delante, título y fecha a la derecha del botón.
          Es un patrón más convencional para pantallas de detalle: la
          navegación queda pegada al inicio de la línea de lectura. */}
      <header className={styles.header}>
        <button
          type="button"
          onClick={() => navigate('/history')}
          className={styles.backButton}
          aria-label="Volver al historial"
        >
          <IconChevronLeft />
        </button>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{session.nombre}</h1>
          <p className={styles.subtitle}>{formatFecha(session.fecha)}</p>
        </div>
      </header>

      <div className={styles.statsRow}>
        <div className={`${styles.statBox} glassCard`}>
          <span className={styles.statLabel}>Duración</span>
          <span className={styles.statValue}>{formatDuracion(session.duracionSegundos)}</span>
        </div>
        <div className={`${styles.statBox} glassCard`}>
          <span className={styles.statLabel}>Peso total</span>
          <span className={styles.statValue}>{pesoTotal.toLocaleString('es-ES')} kg</span>
        </div>
        <div className={`${styles.statBox} glassCard`}>
          <span className={styles.statLabel}>Series</span>
          <span className={styles.statValue}>{totalSets}</span>
        </div>
      </div>

      <div className={styles.exercisesList}>
        {session.ejercicios.map((ej) => (
          <div key={ej._id} className={`${styles.exerciseCard} glassCard`}>
            <h2 className={styles.exerciseName}>{ej.nombreSnapshot}</h2>

            <div className={styles.setsTable}>
              <div className={styles.setsHeader}>
                <span>Serie</span>
                <span>Peso (kg)</span>
                <span>Reps</span>
              </div>
              {ej.sets.map((set) => (
                <div key={set._id} className={styles.setsRow}>
                  <span className={styles.setNum}>{set.numeroSerie}</span>
                  <span className={styles.setValue}>{set.peso}</span>
                  <span className={styles.setValue}>{set.reps}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Acción destructiva discreta al final, alineada a la derecha.
          Usa el DeleteButton estándar de la app en lugar del antiguo botón
          rojo grande, mucho más agresivo visualmente. */}
      <div className={styles.deleteWrapper}>
        <DeleteButton onClick={() => setConfirmOpen(true)} disabled={deleting}>
          Eliminar sesión
        </DeleteButton>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Eliminar esta sesión?"
        message={`"${session.nombre}" del ${formatFecha(session.fecha)} se eliminará permanentemente.`}
        confirmLabel={deleting ? 'Eliminando...' : 'Eliminar'}
        cancelLabel="Cancelar"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}