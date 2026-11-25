import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listExercises } from "@/api/exercises.js";
import BotonIcono from "@/components/BotonIcono/BotonIcono.jsx";
import { getPreviousSets } from "@/api/sessions.js";
import ExercisePicker from "@/components/ExercisePicker/ExercisePicker.jsx";
import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog.jsx";
import Button from "@/components/Button/Button.jsx";
import useOpcionesEjercicio from "@/hooks/useOpcionesEjercicio.js";
import { readActiveSession, writeActiveSession, contar } from "@/utils/activeSession.js";
import { sesionReducer, seriesAlReemplazar } from "@/utils/activeSessionReducer.js";
import { SERIES_POR_DEFECTO, DESCANSO_POR_DEFECTO } from "@/utils/porDefecto.js";
import formulario from "@/styles/paginaFormulario.module.css";
import styles from "@/pages/ReplaceExercise/ReplaceExercise.module.css";

// Lo que se espera a la "vez anterior" del ejercicio nuevo antes de volver a la sesión.
// Con mala cobertura no merece la pena esperar más: se vuelve sin ella.
const ESPERA_ANTERIOR_MS = 4000;

// Página para elegir ejercicios de la sesión activa, en dos modos:
//   - Reemplazar uno (bloque 6, 0032), en /sessions/active/replace/:index.
//   - Añadir uno o varios al final (bloque 11d), en /sessions/active/add (sin índice).
// Es una página completa (en el iPhone una ventana con un catálogo dentro no cabía bien).
// Las dos cosas son "elegir del catálogo y cambiar la sesión": por eso comparten página en vez
// de tener dos casi iguales. El modo lo decide la URL.
//
// Cómo encaja con la sesión activa: la sesión vive en localStorage. Esta página la lee,
// aplica el reemplazo con el MISMO reducer que usa ActiveSession (0031), la guarda y vuelve.
// Al volver, ActiveSession la lee de localStorage como siempre.
export default function ReplaceExercise() {
  const navigate = useNavigate();
  const { index } = useParams();
  const añadiendo = index === undefined;
  const exerciseIndex = Number(index);

  // Se lee una vez al entrar: mientras se elige, la sesión no cambia.
  const [sesion] = useState(() => readActiveSession());
  const ejercicio = sesion?.ejercicios[exerciseIndex];
  // Al añadir no hay un ejercicio de partida: basta con que haya sesión.
  const valida = añadiendo ? Boolean(sesion) : Boolean(ejercicio) && !ejercicio.bloqueado;

  const { opciones, error: errorOpciones } = useOpcionesEjercicio();
  const [catalogo, setCatalogo] = useState(null);
  const [error, setError] = useState("");
  // Ejercicios elegidos en la lista (al reemplazar, como mucho uno; al añadir, varios, en el
  // orden en que se tocan). Elegir no cambia nada: hace falta pulsar el botón de abajo, para
  // que un toque por error al hacer scroll no cambie la sesión.
  const [elegidosIds, setElegidosIds] = useState([]);
  // Reemplazo pendiente de confirmar (el ejercicio tenía series hechas).
  const [pendiente, setPendiente] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // replace: true para que "atrás" desde la sesión no vuelva a esta página.
  const volverASesion = () => navigate("/sessions/active", { replace: true });

  useEffect(() => {
    // Sin sesión, con un índice que no existe o con un ejercicio bloqueado (no tiene botón
    // de reemplazar, pero la URL se puede escribir a mano): de vuelta a la sesión.
    if (!valida) {
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

  if (!valida) return null;

  const hechas = añadiendo ? 0 : ejercicio.sets.filter((s) => s.completada).length;

  // La vez anterior de los ejercicios nuevos (serie anterior, bloque 5). Se espera poco: con
  // mala cobertura se vuelve sin ella. La sesión ya está guardada antes de pedirla.
  const conAnteriores = async (nueva, ids) => {
    try {
      const respuesta = await Promise.race([
        getPreviousSets(ids),
        new Promise((resolver) => setTimeout(resolver, ESPERA_ANTERIOR_MS)),
      ]);
      if (respuesta?.data) {
        const conEllas = sesionReducer(nueva, { type: "añadirAnteriores", anteriores: respuesta.data.anteriores });
        writeActiveSession(conEllas);
      }
    } catch {
      // Sin "anterior" para los nuevos no se rompe nada.
    }
  };

  const reemplazar = async (nuevo) => {
    setGuardando(true);
    const nueva = sesionReducer(sesion, {
      type: "reemplazarEjercicio",
      exerciseIndex,
      exerciseId: nuevo._id,
      exerciseNombre: nuevo.nombre,
      grupoMuscular: nuevo.grupoMuscular,
      tipo: nuevo.tipo,
      ids: Array.from({ length: seriesAlReemplazar(ejercicio) }, () => crypto.randomUUID()),
    });
    // Se guarda ya: si la petición de abajo tarda o falla, el reemplazo está hecho.
    writeActiveSession(nueva);
    await conAnteriores(nueva, [nuevo._id]);
    volverASesion();
  };

  // Añadir al final, con las series y el descanso por defecto (los mismos que en una rutina
  // nueva). Se abre la sesión en el primero añadido.
  const añadir = async (nuevos) => {
    setGuardando(true);
    const nueva = sesionReducer(sesion, {
      type: "añadirEjercicios",
      ejercicios: nuevos.map((ex) => ({
        exerciseId: ex._id,
        exerciseNombre: ex.nombre,
        grupoMuscular: ex.grupoMuscular,
        tipo: ex.tipo,
        descansoSegundos: DESCANSO_POR_DEFECTO,
        ids: Array.from({ length: SERIES_POR_DEFECTO }, () => crypto.randomUUID()),
      })),
    });
    writeActiveSession(nueva);
    await conAnteriores(nueva, nuevos.map((ex) => ex._id));
    navigate("/sessions/active", { replace: true, state: { abrir: sesion.ejercicios.length } });
  };

  // Tocar un ejercicio lo marca; tocar el marcado lo desmarca. Al reemplazar, marcar otro
  // cambia la elección; al añadir, se suma a la lista.
  const handleElegir = (id) => {
    setElegidosIds((actuales) => {
      if (actuales.includes(id)) return actuales.filter((x) => x !== id);
      return añadiendo ? [...actuales, id] : [id];
    });
  };

  const elegidos = elegidosIds.map((id) => catalogo?.find((ex) => ex._id === id)).filter(Boolean);
  const elegido = elegidos[0] ?? null;

  // Botón de abajo. Al añadir, directo. Al reemplazar, si había series hechas se pregunta
  // antes (se perderán); si no, directo.
  const handleConfirmar = () => {
    if (añadiendo) añadir(elegidos);
    else if (hechas > 0) setPendiente(elegido);
    else reemplazar(elegido);
  };

  const textoBoton = () => {
    if (elegidos.length === 0) return "Elige un ejercicio";
    if (!añadiendo) return `Reemplazar por «${elegido.nombre}»`;
    if (elegidos.length === 1) return `Añadir «${elegido.nombre}»`;
    return `Añadir ${elegidos.length} ejercicios`;
  };

  const fallo = error || errorOpciones;

  return (
    <div className={styles.page}>
      <header className={formulario.header}>
        <BotonIcono icono="atras" etiqueta="Volver a la sesión" onClick={volverASesion} />
        <div>
          <h1 className={formulario.title}>{añadiendo ? "Añadir ejercicios" : "Reemplazar ejercicio"}</h1>
          <p className={styles.subtitle}>
            {añadiendo ? "Al final de la sesión" : `«${ejercicio.exerciseNombre}»`} · solo para esta
            sesión: la rutina no cambia.
          </p>
        </div>
      </header>

      {fallo && <p className={styles.error}>{fallo}</p>}
      {!fallo && (guardando || !catalogo || !opciones) && (
        <p className={formulario.feedback}>
          {guardando ? (añadiendo ? "Añadiendo..." : "Reemplazando...") : "Cargando..."}
        </p>
      )}
      {!fallo && !guardando && catalogo && opciones && (
        <ExercisePicker
          ejercicios={catalogo}
          opciones={opciones}
          excluidos={new Set(sesion.ejercicios.map((ej) => ej.exerciseId))}
          seleccionados={new Set(elegidosIds)}
          onElegir={handleElegir}
          // Creado desde el buscador: queda elegido; falta pulsar el botón de abajo.
          onCreado={(ex) => {
            setCatalogo((prev) => [...prev, ex]);
            setElegidosIds((actuales) => (añadiendo ? [...actuales, ex._id] : [ex._id]));
          }}
          listaCompleta
        />
      )}

      {/* Franja pegada abajo (encima de la TabBar en el móvil): el botón se ve aunque el
          ejercicio elegido esté al final de la lista. */}
      {!fallo && !guardando && catalogo && opciones && (
        <div className={styles.confirmar}>
          <Button variant="primary" fullWidth disabled={!elegido} onClick={handleConfirmar}>
            {textoBoton()}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={pendiente !== null}
        title={pendiente ? `¿Reemplazar «${ejercicio.exerciseNombre}»?` : ""}
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
