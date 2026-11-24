import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BotonIcono from "@/components/BotonIcono/BotonIcono.jsx";
import { listExercises } from "@/api/exercises.js";
import { createChart, deleteChart, getChart, updateChart } from "@/api/charts.js";
import Input from "@/components/Input/Input.jsx";
import Button from "@/components/Button/Button.jsx";
import DeleteButton from "@/components/DeleteButton/DeleteButton.jsx";
import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog.jsx";
import { useAvisoSalir } from "@/hooks/useAvisoSalir.js";
import { hayCambios } from "@/utils/cambios.js";
import ExercisePicker from "@/components/ExercisePicker/ExercisePicker.jsx";
import useOpcionesEjercicio from "@/hooks/useOpcionesEjercicio.js";
import { contar } from "@/utils/activeSession.js";
import formulario from "@/styles/paginaFormulario.module.css";
import styles from "@/pages/GroupForm/GroupForm.module.css";

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

  // Aviso al salir con cambios sin guardar (11b.7). Foto del estado inicial: vacío al crear;
  // al editar, null hasta que llega el grupo del servidor.
  const [inicial, setInicial] = useState(editando ? null : { nombre: "", seleccionados: new Set() });
  const aviso = useAvisoSalir(hayCambios(inicial, { nombre, seleccionados }));

  useEffect(() => {
    const cargar = async () => {
      try {
        const [catRes, grupoRes] = await Promise.all([listExercises(), editando ? getChart(id) : null]);
        setCatalogo(catRes.data.exercises);
        if (grupoRes) {
          const cargado = {
            nombre: grupoRes.data.chart.nombre,
            seleccionados: new Set(grupoRes.data.chart.exerciseIds.map(String)),
          };
          setNombre(cargado.nombre);
          setSeleccionados(cargado.seleccionados);
          setInicial(cargado);
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
      aviso.permitirSalida(); // guardado: salir no pierde nada
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
      aviso.permitirSalida();
      navigate("/dashboard");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Error al borrar el grupo.");
      setConfirmBorrar(false);
      setGuardando(false);
    }
  };

  if (errorOpciones) return <p className={formulario.feedback}>{errorOpciones}</p>;
  if (!catalogo || !opciones) return <p className={formulario.feedback}>Cargando...</p>;

  return (
    <div className={formulario.page}>
      <header className={formulario.header}>
        <BotonIcono icono="atras" etiqueta="Volver al progreso" onClick={() => navigate("/dashboard")} />
        <h1 className={formulario.title}>{editando ? "Editar grupo" : "Nuevo grupo"}</h1>
      </header>

      <form className={formulario.form} onSubmit={handleSubmit} noValidate>
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

        <section className={formulario.section}>
          <h2 className={formulario.sectionTitle}>
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
            // Creado desde el buscador: entra en el catálogo y queda marcado en el grupo.
            onCreado={(ex) => {
              setCatalogo((prev) => [...prev, ex]);
              alternar(ex._id);
            }}
          />
        </section>

        {errorMessage && (
          <div className={formulario.errorBanner} role="alert">
            {errorMessage}
          </div>
        )}

        <div className={formulario.submitWrapper}>
          <Button type="submit" variant="primary" disabled={guardando || !nombre.trim() || seleccionados.size === 0}>
            {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear grupo"}
          </Button>
        </div>
      </form>

      {editando && (
        <div className={formulario.deleteWrapper}>
          <DeleteButton onClick={() => setConfirmBorrar(true)} disabled={guardando}>
            Eliminar grupo
          </DeleteButton>
        </div>
      )}

      <ConfirmDialog {...aviso.dialogo} />
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
