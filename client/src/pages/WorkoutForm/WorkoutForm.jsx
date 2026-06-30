import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listExercises } from '../../api/exercises.js';
import {
  getWorkout,
  createWorkout,
  updateWorkout,
  deleteWorkout,
} from '../../api/workouts.js';
import Input from '../../components/Input/Input.jsx';
import Button from '../../components/Button/Button.jsx';
import Chip from '../../components/Chip/Chip.jsx';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx';
import styles from './WorkoutForm.module.css';

const GRUPOS_MUSCULARES = [
  'Pecho',
  'Espalda',
  'Hombros',
  'Brazos',
  'Piernas',
  'Core',
  'Cardio',
];

// Valores por defecto al añadir un ejercicio a la rutina.
// El usuario puede ajustarlos después en la zona de añadidos.
const DEFAULT_NUM_SERIES = 3;
const DEFAULT_DESCANSO = 90;

// Icono inline X para el botón de quitar ejercicio de la rutina.
const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Icono check para marcar ejercicios ya añadidos en el catálogo.
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Pantalla unificada para crear o editar rutinas.
// Detecta modo según haya parámetro :id.
// La UI integra dos zonas: ejercicios añadidos arriba y catálogo filtrable abajo.
export default function WorkoutForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [nombre, setNombre] = useState('');
  const [ejercicios, setEjercicios] = useState([]);

  const [catalogo, setCatalogo] = useState([]);
  const [search, setSearch] = useState('');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Carga inicial: el catálogo de ejercicios siempre, y la rutina si estamos editando.
  // Las dos peticiones se hacen en paralelo para reducir tiempo de carga.
  useEffect(() => {
    const cargar = async () => {
      try {
        const promesas = [listExercises()];
        if (isEditMode) promesas.push(getWorkout(id));
        const [catRes, woRes] = await Promise.all(promesas);

        setCatalogo(catRes.data.exercises);

        if (isEditMode) {
          const wo = woRes.data.workout;
          setNombre(wo.nombre);
          setEjercicios(wo.ejercicios);
        }
      } catch {
        if (isEditMode) navigate('/workouts', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id, isEditMode, navigate]);

  // Indice por _id para acceso O(1) al nombre del exercise desde un exerciseId.
  // useMemo evita recalcular en cada render del componente.
  const catalogoById = useMemo(() => {
    return new Map(catalogo.map((ex) => [ex._id, ex]));
  }, [catalogo]);

  // Filtrado del catálogo en cliente: cuando el catálogo es chico (50-60 items),
  // filtrar en cliente es instantáneo y evita llamadas extras al backend.
  const catalogoFiltrado = useMemo(() => {
    return catalogo.filter((ex) => {
      if (grupoSeleccionado && ex.grupoMuscular !== grupoSeleccionado) return false;
      if (search && !ex.nombre.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [catalogo, search, grupoSeleccionado]);

  // Set de exerciseIds ya añadidos para chequear pertenencia en O(1).
  const exerciseIdsAñadidos = useMemo(() => {
    return new Set(ejercicios.map((ej) => ej.exerciseId));
  }, [ejercicios]);

  const handleGrupoClick = (grupo) => {
    setGrupoSeleccionado((actual) => (actual === grupo ? null : grupo));
  };

  // Toggle: si el exercise ya está en la rutina, lo quita.
  // Si no, lo añade con valores por defecto al final del array.
  const handleToggleExercise = (exerciseId) => {
    if (exerciseIdsAñadidos.has(exerciseId)) {
      setEjercicios((prev) => prev.filter((ej) => ej.exerciseId !== exerciseId));
    } else {
      setEjercicios((prev) => [
        ...prev,
        {
          exerciseId,
          numSeries: DEFAULT_NUM_SERIES,
          descansoSegundos: DEFAULT_DESCANSO,
        },
      ]);
    }
  };

  const handleQuitarEjercicio = (exerciseId) => {
    setEjercicios((prev) => prev.filter((ej) => ej.exerciseId !== exerciseId));
  };

  // Actualiza un campo (numSeries o descansoSegundos) de un ejercicio añadido.
  // Identificamos por exerciseId porque no hay duplicados (es un toggle).
  const handleUpdateEjercicio = (exerciseId, campo, valor) => {
    setEjercicios((prev) =>
      prev.map((ej) =>
        ej.exerciseId === exerciseId ? { ...ej, [campo]: Number(valor) } : ej
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!nombre.trim()) {
      setErrorMessage('El nombre de la rutina es obligatorio.');
      return;
    }
    if (ejercicios.length === 0) {
      setErrorMessage('Añade al menos un ejercicio a la rutina.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { nombre: nombre.trim(), ejercicios };
      if (isEditMode) {
        await updateWorkout(id, payload);
      } else {
        await createWorkout(payload);
      }
      navigate('/workouts');
    } catch (err) {
      const data = err.response?.data;
      const message = data?.details?.[0] || data?.message || 'Error al guardar la rutina.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteWorkout(id);
      navigate('/workouts');
    } catch (err) {
      const message = err.response?.data?.message || 'Error al eliminar la rutina.';
      setErrorMessage(message);
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <p className={styles.feedback}>Cargando...</p>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          type="button"
          onClick={() => navigate('/workouts')}
          className={styles.backButton}
          aria-label="Volver"
        >
          ←
        </button>
        <h1 className={styles.title}>
          {isEditMode ? 'Editar rutina' : 'Nueva rutina'}
        </h1>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Input
          id="nombre"
          label="Nombre"
          type="text"
          placeholder="Ej. Push, Día de empuje..."
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          autoFocus={!isEditMode}
        />

        {ejercicios.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Ejercicios añadidos ({ejercicios.length})
            </h2>
            <div className={styles.addedList}>
              {ejercicios.map((ej) => {
                const exercise = catalogoById.get(ej.exerciseId);
                return (
                  <div key={ej.exerciseId} className={styles.addedItem}>
                    <div className={styles.addedItemHeader}>
                      <span className={styles.addedItemName}>
                        {exercise?.nombre || 'Ejercicio'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuitarEjercicio(ej.exerciseId)}
                        className={styles.removeButton}
                        aria-label="Quitar ejercicio"
                      >
                        <IconClose />
                      </button>
                    </div>
                    <div className={styles.addedItemControls}>
                      <Input
                        id={`series-${ej.exerciseId}`}
                        label="Series"
                        type="number"
                        min="1"
                        max="20"
                        value={ej.numSeries}
                        onChange={(e) =>
                          handleUpdateEjercicio(ej.exerciseId, 'numSeries', e.target.value)
                        }
                      />
                      <Input
                        id={`descanso-${ej.exerciseId}`}
                        label="Descanso (s)"
                        type="number"
                        min="0"
                        max="900"
                        value={ej.descansoSegundos}
                        onChange={(e) =>
                          handleUpdateEjercicio(ej.exerciseId, 'descansoSegundos', e.target.value)
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Añadir desde tu catálogo</h2>

          <input
            type="text"
            placeholder="Buscar ejercicio"
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

          <div className={styles.catalogo}>
            {catalogoFiltrado.length === 0 && (
              <p className={styles.feedback}>No hay ejercicios con esos filtros.</p>
            )}
            {catalogoFiltrado.map((ex) => {
              const isSelected = exerciseIdsAñadidos.has(ex._id);
              return (
                <button
                  key={ex._id}
                  type="button"
                  onClick={() => handleToggleExercise(ex._id)}
                  className={`${styles.catalogoItem} ${isSelected ? styles.catalogoItemSelected : ''}`}
                >
                  <span className={styles.catalogoItemName}>{ex.nombre}</span>
                  <span className={styles.catalogoItemMeta}>{ex.grupoMuscular}</span>
                  {isSelected && (
                    <span className={styles.catalogoItemCheck}>
                      <IconCheck />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {errorMessage && (
          <div className={styles.errorBanner} role="alert">
            {errorMessage}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={submitting || !nombre.trim() || ejercicios.length === 0}
        >
          {submitting ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear rutina'}
        </Button>

        {isEditMode && (
          <Button
            type="button"
            variant="danger"
            fullWidth
            onClick={() => setConfirmOpen(true)}
            disabled={submitting || deleting}
          >
            Eliminar rutina
          </Button>
        )}
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Eliminar esta rutina?"
        message="Las sesiones que la usen no se verán afectadas. Esta acción no se puede deshacer."
        confirmLabel={deleting ? 'Eliminando...' : 'Eliminar'}
        cancelLabel="Cancelar"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}