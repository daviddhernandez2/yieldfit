import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listExercises } from "@/api/exercises.js";
import { createChart, deleteChart, getChart, updateChart } from "@/api/charts.js";
import Input from "@/components/Input/Input.jsx";
import Button from "@/components/Button/Button.jsx";
import DeleteButton from "@/components/DeleteButton/DeleteButton.jsx";
import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog.jsx";
import ExercisePicker from "@/components/ExercisePicker/ExercisePicker.jsx";
import useOpcionesEjercicio from "@/hooks/useOpcionesEjercicio.js";
import { contar } from "@/utils/activeSession.js";
import styles from "@/pages/GroupForm/GroupForm.module.css";

const IconChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

// Crear y editar un grupo de progreso (bloque 9, DECISIONS.md 0034), en /groups/new y
// /groups/:id/edit. Mismo esquema que WorkoutForm: nombre, ejercicios marcados en el
// catálogo (ExercisePicker) y, al editar, borrar. Es una página y no una ventana por lo
// aprendido en el bloque 6 (en el iPhone no caben).
export default function GroupForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editando = Boolean(id);

  const [nombre, setNombre] = useState("");
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [catalogo, setCatalogo] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [confirmBorrar, setConfirmBorrar] = useState(false);
  const { opciones, error: errorOpciones } = useOpcionesEjercicio();

  useEffect(() => {
    const cargar = async () => {
      try {
        const [catRes, grupoRes] = await Promise.all([listExercises(), editando ? getChart(id) : null]);
        setCatalogo(catRes.data.exercises);
        if (grupoRes) {
          setNombre(grupoRes.data.chart.nombre);
          setSeleccionados(new Set(grupoRes.data.chart.exerciseIds.map(String)));
        }
      } catch {
        // Un grupo que no existe (o de otro usuario) devuelve 404: de vuelta al Dashboard.
        navigate("/dashboard", { replace: true });
      }
    };
    cargar();
  }, [id, editando, navigate]);

  // Tocar un ejercicio lo añade al grupo o lo quita.
  const alternar = (exerciseId) => {
    setSeleccionados((actual) => {
      const nuevo = new Set(actual);
      if (nuevo.has(exerciseId)) nuevo.delete(exerciseId);
      else nuevo.add(exerciseId);
      return nuevo;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setGuardando(true);
    try {
      const datos = { nombre: nombre.trim(), exerciseIds: [...seleccionados] };
      if (editando) await updateChart(id, datos);
      else await createChart(datos);
      navigate("/dashboard");
    } catch (err) {
      const data = err.response?.data;
      setErrorMessage(data?.details?.[0] || data?.message || "Error al guardar el grupo.");
      setGuardando(false);
    }
  };

  const handleBorrar = async () => {
    setGuardando(true);
    try {
      await deleteChart(id);
      navigate("/dashboard");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Error al borrar el grupo.");
      setConfirmBorrar(false);
      setGuardando(false);
    }
  };

  if (errorOpciones) return <p className={styles.feedback}>{errorOpciones}</p>;
  if (!catalogo || !opciones) return <p className={styles.feedback}>Cargando...</p>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" onClick={() => navigate("/dashboard")} className={styles.backButton} aria-label="Volver al progreso">
          <IconChevronLeft />
        </button>
        <h1 className={styles.title}>{editando ? "Editar grupo" : "Nuevo grupo"}</h1>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Input
          id="nombre"
          label="Nombre"
          type="text"
          placeholder="Ej. Empuje, Pierna, Básicos..."
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={60}
          autoFocus={!editando}
        />

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Ejercicios del grupo ({contar(seleccionados.size, "elegido", "elegidos")})
          </h2>
          <p className={styles.ayuda}>
            Su progreso se calcula igual que el de "Todos", solo con estos ejercicios.
          </p>
          <ExercisePicker
            ejercicios={catalogo}
            opciones={opciones}
            seleccionados={seleccionados}
            onElegir={alternar}
          />
        </section>

        {errorMessage && (
          <div className={styles.errorBanner} role="alert">
            {errorMessage}
          </div>
        )}

        <div className={styles.submitWrapper}>
          <Button type="submit" variant="primary" disabled={guardando || !nombre.trim() || seleccionados.size === 0}>
            {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear grupo"}
          </Button>
        </div>
      </form>

      {editando && (
        <div className={styles.deleteWrapper}>
          <DeleteButton onClick={() => setConfirmBorrar(true)} disabled={guardando}>
            Eliminar grupo
          </DeleteButton>
        </div>
      )}

      <ConfirmDialog
        open={confirmBorrar}
        title={`¿Eliminar «${nombre}»?`}
        message="Solo se borra el grupo: tus ejercicios y tu historial no cambian."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        confirmVariant="danger"
        onConfirm={handleBorrar}
        onCancel={() => setConfirmBorrar(false)}
      />
    </div>
  );
}
