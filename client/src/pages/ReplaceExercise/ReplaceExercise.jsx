import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listExercises } from "@/api/exercises.js";
import { getPreviousSets } from "@/api/sessions.js";
import ExercisePicker from "@/components/ExercisePicker/ExercisePicker.jsx";
import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog.jsx";
import Button from "@/components/Button/Button.jsx";
import useOpcionesEjercicio from "@/hooks/useOpcionesEjercicio.js";
import { readActiveSession, writeActiveSession, contar } from "@/utils/activeSession.js";
import { sesionReducer, seriesAlReemplazar } from "@/utils/activeSessionReducer.js";
import formulario from "@/styles/paginaFormulario.module.css";
import styles from "@/pages/ReplaceExercise/ReplaceExercise.module.css";

const IconChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

// Lo que se espera a la "vez anterior" del ejercicio nuevo antes de volver a la sesión.
// Con mala cobertura no merece la pena esperar más: se vuelve sin ella.
const ESPERA_ANTERIOR_MS = 4000;

// Página para reemplazar un ejercicio de la sesión activa (bloque 6, 0032), en
// /sessions/active/replace/:index. Es una página completa (en el iPhone una ventana con un
// catálogo dentro no cabía bien).
//
// Cómo encaja con la sesión activa: la sesión vive en localStorage. Esta página la lee,
// aplica el reemplazo con el MISMO reducer que usa ActiveSession (0031), la guarda y vuelve.
// Al volver, ActiveSession la lee de localStorage como siempre.
export default function ReplaceExercise() {
  const navigate = useNavigate();
  const exerciseIndex = Number(useParams().index);

  // Se lee una vez al entrar: mientras se elige, la sesión no cambia.
  const [sesion] = useState(() => readActiveSession());
  const ejercicio = sesion?.ejercicios[exerciseIndex];

  const { opciones, error: errorOpciones } = useOpcionesEjercicio();
  const [catalogo, setCatalogo] = useState(null);
  const [error, setError] = useState("");
  // Ejercicio elegido en la lista. Elegir no reemplaza: hace falta pulsar el botón de abajo,
  // para que un toque por error al hacer scroll no cambie nada.
  const [elegidoId, setElegidoId] = useState(null);
  // Reemplazo pendiente de confirmar (el ejercicio tenía series hechas).
  const [pendiente, setPendiente] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // replace: true para que "atrás" desde la sesión no vuelva a esta página.
  const volverASesion = () => navigate("/sessions/active", { replace: true });

  useEffect(() => {
    // Sin sesión, con un índice que no existe o con un ejercicio bloqueado (no tiene botón
    // de reemplazar, pero la URL se puede escribir a mano): de vuelta a la sesión.
    if (!ejercicio || ejercicio.bloqueado) {
      volverASesion();
      return;
    }
    let montado = true;
    listExercises()
      .then((res) => montado && setCatalogo(res.data.exercises))
      .catch(() => montado && setError("No se ha podido cargar tu catálogo. Revisa la conexión."));
    return () => {
      montado = false;
    };
    // Solo al entrar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ejercicio || ejercicio.bloqueado) return null;

  const hechas = ejercicio.sets.filter((s) => s.completada).length;

  const reemplazar = async (nuevo) => {
    setGuardando(true);
    let nueva = sesionReducer(sesion, {
      type: "reemplazarEjercicio",
      exerciseIndex,
      exerciseId: nuevo._id,
      exerciseNombre: nuevo.nombre,
      ids: Array.from({ length: seriesAlReemplazar(ejercicio) }, () => crypto.randomUUID()),
    });
    // Se guarda ya: si la petición de abajo tarda o falla, el reemplazo está hecho.
    writeActiveSession(nueva);

    // La vez anterior del ejercicio nuevo (lo que el bloque 5 dejó pendiente para aquí).
    try {
      const respuesta = await Promise.race([
        getPreviousSets([nuevo._id]),
        new Promise((resolver) => setTimeout(resolver, ESPERA_ANTERIOR_MS)),
      ]);
      if (respuesta?.data) {
        nueva = sesionReducer(nueva, { type: "añadirAnteriores", anteriores: respuesta.data.anteriores });
        writeActiveSession(nueva);
      }
    } catch {
      // Sin "anterior" para el nuevo no se rompe nada.
    }
    volverASesion();
  };

  // Tocar un ejercicio lo marca; tocar el marcado lo desmarca.
  const handleElegir = (id) => {
    setElegidoId((actual) => (actual === id ? null : id));
  };

  const elegido = catalogo?.find((ex) => ex._id === elegidoId) ?? null;

  // Botón de abajo: si había series hechas, se pregunta antes (se perderán); si no, directo.
  const handleConfirmar = () => {
    if (hechas > 0) setPendiente(elegido);
    else reemplazar(elegido);
  };

  const fallo = error || errorOpciones;

  return (
    <div className={styles.page}>
      <header className={formulario.header}>
        <button
          type="button"
          onClick={volverASesion}
          className={formulario.backButton}
          aria-label="Volver a la sesión"
        >
          <IconChevronLeft />
        </button>
        <div>
          <h1 className={formulario.title}>Reemplazar ejercicio</h1>
          <p className={styles.subtitle}>
            «{ejercicio.exerciseNombre}» · solo para esta sesión: la rutina no cambia.
          </p>
        </div>
      </header>

      {fallo && <p className={styles.error}>{fallo}</p>}
      {!fallo && (guardando || !catalogo || !opciones) && (
        <p className={formulario.feedback}>{guardando ? "Reemplazando..." : "Cargando..."}</p>
      )}
      {!fallo && !guardando && catalogo && opciones && (
        <ExercisePicker
          ejercicios={catalogo}
          opciones={opciones}
          excluidos={new Set(sesion.ejercicios.map((ej) => ej.exerciseId))}
          seleccionados={elegidoId ? new Set([elegidoId]) : new Set()}
          onElegir={handleElegir}
          listaCompleta
        />
      )}

      {/* Franja pegada abajo (encima de la TabBar en el móvil): el botón se ve aunque el
          ejercicio elegido esté al final de la lista. */}
      {!fallo && !guardando && catalogo && opciones && (
        <div className={styles.confirmar}>
          <Button variant="primary" fullWidth disabled={!elegido} onClick={handleConfirmar}>
            {elegido ? `Reemplazar por «${elegido.nombre}»` : "Elige un ejercicio"}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={pendiente !== null}
        title={`¿Reemplazar «${ejercicio.exerciseNombre}»?`}
        message={
          pendiente
            ? `Tienes ${contar(hechas, "serie hecha", "series hechas")} de «${ejercicio.exerciseNombre}». Si lo reemplazas por «${pendiente.nombre}», se perderán.`
            : ""
        }
        confirmLabel="Reemplazar"
        cancelLabel="Cancelar"
        confirmVariant="danger"
        onConfirm={() => {
          const nuevo = pendiente;
          setPendiente(null);
          reemplazar(nuevo);
        }}
        onCancel={() => setPendiente(null)}
      />
    </div>
  );
}
