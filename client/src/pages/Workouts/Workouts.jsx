import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listWorkouts } from '@/api/workouts.js';
import { useStartSession } from '@/hooks/useStartSession.js';
import WorkoutActionsModal from '@/components/WorkoutActionsModal/WorkoutActionsModal.jsx';
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog.jsx';
import styles from '@/pages/Workouts/Workouts.module.css';

// Genera un badge de 2 letras a partir del nombre de la rutina.
const generarBadge = (nombre) => {
  const palabras = nombre.trim().split(/\s+/);
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
};

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Pantalla principal de rutinas. Al pulsar una rutina se abre el modal
// de acciones (Editar / Iniciar). El borrado se hace desde el formulario
// de edición, no desde esta lista, para reducir clicks accidentales.
export default function Workouts() {
  const navigate = useNavigate();
  const { start, conflicto, confirmarDescartar, cancelarConflicto, error: startError } =
    useStartSession();

  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const response = await listWorkouts();
        setWorkouts(response.data.workouts);
      } catch (err) {
        const message = err.response?.data?.message || 'Error al cargar las rutinas.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const handleEdit = () => {
    if (!selected) return;
    navigate(`/workouts/${selected._id}/edit`);
    setSelected(null);
  };

  const handleStart = () => {
    if (!selected) return;
    const id = selected._id;
    setSelected(null);
    start(id);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Entrenamiento</h1>
        <button
          type="button"
          className={styles.newButton}
          onClick={() => navigate('/workouts/new')}
          aria-label="Nuevo entrenamiento"
        >
          <IconPlus />
          <span className={styles.newButtonLabel}>Nuevo entrenamiento</span>
        </button>
      </header>

      {loading && <p className={styles.feedback}>Cargando...</p>}

      {(error || startError) && (
        <p className={styles.feedbackError}>{error || startError}</p>
      )}

      {!loading && !error && workouts.length === 0 && (
        <div className={styles.emptyState}>
          <p>Aún no tienes rutinas.</p>
          <p className={styles.emptyHint}>Crea tu primera para empezar a entrenar.</p>
        </div>
      )}

      {!loading && !error && workouts.length > 0 && (
        <div className={styles.list}>
          {workouts.map((wo) => (
            <button
              key={wo._id}
              type="button"
              className={`${styles.card} glassCard`}
              onClick={() => setSelected(wo)}
            >
              <span className={styles.badge}>{generarBadge(wo.nombre)}</span>
              <span className={styles.cardName}>{wo.nombre}</span>
              <span className={styles.chevron}>
                <IconChevronRight />
              </span>
            </button>
          ))}
        </div>
      )}

      <WorkoutActionsModal
        open={Boolean(selected)}
        workout={selected}
        onEdit={handleEdit}
        onStart={handleStart}
        onClose={() => setSelected(null)}
      />

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