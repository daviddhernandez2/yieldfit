import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listWorkouts, deleteWorkout } from '../../api/workouts.js';
import Button from '../../components/Button/Button.jsx';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx';
import styles from './Workouts.module.css';

// Genera un badge de 2 letras a partir del nombre de la rutina.
// Por ejemplo "Push" → "PU", "Día de empuje" → "DE".
// Se basa en las palabras del nombre para que reflejen el contenido visualmente.
const generarBadge = (nombre) => {
  const palabras = nombre.trim().split(/\s+/);
  if (palabras.length === 1) {
    return palabras[0].slice(0, 2).toUpperCase();
  }
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
};

// Icono inline de papelera. Igual que en Exercises para coherencia visual.
const IconTrash = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

// Pantalla principal de rutinas. Muestra una lista de cards y permite
// crear nuevas, editar existentes (click en card) o eliminarlas (icono papelera).
export default function Workouts() {
  const navigate = useNavigate();

  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [workoutToDelete, setWorkoutToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      setError('');
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
  }, [refreshKey]);

  const handleAskDelete = (workout, e) => {
    e.stopPropagation();
    setWorkoutToDelete(workout);
  };

  const handleConfirmDelete = async () => {
    if (!workoutToDelete) return;
    setDeleting(true);
    try {
      await deleteWorkout(workoutToDelete._id);
      setWorkoutToDelete(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      const message = err.response?.data?.message || 'Error al eliminar la rutina.';
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Entrenamiento</h1>
        <button
          type="button"
          className={styles.addButton}
          onClick={() => navigate('/workouts/new')}
          aria-label="Nueva rutina"
        >
          +
        </button>
      </header>

      {loading && <p className={styles.feedback}>Cargando...</p>}

      {error && <p className={styles.feedbackError}>{error}</p>}

      {!loading && !error && workouts.length === 0 && (
        <div className={styles.emptyState}>
          <p>Aún no tienes rutinas.</p>
          <p className={styles.emptyHint}>Crea tu primera para empezar a entrenar.</p>
        </div>
      )}

      {!loading && !error && workouts.length > 0 && (
        <div className={styles.list}>
          {workouts.map((wo) => (
            <div key={wo._id} className={styles.card}>
              <button
                type="button"
                className={styles.cardMain}
                onClick={() => navigate(`/workouts/${wo._id}/edit`)}
              >
                <span className={styles.badge}>{generarBadge(wo.nombre)}</span>
                <span className={styles.cardName}>{wo.nombre}</span>
              </button>
              <button
                type="button"
                className={styles.deleteIcon}
                onClick={(e) => handleAskDelete(wo, e)}
                aria-label={`Eliminar ${wo.nombre}`}
              >
                <IconTrash />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(workoutToDelete)}
        title="¿Eliminar esta rutina?"
        message={
          workoutToDelete
            ? `"${workoutToDelete.nombre}" se eliminará. Las sesiones basadas en ella no se verán afectadas.`
            : ''
        }
        confirmLabel={deleting ? 'Eliminando...' : 'Eliminar'}
        cancelLabel="Cancelar"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setWorkoutToDelete(null)}
      />
    </div>
  );
}