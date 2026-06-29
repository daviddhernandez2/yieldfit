import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listExercises } from '../../api/exercises.js';
import Button from '../../components/Button/Button.jsx';
import Chip from '../../components/Chip/Chip.jsx';
import styles from './Exercises.module.css';

// Grupos musculares disponibles. Sincronizado con el enum del modelo Exercise.
// Si en el backend se ampliara, hay que añadirlo aquí también.
const GRUPOS_MUSCULARES = [
  'Pecho',
  'Espalda',
  'Hombros',
  'Brazos',
  'Piernas',
  'Core',
  'Cardio',
];

// Pantalla principal del catálogo de ejercicios.
// Muestra una lista filtrable por grupo muscular y buscable por nombre.
// Permite navegar a crear/editar (rutas independientes en el Bloque 3.3b).
export default function Exercises() {
  const navigate = useNavigate();

  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);

  // Carga la lista desde la API. Se vuelve a llamar cuando cambian los filtros.
  // Los parámetros vacíos se omiten para que el backend devuelva todo.
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
  }, [search, grupoSeleccionado]);

  // Toggle del filtro de grupo muscular: si pulsas el mismo, se deselecciona.
  const handleGrupoClick = (grupo) => {
    setGrupoSeleccionado((actual) => (actual === grupo ? null : grupo));
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
        <div className={styles.list}>
          <div className={styles.listHeader}>
            <span>Nombre</span>
            <span>Tipo</span>
          </div>
          {exercises.map((ex) => (
            <button
              key={ex._id}
              className={styles.row}
              onClick={() => navigate(`/exercises/${ex._id}/edit`)}
            >
              <span className={styles.rowName}>{ex.nombre}</span>
              <span className={styles.rowType}>{ex.tipo}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.cta}>
        <Button variant="outline" onClick={() => navigate('/exercises/new')}>
          + Nuevo ejercicio
        </Button>
      </div>
    </div>
  );
}