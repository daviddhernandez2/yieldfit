import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getExercise,
  createExercise,
  updateExercise,
  deleteExercise,
} from '../../api/exercises.js';
import Input from '../../components/Input/Input.jsx';
import Select from '../../components/Select/Select.jsx';
import Button from '../../components/Button/Button.jsx';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx';
import styles from './ExerciseForm.module.css';

// Opciones sincronizadas con los enums del modelo Exercise del backend.
// Si en el modelo se ampliaran, hay que actualizar también aquí.
const GRUPO_OPTIONS = [
  { value: 'Pecho', label: 'Pecho' },
  { value: 'Espalda', label: 'Espalda' },
  { value: 'Hombros', label: 'Hombros' },
  { value: 'Brazos', label: 'Brazos' },
  { value: 'Piernas', label: 'Piernas' },
  { value: 'Core', label: 'Core' },
  { value: 'Cardio', label: 'Cardio' },
];

const TIPO_OPTIONS = [
  { value: 'Peso corporal', label: 'Peso corporal' },
  { value: 'Pesas libres', label: 'Pesas libres' },
  { value: 'Maquinas', label: 'Máquinas' },
  { value: 'Poleas', label: 'Poleas' },
  { value: 'Cardio', label: 'Cardio' },
];

// Pantalla unificada para crear o editar ejercicios.
// Detecta el modo según haya parámetro :id en la URL.
// - Sin id: crea un nuevo ejercicio.
// - Con id: carga el existente y permite editarlo o borrarlo.
export default function ExerciseForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    nombre: '',
    grupoMuscular: '',
    tipo: '',
  });
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  // En modo edición, cargamos los datos del ejercicio existente.
  // Si la API devuelve 404 (ya no existe o es ajeno), redirigimos al listado.
  useEffect(() => {
    if (!isEditMode) return;
    const cargar = async () => {
      try {
        const response = await getExercise(id);
        const { nombre, grupoMuscular, tipo } = response.data.exercise;
        setFormData({ nombre, grupoMuscular, tipo });
      } catch {
        navigate('/exercises', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id, isEditMode, navigate]);

  const updateField = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      if (isEditMode) {
        await updateExercise(id, formData);
      } else {
        await createExercise(formData);
      }
      navigate('/exercises');
    } catch (err) {
      const data = err.response?.data;
      const message =
        data?.details?.[0] || data?.message || 'Error al guardar el ejercicio.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteExercise(id);
      navigate('/exercises');
    } catch (err) {
      const message =
        err.response?.data?.message || 'Error al eliminar el ejercicio.';
      setErrorMessage(message);
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <p className={styles.feedback}>Cargando...</p>;
  }

  const camposObligatoriosOk =
    formData.nombre && formData.grupoMuscular && formData.tipo;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          type="button"
          onClick={() => navigate('/exercises')}
          className={styles.backButton}
          aria-label="Volver"
        >
          ←
        </button>
        <h1 className={styles.title}>
          {isEditMode ? 'Editar ejercicio' : 'Nuevo ejercicio'}
        </h1>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Input
          id="nombre"
          label="Nombre"
          type="text"
          placeholder="Ej. Press banca con barra"
          value={formData.nombre}
          onChange={updateField('nombre')}
          required
          autoFocus={!isEditMode}
        />

        <Select
          id="grupoMuscular"
          label="Grupo muscular"
          value={formData.grupoMuscular}
          onChange={updateField('grupoMuscular')}
          options={GRUPO_OPTIONS}
          placeholder="Selecciona un grupo"
          required
        />

        <Select
          id="tipo"
          label="Tipo"
          value={formData.tipo}
          onChange={updateField('tipo')}
          options={TIPO_OPTIONS}
          placeholder="Selecciona un tipo"
          required
        />

        {errorMessage && (
          <div className={styles.errorBanner} role="alert">
            {errorMessage}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={submitting || !camposObligatoriosOk}
        >
          {submitting ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear ejercicio'}
        </Button>

        {isEditMode && (
          <Button
            type="button"
            variant="danger"
            fullWidth
            onClick={() => setConfirmOpen(true)}
            disabled={submitting || deleting}
          >
            Eliminar ejercicio
          </Button>
        )}
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Eliminar este ejercicio?"
        message="Las sesiones que lo contengan perderán esta referencia. Esta acción no se puede deshacer."
        confirmLabel={deleting ? 'Eliminando...' : 'Eliminar'}
        cancelLabel="Cancelar"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}