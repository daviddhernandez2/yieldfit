import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { listExercises, deleteExercise } from '../../api/exercises.js';
import Chip from '../../components/Chip/Chip.jsx';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx';
import styles from './Exercises.module.css';

const FILTROS = [
  { value: 'todos', label: 'Todos' },
  { value: 'pecho', label: 'Pecho' },
  { value: 'espalda', label: 'Espalda' },
  { value: 'hombros', label: 'Hombros' },
  { value: 'brazos', label: 'Brazos' },
  { value: 'piernas', label: 'Piernas' },
  { value: 'core', label: 'Core' },
  { value: 'cardio', label: 'Cardio' },
];


const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconTrash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

// Pantalla del catálogo de ejercicios.
// Filtros combinados: por grupo muscular (chips) y por búsqueda de texto.
// El listado se calcula con useMemo para evitar re-renderizados innecesarios.
export default function Exercises() {
  const navigate = useNavigate();

  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const response = await listExercises();
        setExercises(response.data.exercises);
      } catch (err) {
        const message = err.response?.data?.message || 'Error al cargar los ejercicios.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const ejerciciosFiltrados = useMemo(() => {
    let arr = exercises;
    if (filtro !== 'todos') {
      arr = arr.filter((ex) => ex.grupoMuscular === filtro);
    }
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      arr = arr.filter((ex) => ex.nombre.toLowerCase().includes(q));
    }
    return arr;
  }, [exercises, filtro, busqueda]);

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setSubmitting(true);
    try {
      await deleteExercise(confirmDelete._id);
      setExercises((prev) => prev.filter((ex) => ex._id !== confirmDelete._id));
      setConfirmDelete(null);
    } catch (err) {
      const message = err.response?.data?.message || 'Error al eliminar el ejercicio.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header con título a la izquierda y botón pill "+ Nuevo ejercicio"
          a la derecha. En móvil el texto se oculta para que el botón se
          adapte al ancho reducido sin cortarse. */}
      <header className={styles.header}>
        <h1 className={styles.title}>Ejercicios</h1>
        <button
          type="button"
          className={styles.newButton}
          onClick={() => navigate('/exercises/new')}
          aria-label="Nuevo ejercicio"
        >
          <IconPlus />
          <span className={styles.newButtonLabel}>Nuevo ejercicio</span>
        </button>
      </header>

      <input
        type="text"
        placeholder="Buscar"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className={styles.searchInput}
      />

      <div className={styles.filtersScroll}>
        <div className={styles.filters}>
          {FILTROS.map((f) => (
            <Chip
              key={f.value}
              label={f.label}
              active={filtro === f.value}
              onClick={() => setFiltro(f.value)}
            />
          ))}
        </div>
      </div>

      {loading && <p className={styles.feedback}>Cargando...</p>}

      {error && <p className={styles.feedbackError}>{error}</p>}

      {!loading && !error && ejerciciosFiltrados.length === 0 && (
        <p className={styles.feedback}>
          No hay ejercicios que coincidan con los filtros.
        </p>
      )}

      {!loading && !error && ejerciciosFiltrados.length > 0 && (
        <div className={`${styles.list} glassCard`}>
          {/* Cabecera con 3 columnas: Nombre / Tipo / (hueco para papelera). */}
          <div className={styles.listHeader}>
            <span>Nombre</span>
            <span>Tipo</span>
            <span></span>
          </div>

          {ejerciciosFiltrados.map((ex) => (
            <div key={ex._id} className={styles.row}>
              {/* rowMain ocupa nombre+tipo y es clicable para navegar a editar. */}
              <button
                type="button"
                className={styles.rowMain}
                onClick={() => navigate(`/exercises/${ex._id}/edit`)}
              >
                <span className={styles.rowName}>{ex.nombre}</span>
                <span className={styles.rowType}>{ex.tipo}</span>              </button>
              {/* Papelera separada como acción destructiva individual. */}
              <button
                type="button"
                onClick={() => setConfirmDelete(ex)}
                className={styles.deleteIcon}
                aria-label={`Eliminar ${ex.nombre}`}
              >
                <IconTrash />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="¿Eliminar este ejercicio?"
        message={
          confirmDelete
            ? `"${confirmDelete.nombre}" se eliminará. También se retirará de las rutinas y grupos que lo incluyan. Las sesiones antiguas conservarán el nombre.`
            : ''
        }
        confirmLabel={submitting ? 'Eliminando...' : 'Eliminar'}
        cancelLabel="Cancelar"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}