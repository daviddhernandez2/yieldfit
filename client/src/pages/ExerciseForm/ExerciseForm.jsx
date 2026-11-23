import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createExercise,
  getExercise,
  updateExercise,
  deleteExercise,
} from "@/api/exercises.js";
import Input from "@/components/Input/Input.jsx";
import Select from "@/components/Select/Select.jsx";
import Button from "@/components/Button/Button.jsx";
import DeleteButton from "@/components/DeleteButton/DeleteButton.jsx";
import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog.jsx";
import { tituloBorrarEjercicio, MENSAJE_BORRAR_EJERCICIO } from "@/utils/borradoEjercicio.js";
import useOpcionesEjercicio, { tipoDisponible } from "@/hooks/useOpcionesEjercicio.js";
import styles from "@/pages/ExerciseForm/ExerciseForm.module.css";

const IconChevronLeft = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
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

  const [form, setForm] = useState({
    nombre: "",
    grupoMuscular: "Pecho",
    tipo: "Pesas libres",
  });
  const [loading, setLoading] = useState(editMode);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  // Tipo con el que se cargó el ejercicio al editar: si es uno bloqueado (cardio), se
  // avisa. Al crear no hay tipo original.
  const [tipoOriginal, setTipoOriginal] = useState(null);
  // Grupos y tipos vienen del servidor: sus values son los únicos que acepta la API.
  const { opciones, error: errorOpciones } = useOpcionesEjercicio();

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
        setTipoOriginal(ex.tipo);
      } catch (err) {
        const message =
          err.response?.data?.message || "Error al cargar el ejercicio.";
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
    setErrorMessage("");
    try {
      if (editMode) {
        await updateExercise(id, form);
      } else {
        await createExercise(form);
      }
      navigate("/exercises");
    } catch (err) {
      const data = err.response?.data;
      const message =
        data?.details?.[0] || data?.message || "Error al guardar.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    setSubmitting(true);
    try {
      await deleteExercise(id);
      navigate("/exercises");
    } catch (err) {
      const message = err.response?.data?.message || "Error al eliminar.";
      setErrorMessage(message);
      setConfirmDeleteOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (errorOpciones) return <p className={styles.feedback}>{errorOpciones}</p>;
  if (loading || !opciones) return <p className={styles.feedback}>Cargando...</p>;

  // Los tipos no disponibles se ven en el select pero no se pueden elegir. En un <select>
  // nativo no se puede dar estilo a una opción, así que la etiqueta va en el texto.
  const opcionesTipo = opciones.tipos.map((t) =>
    t.disponible === false ? { ...t, label: `${t.label} (próximamente)`, disabled: true } : t,
  );
  const editandoBloqueado = tipoOriginal !== null && !tipoDisponible(opciones, tipoOriginal);

  return (
    <div className={styles.page}>
      {/* Header: botón atrás + título. Mismo patrón que SessionDetail y
          otras vistas de detalle: la navegación queda pegada al inicio
          de la línea de lectura. */}
      <header className={styles.header}>
        <button
          type="button"
          onClick={() => navigate("/exercises")}
          className={styles.backButton}
          aria-label="Volver al listado de ejercicios"
        >
          <IconChevronLeft />
        </button>
        <h1 className={styles.title}>
          {editMode ? "Editar ejercicio" : "Nuevo ejercicio"}
        </h1>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          label="Nombre"
          value={form.nombre}
          onChange={handleChange("nombre")}
          required
          maxLength={40}
          placeholder="p.ej. Press banca con barra"
        />

        <Select
          label="Grupo muscular"
          value={form.grupoMuscular}
          onChange={handleChange("grupoMuscular")}
          options={opciones.gruposMusculares}
        />

        {editandoBloqueado && (
          <p className={styles.aviso} role="note">
            Los ejercicios de cardio estarán disponibles próximamente: todavía no se pueden
            registrar en una sesión. Puedes renombrarlo o cambiarle el tipo.
          </p>
        )}

        <Select
          label="Tipo"
          value={form.tipo}
          onChange={handleChange("tipo")}
          options={opcionesTipo}
        />

        {errorMessage && (
          <div className={styles.errorBanner} role="alert">
            {errorMessage}
          </div>
        )}

        {/* Botón principal centrado y con ancho contenido, coherente con
            el resto de la app. Sin fullWidth para no dominar la pantalla. */}
        <div className={styles.submitWrapper}>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting
              ? "Guardando..."
              : editMode
                ? "Guardar cambios"
                : "Crear ejercicio"}
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
        title={tituloBorrarEjercicio(form.nombre)}
        message={MENSAJE_BORRAR_EJERCICIO}
        confirmLabel={submitting ? "Eliminando..." : "Eliminar"}
        cancelLabel="Cancelar"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
