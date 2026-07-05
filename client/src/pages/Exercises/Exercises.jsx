import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listExercises, deleteExercise } from '../../api/exercises.js';
import Button from '../../components/Button/Button.jsx';
import Chip from '../../components/Chip/Chip.jsx';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx';
import styles from './Exercises.module.css';

const GRUPOS_MUSCULARES = [
  'Pecho',
  'Espalda',
  'Hombros',
  'Brazos',
  'Piernas',
  'Core',
  'Cardio',
];

// Icono inline de papelera para el botón de borrar de cada fila.
// Inline en lugar de librería para no añadir dependencia por un solo icono.
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

export default function Exercises() {
  const navigate = useNavigate();

  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);

  // Estado del modal de confirmación: guardamos el ejercicio en proceso de borrado.
  // null cuando no hay diálogo abierto.
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Carga la lista. Se vuelve a llamar al cambiar filtros o tras un borrado exitoso.
  // El número incremental refreshKey fuerza recargas explícitas.
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (search) params.search = search;
        if (grupoSeleccionado) params.grupoMuscular = grupoSeleccionado;
        const response = await listExercises(params);
        setExercises(response.data.exercises);
      } catch (err) {
        const message = err.response?.data?.message || 'Error al cargar los ejercicios.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [search, grupoSeleccionado, refreshKey]);

  const handleGrupoClick = (grupo) => {
    setGrupoSeleccionado((actual) => (actual === grupo ? null : grupo));
  };

  // Abre el diálogo con el ejercicio seleccionado. stopPropagation evita que
  // se dispare el onClick de la fila (que navegaría a editar).
  const handleAskDelete = (exercise, e) => {
    e.stopPropagation();
    setExerciseToDelete(exercise);
  };

  const handleConfirmDelete = async () => {
    if (!exerciseToDelete) return;
    setDeleting(true);
    try {
      await deleteExercise(exerciseToDelete._id);
      setExerciseToDelete(null);
      // Forzamos recarga de la lista para reflejar la eliminación.
      setRefreshKey((k) => k + 1);
    } catch (err) {
      const message = err.response?.data?.message || 'Error al eliminar el ejercicio.';
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ejercicios</h1>
      </header>

      <input
        type="text"
        placeholder="Buscar"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={styles.searchInput}
      />

      <div className={styles.filtersScroll}>
        <div className={styles.filters}>
          {GRUPOS_MUSCULARES.map((grupo) => (
            <Chip
              key={grupo}
              label={grupo}
              selected={grupoSeleccionado === grupo}
              onClick={() => handleGrupoClick(grupo)}
            />
          ))}
        </div>
      </div>

      {loading && <p className={styles.feedback}>Cargando...</p>}

      {error && <p className={styles.feedbackError}>{error}</p>}

      {!loading && !error && exercises.length === 0 && (
        <p className={styles.feedback}>
          No se encontraron ejercicios con esos filtros.
        </p>
      )}

      {!loading && !error && exercises.length > 0 && (
    <div className={`${styles.list} glassCard`}>
          <div className={styles.listHeader}>
            <span>Nombre</span>
            <span>Tipo</span>
          </div>
          {exercises.map((ex) => (
            <div key={ex._id} className={styles.row}>
              <button
                className={styles.rowMain}
                onClick={() => navigate(`/exercises/${ex._id}/edit`)}
              >
                <span className={styles.rowName}>{ex.nombre}</span>
                <span className={styles.rowType}>{ex.tipo}</span>
              </button>
              <button
                type="button"
                className={styles.deleteIcon}
                onClick={(e) => handleAskDelete(ex, e)}
                aria-label={`Eliminar ${ex.nombre}`}
              >
                <IconTrash />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.cta}>
        <Button variant="outline" onClick={() => navigate('/exercises/new')}>
          + Nuevo ejercicio
        </Button>
      </div>

      <ConfirmDialog
        open={Boolean(exerciseToDelete)}
        title="¿Eliminar este ejercicio?"
        message={
          exerciseToDelete
            ? `"${exerciseToDelete.nombre}" desaparecerá de tu catálogo. Las sesiones que lo contengan perderán esta referencia.`
            : ''
        }
        confirmLabel={deleting ? 'Eliminando...' : 'Eliminar'}
        cancelLabel="Cancelar"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setExerciseToDelete(null)}
      />
    </div>
  );
}