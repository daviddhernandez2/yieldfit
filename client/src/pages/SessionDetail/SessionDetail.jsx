import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSession, deleteSession } from '../../api/sessions.js';
import Button from '../../components/Button/Button.jsx';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx';
import styles from './SessionDetail.module.css';

const formatDuracion = (segundos) => {
  const totalMin = Math.floor(segundos / 60);
  if (totalMin < 60) return `${totalMin} min`;
  const horas = Math.floor(totalMin / 60);
  const minutos = totalMin % 60;
  return `${horas}h ${minutos} min`;
};

// Formatea fecha + hora: "Sábado, 16 de mayo de 2026 · 18:34"
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

  // Cálculos para las métricas del header.
  const pesoTotal = session.ejercicios.reduce((total, ej) => {
    return total + ej.sets.reduce((sub, set) => sub + (set.peso || 0) * (set.reps || 0), 0);
  }, 0);

  const totalSets = session.ejercicios.reduce((n, ej) => n + ej.sets.length, 0);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          type="button"
          onClick={() => navigate('/history')}
          className={styles.backButton}
          aria-label="Volver"
        >
          ←
        </button>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{session.nombre}</h1>
          <p className={styles.subtitle}>{formatFecha(session.fecha)}</p>
        </div>
      </header>

      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Duración</span>
          <span className={styles.statValue}>{formatDuracion(session.duracionSegundos)}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Peso total</span>
          <span className={styles.statValue}>{pesoTotal.toLocaleString('es-ES')} kg</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Series</span>
          <span className={styles.statValue}>{totalSets}</span>
        </div>
      </div>

      <div className={styles.exercisesList}>
        {session.ejercicios.map((ej) => (
          <div key={ej._id} className={styles.exerciseCard}>
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

      <Button
        type="button"
        variant="danger"
        fullWidth
        onClick={() => setConfirmOpen(true)}
        disabled={deleting}
      >
        Eliminar sesión
      </Button>

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