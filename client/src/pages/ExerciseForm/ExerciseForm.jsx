import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createExercise, getExercise, updateExercise, deleteExercise } from '@/api/exercises.js';
import Input from '@/components/Input/Input.jsx';
import Select from '@/components/Select/Select.jsx';
import Button from '@/components/Button/Button.jsx';
import DeleteButton from '@/components/DeleteButton/DeleteButton.jsx';
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog.jsx';
import styles from '@/pages/ExerciseForm/ExerciseForm.module.css';

const GRUPOS = [
  { value: 'pecho', label: 'Pecho' },
  { value: 'espalda', label: 'Espalda' },
  { value: 'hombros', label: 'Hombros' },
  { value: 'brazos', label: 'Brazos' },
  { value: 'piernas', label: 'Piernas' },
  { value: 'core', label: 'Core' },
  { value: 'cardio', label: 'Cardio' },
];

const TIPOS = [
  { value: 'pesas_libres', label: 'Pesas libres' },
  { value: 'maquinas', label: 'Máquinas' },
  { value: 'poleas', label: 'Poleas' },
  { value: 'peso_corporal', label: 'Peso corporal' },
  { value: 'cardio', label: 'Cardio' },
];

const IconChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

// Formulario unificado para crear y editar ejercicios.
// El modo se detecta por la presencia del :id en la URL. Si existe, se
// precarga el ejercicio; si no, arranca en blanco. Así reutilizamos toda
// la lógica de validación y submit para ambos flujos.
export default function ExerciseForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editMode = Boolean(id);

  const [form, setForm] = useState({ nombre: '', grupoMuscular: 'pecho', tipo: 'pesas_libres' });
  const [loading, setLoading] = useState(editMode);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Precarga en modo edición.
  useEffect(() => {
    if (!editMode) return;
    const cargar = async () => {
      try {
        const response = await getExercise(id);
        const ex = response.data.exercise;
        setForm({
          nombre: ex.nombre,
          grupoMuscular: ex.grupoMuscular,
          tipo: ex.tipo,
        });
      } catch (err) {
        const message = err.response?.data?.message || 'Error al cargar el ejercicio.';
        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [editMode, id]);

  const handleChange = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    try {
      if (editMode) {
        await updateExercise(id, form);
      } else {
        await createExercise(form);
      }
      navigate('/exercises');
    } catch (err) {
      const data = err.response?.data;
      const message = data?.details?.[0] || data?.message || 'Error al guardar.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    setSubmitting(true);
    try {
      await deleteExercise(id);
      navigate('/exercises');
    } catch (err) {
      const message = err.response?.data?.message || 'Error al eliminar.';
      setErrorMessage(message);
      setConfirmDeleteOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className={styles.feedback}>Cargando...</p>;

  return (
    <div className={styles.page}>
      {/* Header: botón atrás + título. Mismo patrón que SessionDetail y
          otras vistas de detalle: la navegación queda pegada al inicio
          de la línea de lectura. */}
      <header className={styles.header}>
        <button
          type="button"
          onClick={() => navigate('/exercises')}
          className={styles.backButton}
          aria-label="Volver al listado de ejercicios"
        >
          <IconChevronLeft />
        </button>
        <h1 className={styles.title}>
          {editMode ? 'Editar ejercicio' : 'Nuevo ejercicio'}
        </h1>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          label="Nombre"
          value={form.nombre}
          onChange={handleChange('nombre')}
          required
          maxLength={40}
          placeholder="p.ej. Press banca con barra"
        />

        <Select
          label="Grupo muscular"
          value={form.grupoMuscular}
          onChange={handleChange('grupoMuscular')}
          options={GRUPOS}
        />

        <Select
          label="Tipo"
          value={form.tipo}
          onChange={handleChange('tipo')}
          options={TIPOS}
        />

        {errorMessage && (
          <div className={styles.errorBanner} role="alert">{errorMessage}</div>
        )}

        {/* Botón principal centrado y con ancho contenido, coherente con
            el resto de la app. Sin fullWidth para no dominar la pantalla. */}
        <div className={styles.submitWrapper}>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? 'Guardando...' : editMode ? 'Guardar cambios' : 'Crear ejercicio'}
          </Button>
        </div>
      </form>

      {/* Zona de eliminación (solo en modo edición). DeleteButton estándar
          discreto, alineado a la derecha. Estandarizado con SessionDetail. */}
      {editMode && (
        <div className={styles.deleteWrapper}>
          <DeleteButton
            onClick={() => setConfirmDeleteOpen(true)}
            disabled={submitting}
          >
            Eliminar ejercicio
          </DeleteButton>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="¿Eliminar este ejercicio?"
        message={
          `"${form.nombre}" se eliminará. También se retirará de las rutinas y ` +
          `grupos que lo incluyan. Las sesiones antiguas conservarán el nombre.`
        }
        confirmLabel={submitting ? 'Eliminando...' : 'Eliminar'}
        cancelLabel="Cancelar"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}