import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listExercises } from '@/api/exercises.js';
import BotonIcono from '@/components/BotonIcono/BotonIcono.jsx';
import {
  getWorkout,
  createWorkout,
  updateWorkout,
  deleteWorkout,
} from '@/api/workouts.js';
import Input from '@/components/Input/Input.jsx';
import Button from '@/components/Button/Button.jsx';
import DeleteButton from '@/components/DeleteButton/DeleteButton.jsx';
import ExercisePicker from '@/components/ExercisePicker/ExercisePicker.jsx';
import NombreEjercicio from '@/components/NombreEjercicio/NombreEjercicio.jsx';
import SelectorPasos from '@/components/SelectorPasos/SelectorPasos.jsx';
import ListaOrdenable, { Asa } from '@/components/ListaOrdenable/ListaOrdenable.jsx';
import { moverElemento } from '@/utils/orden.js';
import { minutosYSegundos, duracionHablada } from '@/utils/tiempo.js';
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog.jsx';
import { useAvisoSalir } from '@/hooks/useAvisoSalir.js';
import { hayCambios } from '@/utils/cambios.js';
import useOpcionesEjercicio, { tipoDisponible } from '@/hooks/useOpcionesEjercicio.js';
import Proximamente from '@/components/Proximamente/Proximamente.jsx';
import formulario from '@/styles/paginaFormulario.module.css';
import styles from '@/pages/WorkoutForm/WorkoutForm.module.css';
import { SERIES_POR_DEFECTO, DESCANSO_POR_DEFECTO } from '@/utils/porDefecto.js';

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Formulario unificado para crear y editar rutinas.
// El modo se detecta por la presencia del :id en la URL. Si existe, precarga
// la rutina; si no, arranca en blanco. Ya NO gestiona el arranque de sesión
// activa: esa acción vive en el modal de Workouts, más natural para el usuario
// y evitando duplicar lógica de conflicto.
export default function WorkoutForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [nombre, setNombre] = useState('');
  const [ejercicios, setEjercicios] = useState([]);

  const [catalogo, setCatalogo] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Grupos musculares para los chips de filtro, tal como los define el servidor.
  const { opciones, error: errorOpciones } = useOpcionesEjercicio();

  // Aviso al salir con cambios sin guardar (11b.7). Foto del estado inicial: vacío al crear;
  // al editar, null hasta que llega la rutina del servidor (sin foto no hay nada que perder).
  const [inicial, setInicial] = useState(isEditMode ? null : { nombre: '', ejercicios: [] });
  const aviso = useAvisoSalir(hayCambios(inicial, { nombre, ejercicios }));

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
          setInicial({ nombre: wo.nombre, ejercicios: wo.ejercicios });
        }
      } catch {
        if (isEditMode) navigate('/workouts', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id, isEditMode, navigate]);

  const catalogoById = useMemo(() => {
    return new Map(catalogo.map((ex) => [ex._id, ex]));
  }, [catalogo]);

  const exerciseIdsAñadidos = useMemo(() => {
    return new Set(ejercicios.map((ej) => ej.exerciseId));
  }, [ejercicios]);

  const handleToggleExercise = (exerciseId) => {
    if (exerciseIdsAñadidos.has(exerciseId)) {
      setEjercicios((prev) => prev.filter((ej) => ej.exerciseId !== exerciseId));
    } else {
      setEjercicios((prev) => [
        ...prev,
        {
          exerciseId,
          numSeries: SERIES_POR_DEFECTO,
          descansoSegundos: DESCANSO_POR_DEFECTO,
        },
      ]);
    }
  };

  const handleQuitarEjercicio = (exerciseId) => {
    setEjercicios((prev) => prev.filter((ej) => ej.exerciseId !== exerciseId));
  };

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
      aviso.permitirSalida(); // guardado: salir no pierde nada
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
      aviso.permitirSalida();
      navigate('/workouts');
    } catch (err) {
      const message = err.response?.data?.message || 'Error al eliminar la rutina.';
      setErrorMessage(message);
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (errorOpciones) {
    return <p className={formulario.feedback}>{errorOpciones}</p>;
  }

  if (loading || !opciones) {
    return <p className={formulario.feedback}>Cargando...</p>;
  }

  return (
    <div className={formulario.page}>
      {/* Header: botón atrás delante del título, mismo patrón que
          SessionDetail y ExerciseForm. */}
      <header className={formulario.header}>
        <BotonIcono icono="atras" etiqueta="Volver al listado de rutinas" onClick={() => navigate('/workouts')} />
        <h1 className={formulario.title}>
          {isEditMode ? 'Editar rutina' : 'Nueva rutina'}
        </h1>
      </header>

      <form className={formulario.form} onSubmit={handleSubmit} noValidate>
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
          <section className={formulario.section}>
            <h2 className={formulario.sectionTitle}>
              Ejercicios añadidos ({ejercicios.length})
            </h2>
            {/* El orden de la lista es el de la rutina: se cambia arrastrando desde el asa
                ⋮⋮ (bloque 9b). El servidor reasigna `orden` según la posición al guardar. */}
            <ListaOrdenable
              ids={ejercicios.map((ej) => ej.exerciseId)}
              nombreDe={(id) => catalogoById.get(id)?.nombre ?? 'Ejercicio'}
              onMover={(desde, hasta) => setEjercicios((prev) => moverElemento(prev, desde, hasta))}
              className={styles.addedList}
            >
              {(id, asa) => {
                const ej = ejercicios.find((e) => e.exerciseId === id);
                const exercise = catalogoById.get(ej.exerciseId);
                return (
                  <div className={`${styles.addedItem} glassCard`}>
                    <div className={styles.addedItemHeader}>
                      <Asa {...asa} />
                      <NombreEjercicio
                        className={styles.addedItemName}
                        nombre={exercise?.nombre || 'Ejercicio'}
                        grupoMuscular={exercise?.grupoMuscular}
                        tipo={exercise?.tipo}
                        opciones={opciones}
                      />
                      {/* Un cardio que ya estaba en la rutina se queda (y se guarda), pero
                          en la sesión activa saldrá bloqueado. */}
                      {exercise && !tipoDisponible(opciones, exercise.tipo) && <Proximamente />}
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
                      {/* Selectores por pasos (bloque 9b): límites del modelo Workout. */}
                      <SelectorPasos
                        id={`series-${ej.exerciseId}`}
                        etiqueta="Series"
                        valor={ej.numSeries}
                        onCambiar={(v) => handleUpdateEjercicio(ej.exerciseId, 'numSeries', v)}
                        min={1}
                        max={20}
                        textoAccesible={(v) => `${v} ${v === 1 ? 'serie' : 'series'}`}
                        textoMenos="Una serie menos"
                        textoMas="Una serie más"
                      />
                      {/* El descanso se ve en minutos (1:30) y se guarda en segundos (90). */}
                      <SelectorPasos
                        id={`descanso-${ej.exerciseId}`}
                        etiqueta="Descanso"
                        valor={ej.descansoSegundos}
                        onCambiar={(v) => handleUpdateEjercicio(ej.exerciseId, 'descansoSegundos', v)}
                        paso={15}
                        min={0}
                        max={900}
                        formato={minutosYSegundos}
                        textoAccesible={duracionHablada}
                        textoMenos="Quitar 15 segundos"
                        textoMas="Añadir 15 segundos"
                      />
                    </div>
                  </div>
                );
              }}
            </ListaOrdenable>
          </section>
        )}

        <section className={formulario.section}>
          <h2 className={formulario.sectionTitle}>Añadir desde tu catálogo</h2>

          {/* Buscador, chips y lista viven en ExercisePicker (compartido con la sesión
              activa). Pulsar un ejercicio lo añade o lo quita de la rutina. */}
          <ExercisePicker
            ejercicios={catalogo}
            opciones={opciones}
            seleccionados={exerciseIdsAñadidos}
            onElegir={handleToggleExercise}
            // Creado desde el buscador: entra en el catálogo y se añade a la rutina.
            onCreado={(ex) => {
              setCatalogo((prev) => [...prev, ex]);
              handleToggleExercise(ex._id);
            }}
          />
        </section>

        {errorMessage && (
          <div className={formulario.errorBanner} role="alert">
            {errorMessage}
          </div>
        )}

        {/* Botón principal centrado y con ancho contenido, coherente con
            ExerciseForm. Sin fullWidth para no dominar la pantalla. */}
        <div className={formulario.submitWrapper}>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || !nombre.trim() || ejercicios.length === 0}
          >
            {submitting ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear rutina'}
          </Button>
        </div>
      </form>

      {/* Zona de eliminación (solo en modo edición). DeleteButton estándar
          discreto, alineado a la derecha, mismo patrón que ExerciseForm. */}
      {isEditMode && (
        <div className={formulario.deleteWrapper}>
          <DeleteButton
            onClick={() => setConfirmOpen(true)}
            disabled={submitting || deleting}
          >
            Eliminar rutina
          </DeleteButton>
        </div>
      )}

      <ConfirmDialog {...aviso.dialogo} />
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