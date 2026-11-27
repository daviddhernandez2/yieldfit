import { useCallback, useState, useEffect, useReducer } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  readActiveSession,
  writeActiveSession,
  clearActiveSession,
  ejerciciosBorradosConSeries,
  serieAnterior,
  avisoEjerciciosBorrados,
  contar,
} from "@/utils/activeSession.js";
import { createSession, getPreviousSets, getPreviousNote } from "@/api/sessions.js";
import { recordsDeSesion } from "@/utils/records.js";
import { sesionReducer } from "@/utils/activeSessionReducer.js";
import { listExercises } from "@/api/exercises.js";
import Button from "@/components/Button/Button.jsx";
import DeleteButton from "@/components/DeleteButton/DeleteButton.jsx";
import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog.jsx";
import Proximamente from "@/components/Proximamente/Proximamente.jsx";
import NombreEjercicio from "@/components/NombreEjercicio/NombreEjercicio.jsx";
import PictogramaEjercicio from "@/components/PictogramaEjercicio/PictogramaEjercicio.jsx";
import ListaOrdenable, { Asa } from "@/components/ListaOrdenable/ListaOrdenable.jsx";
import { indiceTrasMover } from "@/utils/orden.js";
import useOpcionesEjercicio from "@/hooks/useOpcionesEjercicio.js";
import styles from "@/pages/ActiveSession/ActiveSession.module.css";
import { formatCronometro, formatFechaRelativa } from "@/utils/formato.js";
import AreaTexto from "@/components/AreaTexto/AreaTexto.jsx";
import EsfuerzoSerie from "@/pages/ActiveSession/EsfuerzoSerie.jsx";
import { useAuth } from "@/hooks/useAuth.js";
import { seMuestra } from "@/utils/esfuerzo.js";

// Formatea segundos como MM:SS. Sigue creciendo pasada la hora (65:30).
// Cronómetro y descanso: "07:05", y desde la hora "1:30:05" (utils/formato.js, bloque 11d).
const formatTiempo = formatCronometro;

// Límite de las notas: el mismo que el modelo Session del servidor (bloque 11d).
const MAX_NOTAS = 500;

const IconChevronDown = () => (
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
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconCheck = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconTrash = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

// Pantalla principal de la sesión activa.
// Estructura:
//  - session: la sesión tal como se guarda en localStorage. Se cambia solo con
//    dispatch (useReducer); los cambios posibles están en utils/activeSessionReducer.js.
//  - restTimer: descanso actual (no persiste); recuerda el par ejercicio+serie
//    y el timestamp exacto en que se marcó completada. Se calcula por
//    diferencia de tiempos para ser preciso aunque el navegador se pause.
//  - expandedIndex: qué ejercicio está expandido (acordeón).
export default function ActiveSession() {
  const navigate = useNavigate();
  const location = useLocation();

  // La sesión se cambia con acciones (dispatch) y no con setSession: todos los cambios
  // posibles están en utils/activeSessionReducer.js, probados sin React (0031).
  const [session, dispatch] = useReducer(sesionReducer, null);
  // Solo para los textos de grupo y tipo bajo cada nombre ("Máquinas" con tilde). Si no
  // llegan (sin cobertura), NombreEjercicio muestra el valor guardado.
  const { opciones } = useOpcionesEjercicio();
  // Al volver de añadir ejercicios (bloque 11d) se abre el primero añadido; si no, el primero.
  const [expandedIndex, setExpandedIndex] = useState(() => location.state?.abrir ?? 0);
  // Esfuerzo por serie (bloque 5c): se ve solo con RPE o RIR elegido en Perfil, y con el rango que
  // manda el servidor. `esfuerzoAbierto` es el id de la serie con los valores abiertos: uno solo,
  // así que abrir otra cierra la anterior.
  const { user } = useAuth();
  const modoEsfuerzo = user?.preferencias?.esfuerzo ?? "no";
  const rangoEsfuerzo = opciones?.esfuerzo?.rpe ?? null;
  const conEsfuerzo = seMuestra(modoEsfuerzo) && rangoEsfuerzo !== null;
  const [esfuerzoAbierto, setEsfuerzoAbierto] = useState(null);
  const cerrarEsfuerzo = useCallback(() => setEsfuerzoAbierto(null), []);
  const [restTimer, setRestTimer] = useState(null);
  // Si la nota de la última vez se ve entera o recortada a 2 líneas (bloque 11d).
  const [notaAbierta, setNotaAbierta] = useState(false);
  const [confirmTerminar, setConfirmTerminar] = useState(false);
  const [confirmDescartar, setConfirmDescartar] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Ejercicios con series hechas que ya no existen: se calculan al pulsar
  // "Terminar sesión" y no se envían al guardar.
  const [borrados, setBorrados] = useState([]);

  const [, setTick] = useState(0);

  useEffect(() => {
    const activa = readActiveSession();
    if (!activa) {
      navigate("/workouts", { replace: true });
      return;
    }
    dispatch({ type: "cargar", sesion: activa });
  }, [navigate]);

  useEffect(() => {
    if (!session) return;
    const intervalo = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(intervalo);
  }, [session]);

  useEffect(() => {
    if (session) writeActiveSession(session);
  }, [session]);

  // Serie anterior: se pide UNA vez por sesión activa y se guarda dentro de ella (y por
  // tanto en localStorage). Si falla (p. ej. sin cobertura), el entreno sigue igual, sin
  // "anterior", y se reintenta la próxima vez que se abra la sesión. También cubre las
  // sesiones empezadas antes de que existiera la función: no tienen `anteriores`.
  const faltanAnteriores = Boolean(session) && !session.anteriores;
  useEffect(() => {
    if (!faltanAnteriores) return;
    let montado = true;
    // Los bloqueados (cardio) no tienen series en la sesión: no necesitan "anterior".
    const ids = session.ejercicios.filter((ej) => !ej.bloqueado).map((ej) => ej.exerciseId);
    if (ids.length === 0) return;
    getPreviousSets(ids)
      .then((response) => {
        if (montado) dispatch({ type: "guardarAnteriores", anteriores: response.data.anteriores });
      })
      .catch(() => {
        // Sin "anterior" no se rompe nada: se ignora a propósito.
      });
    return () => {
      montado = false;
    };
    // Solo depende de si faltan: `session` cambia con cada tecla y no debe repetir la petición.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faltanAnteriores]);

  // "La nota de la última vez" (bloque 11d): igual que la serie anterior, se pide una vez y se
  // guarda en la sesión (y en localStorage), así se sigue viendo al recargar sin cobertura.
  // Sin rutina (no debería pasar) no hay nada que buscar. Si falla, se reintenta al reabrir.
  const faltaNotaAnterior = Boolean(session?.workoutId) && session.notaAnterior === undefined;
  useEffect(() => {
    if (!faltaNotaAnterior) return;
    let montado = true;
    getPreviousNote(session.workoutId)
      .then((response) => {
        if (montado) dispatch({ type: "guardarNotaAnterior", notaAnterior: response.data.notaAnterior });
      })
      .catch(() => {
        // Sin la nota no se rompe nada: se ignora a propósito.
      });
    return () => {
      montado = false;
    };
    // Mismo motivo que arriba: solo depende de si falta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faltaNotaAnterior]);

  if (!session) return null;

  const elapsedSeconds = Math.floor((Date.now() - session.startTime) / 1000);

  const updateSet = (exerciseIndex, setIndex, cambios) => {
    dispatch({ type: "actualizarSerie", exerciseIndex, setIndex, cambios });
  };

  // Toggle de completada.
  //   - El cambio de la sesión (y el atajo de repetir al marcar) lo hace el reducer.
  //   - Aquí solo queda el timer de descanso, que es estado de la pantalla, no de la
  //     sesión: si marca, arranca; si desmarca, se limpia si era el de esa serie.
  const handleToggleCompletada = (exerciseIndex, setIndex) => {
    const nuevaCompletada = !session.ejercicios[exerciseIndex].sets[setIndex].completada;

    dispatch({ type: "alternarCompletada", exerciseIndex, setIndex });

    if (nuevaCompletada) {
      setRestTimer({ exerciseIndex, setIndex, completedAt: Date.now() });
    } else if (
      restTimer &&
      restTimer.exerciseIndex === exerciseIndex &&
      restTimer.setIndex === setIndex
    ) {
      setRestTimer(null);
    }
  };

  // Reactivar el timer de una serie ya completada (nuevo comportamiento del PDF).
  // Útil cuando el usuario quiere volver a cronometrar el mismo descanso sin
  // desmarcar la serie. Reinicia el completedAt al momento actual.
  const handleReiniciarDescanso = (exerciseIndex, setIndex) => {
    setRestTimer({ exerciseIndex, setIndex, completedAt: Date.now() });
  };

  // El id se genera aquí y no en el reducer, que tiene que ser puro (mismo resultado para
  // la misma acción). Es el id local estable que usa React como key de la fila.
  const handleAñadirSerie = (exerciseIndex) => {
    dispatch({ type: "añadirSerie", exerciseIndex, id: crypto.randomUUID() });
  };

  const handleQuitarSerie = (exerciseIndex, setIndex) => {
    dispatch({ type: "quitarSerie", exerciseIndex, setIndex });

    if (
      restTimer &&
      restTimer.exerciseIndex === exerciseIndex &&
      restTimer.setIndex === setIndex
    ) {
      setRestTimer(null);
    }
  };

  // Arrastrar un ejercicio (bloque 9b): el reducer cambia el orden; el temporizador y el
  // ejercicio abierto señalan por posición, así que se recolocan para seguir al mismo.
  const handleMoverEjercicio = (desde, hasta) => {
    dispatch({ type: "moverEjercicio", desde, hasta });
    setRestTimer((t) => t && { ...t, exerciseIndex: indiceTrasMover(t.exerciseIndex, desde, hasta) });
    setExpandedIndex((i) => indiceTrasMover(i, desde, hasta));
  };

  const handleToggleExpand = (index) => {
    setExpandedIndex((actual) => (actual === index ? actual : index));
  };

  const resumen = calcularResumen(session);

  // Ids de los ejercicios que no se enviarán al guardar.
  const idsBorrados = new Set(borrados.map((ej) => ej.exerciseId));
  // Resumen de lo que de verdad se va a guardar (sin los ejercicios borrados).
  const resumenAGuardar = calcularResumen({
    ...session,
    ejercicios: session.ejercicios.filter((ej) => !idsBorrados.has(ej.exerciseId)),
  });

  // Antes de abrir el diálogo se comprueba qué ejercicios siguen existiendo, para
  // que el aviso de lo que no se guardará aparezca ANTES de guardar.
  const handleAbrirTerminar = async () => {
    setErrorMessage("");
    if (resumen.setsCompletados === 0) {
      setErrorMessage(
        "No has completado ninguna serie. Marca alguna antes de terminar.",
      );
      return;
    }

    let idsExistentes;
    try {
      const res = await listExercises();
      idsExistentes = new Set(res.data.exercises.map((ex) => ex._id));
    } catch {
      setErrorMessage(
        "No se han podido comprobar tus ejercicios. Revisa la conexión e inténtalo de nuevo. La sesión sigue guardada en este dispositivo.",
      );
      return;
    }

    const nuevosBorrados = ejerciciosBorradosConSeries(session, idsExistentes);
    const quedaAlgo = session.ejercicios.some(
      (ej) => ej.sets.some((s) => s.completada) && idsExistentes.has(ej.exerciseId),
    );
    if (!quedaAlgo) {
      setErrorMessage(
        `${avisoEjerciciosBorrados(nuevosBorrados)} No queda ninguna serie que guardar: descarta la sesión.`,
      );
      return;
    }

    setBorrados(nuevosBorrados);
    setConfirmTerminar(true);
  };

  const handleConfirmTerminar = async () => {
    setSubmitting(true);
    try {
      const payload = {
        nombre: session.nombre,
        workoutId: session.workoutId,
        fecha: new Date(session.startTime).toISOString(),
        duracionSegundos: elapsedSeconds,
        // Vacía o solo espacios: no se envía (el servidor tampoco la guardaría).
        notas: session.notas?.trim() || undefined,
        ejercicios: session.ejercicios
          .filter((ej) => ej.sets.some((s) => s.completada))
          .filter((ej) => !idsBorrados.has(ej.exerciseId))
          .map((ej) => ({
            exerciseId: ej.exerciseId,
            sets: ej.sets
              .map((s, idx) => ({
                numeroSerie: idx + 1,
                peso: Number(s.peso) || 0,
                reps: Number(s.reps) || 0,
                // Solo si se eligió (bloque 5c): vacío no se envía y el servidor no guarda nada.
                ...(s.rpe != null && { rpe: s.rpe }),
                completada: s.completada,
              }))
              .filter((s) => s.completada)
              .map(({ completada, ...resto }) => resto),
          })),
      };

      const { data } = await createSession(payload);
      clearActiveSession();
      // Récords del entreno (bloque 4b): el servidor los marca al guardar y vienen en la
      // respuesta. Viajan al Historial en el estado de la navegación, que los muestra en un aviso.
      navigate("/history", { state: { records: recordsDeSesion(data.session) } });
    } catch (err) {
      const data = err.response?.data;
      const message =
        data?.details?.[0] || data?.message || "Error al guardar la sesión.";
      setErrorMessage(message);
      setConfirmTerminar(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Descartar la sesión: abandona el entrenamiento en curso sin guardarlo.
  // Pensado para cuando el usuario arranca una rutina por error. No llama a
  // la API porque la sesión aún no existe en el backend: solo vive en
  // localStorage. clearActiveSession dispara además el evento que hace
  // desaparecer la MiniSession del resto de la app.
  const handleConfirmDescartar = () => {
    clearActiveSession();
    navigate("/workouts");
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{session.nombre}</h1>
          <p className={styles.subtitle}>
            {new Date(session.startTime).toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className={styles.chrono}>{formatTiempo(elapsedSeconds)}</div>
      </header>

      {/* Nota de la sesión anterior de esta rutina (bloque 11d): bajo la cabecera, a todo el
          ancho (al lado del cronómetro quedaba en una columna estrecha), y como mucho en 2
          líneas para que sea discreta. Al tocarla se ve entera. */}
      {session.notaAnterior && (
        <button
          type="button"
          className={`${styles.notaAnterior} ${notaAbierta ? styles.notaAbierta : ""}`}
          aria-expanded={notaAbierta}
          onClick={() => setNotaAbierta((abierta) => !abierta)}
        >
          <span className={styles.notaAnteriorCuando}>
            La última vez ({formatFechaRelativa(session.notaAnterior.fecha)}):
          </span>{" "}
          «{session.notaAnterior.texto}»
        </button>
      )}

      {/* Los ejercicios se reordenan arrastrando desde el asa ⋮⋮ (bloque 9b). */}
      <ListaOrdenable
        ids={session.ejercicios.map((ej) => ej.exerciseId)}
        nombreDe={(id) => session.ejercicios.find((ej) => ej.exerciseId === id)?.exerciseNombre ?? ""}
        onMover={handleMoverEjercicio}
        className={styles.exercisesList}
      >
        {(id, asa) => {
          const exerciseIndex = session.ejercicios.findIndex((e) => e.exerciseId === id);
          const ej = session.ejercicios[exerciseIndex];
          const isExpanded = expandedIndex === exerciseIndex;
          const setsCompletados = ej.sets.filter((s) => s.completada).length;

          // Ejercicio bloqueado (cardio, 0030): se ve en la sesión pero no se abre ni se
          // registra. No tiene series, así que tampoco cuenta ni se envía al guardar.
          if (ej.bloqueado) {
            return (
              <div
                key={ej.exerciseId}
                className={`${styles.exerciseCard} ${styles.exerciseCardBloqueado} glassCard`}
              >
                <div className={styles.cabeceraFila}>
                  <Asa {...asa} />
                  <PictogramaEjercicio nombre={ej.exerciseNombre} presetId={ej.presetId} grupoMuscular={ej.grupoMuscular} tipo={ej.tipo} opciones={opciones} tam={48} />
                  <div className={styles.exerciseHeader}>
                    <NombreEjercicio className={styles.exerciseName} nombre={ej.exerciseNombre} grupoMuscular={ej.grupoMuscular} tipo={ej.tipo} opciones={opciones} />
                    <Proximamente />
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={ej.exerciseId}
              className={`${styles.exerciseCard} glassCard ${setsCompletados === ej.sets.length && ej.sets.length > 0 ? styles.exerciseCardCompleted : ""}`}
            >
              {/* El asa y el pictograma (bloque 10, botón de ver en grande) van fuera del botón de
                  abrir/cerrar: no se pueden anidar botones. */}
              <div className={styles.cabeceraFila}>
                <Asa {...asa} />
                <PictogramaEjercicio nombre={ej.exerciseNombre} presetId={ej.presetId} grupoMuscular={ej.grupoMuscular} tipo={ej.tipo} opciones={opciones} tam={48} />
                <button
                  type="button"
                  className={styles.exerciseHeader}
                  onClick={() => handleToggleExpand(exerciseIndex)}
                >
                  <NombreEjercicio className={styles.exerciseName} nombre={ej.exerciseNombre} grupoMuscular={ej.grupoMuscular} tipo={ej.tipo} opciones={opciones} />
                  <span className={styles.exerciseMeta}>
                    {setsCompletados}/{ej.sets.length}
                  </span>
                  <span
                    className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ""}`}
                  >
                    <IconChevronDown />
                  </span>
                </button>
              </div>

              {isExpanded && (
                <div className={styles.exerciseBody}>
                  <div className={styles.setsHeader}>
                    <span>#</span>
                    <span>Peso (kg)</span>
                    <span>Reps</span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                  {ej.sets.map((set, setIndex) => {
                    const timerActivoEnEsta =
                      restTimer &&
                      restTimer.exerciseIndex === exerciseIndex &&
                      restTimer.setIndex === setIndex;

                    return (
                      <SetRow
                        key={set.id}
                        setIndex={setIndex}
                        set={set}
                        anterior={serieAnterior(session, exerciseIndex, setIndex)}
                        descansoSegundos={ej.descansoSegundos}
                        timerActivo={timerActivoEnEsta ? restTimer : null}
                        onChangePeso={(v) =>
                          updateSet(exerciseIndex, setIndex, { peso: v })
                        }
                        onChangeReps={(v) =>
                          updateSet(exerciseIndex, setIndex, { reps: v })
                        }
                        onToggleCompletada={() =>
                          handleToggleCompletada(exerciseIndex, setIndex)
                        }
                        onReiniciarDescanso={() =>
                          handleReiniciarDescanso(exerciseIndex, setIndex)
                        }
                        onQuitar={() =>
                          handleQuitarSerie(exerciseIndex, setIndex)
                        }
                        esfuerzo={
                          conEsfuerzo && {
                            modo: modoEsfuerzo,
                            rango: rangoEsfuerzo,
                            abierta: esfuerzoAbierto === set.id,
                            onAbrir: () => setEsfuerzoAbierto(set.id),
                            onCerrar: cerrarEsfuerzo,
                            onElegir: (rpe) => updateSet(exerciseIndex, setIndex, { rpe }),
                          }
                        }
                      />
                    );
                  })}

                  <div className={styles.accionesEjercicio}>
                    <button
                      type="button"
                      className={styles.accionEjercicio}
                      onClick={() => handleAñadirSerie(exerciseIndex)}
                    >
                      + Añadir serie
                    </button>
                    <button
                      type="button"
                      className={styles.accionEjercicio}
                      // Página propia (en el iPhone no cabía una ventana): lee la
                      // sesión de localStorage, la cambia y vuelve aquí (0032).
                      onClick={() => navigate(`/sessions/active/replace/${exerciseIndex}`)}
                    >
                      Reemplazar ejercicio
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        }}
      </ListaOrdenable>

      {/* Añadir ejercicios a la sesión en curso (bloque 11d): la misma página que reemplazar,
          sin índice. Entran al final y solo en esta sesión; la rutina no cambia. */}
      <button
        type="button"
        className={`${styles.accionEjercicio} ${styles.nuevoEjercicio}`}
        onClick={() => navigate("/sessions/active/add")}
      >
        + Añadir ejercicio
      </button>

      {/* Notas (bloque 11d): encima de "Terminar sesión" y no en el diálogo de terminar, para
          poder escribirlas durante el entreno y porque en el iPhone el teclado tapa un diálogo.
          Se guardan con la sesión en localStorage mientras se escribe. */}
      <AreaTexto
        id="notas-sesion"
        label="Notas"
        opcional
        rows={3}
        maxLength={MAX_NOTAS}
        placeholder="Cómo ha ido, qué cambiar la próxima vez…"
        value={session.notas ?? ""}
        onChange={(e) => dispatch({ type: "escribirNotas", texto: e.target.value })}
      />

      {errorMessage && (
        <div className={styles.errorBanner} role="alert">
          {errorMessage}
        </div>
      )}

      <div className={styles.terminarWrapper}>
        <Button variant="primary" onClick={handleAbrirTerminar}>
          Terminar sesión
        </Button>
      </div>

      {/* Acción destructiva discreta al final, alineada a la derecha.
          Mismo patrón que SessionDetail y ExerciseForm: DeleteButton estándar
          en lugar de un botón rojo grande. Permite abandonar una sesión
          arrancada por error sin tener que completarla para salir de ella. */}
      <div className={styles.deleteWrapper}>
        <DeleteButton
          onClick={() => setConfirmDescartar(true)}
          disabled={submitting}
        >
          Descartar sesión
        </DeleteButton>
      </div>

      <ConfirmDialog
        open={confirmTerminar}
        title="¿Terminar la sesión?"
        message={
          `Resumen: ${contar(resumenAGuardar.ejerciciosCompletados, "ejercicio", "ejercicios")} · ` +
          `${contar(resumenAGuardar.setsCompletados, "serie", "series")} · ` +
          `${formatTiempo(elapsedSeconds)}. Se guardará y no podrás editarla.` +
          (borrados.length > 0 ? ` ${avisoEjerciciosBorrados(borrados)}` : "")
        }
        confirmLabel={submitting ? "Guardando..." : "Terminar y guardar"}
        cancelLabel="Cancelar"
        confirmVariant="primary"
        onConfirm={handleConfirmTerminar}
        onCancel={() => setConfirmTerminar(false)}
      />

      {/* Diálogo de descarte. Verbo intencionadamente distinto al de
          SessionDetail ("Eliminar"): allí se borra un registro histórico ya
          guardado en la base de datos; aquí se tira un entrenamiento que
          nunca llegó a guardarse. */}
      <ConfirmDialog
        open={confirmDescartar}
        title="¿Descartar esta sesión?"
        message="Se perderá todo lo que hayas registrado en este entrenamiento. Esta acción no se puede deshacer."
        confirmLabel="Descartar"
        cancelLabel="Cancelar"
        confirmVariant="danger"
        onConfirm={handleConfirmDescartar}
        onCancel={() => setConfirmDescartar(false)}
      />
    </div>
  );
}

// Fila de serie individual.
//   - Cuando está completada, tiene borde verde persistente.
//   - El pill del descanso es siempre visible si hay descanso configurado:
//     verde cuando esta serie está contando atrás, gris cuando no.
//   - Cuando el timer de descanso está activo, además muestra una barra
//     inferior de progreso que se llena de izquierda a derecha.
function SetRow({
  setIndex,
  set,
  anterior,
  descansoSegundos,
  timerActivo,
  onChangePeso,
  onChangeReps,
  onToggleCompletada,
  onReiniciarDescanso,
  onQuitar,
  esfuerzo,
}) {
  // Cálculo puro del tiempo de descanso.
  //   - Si esta serie tiene el timer activo → cuenta atrás en curso.
  //   - Si no, y hay descanso configurado, mostramos el descanso total como
  //     referencia estática. Así el usuario ve siempre cuánto descanso toca
  //     entre serie y serie sin tener que abrir la rutina.
  let progresoPct = 0;
  let tiempoLabel = null;
  let timerCorriendo = false;

  if (timerActivo && descansoSegundos > 0) {
    const elapsed = (Date.now() - timerActivo.completedAt) / 1000;
    const restante = Math.max(0, descansoSegundos - elapsed);
    progresoPct = Math.min(100, (elapsed / descansoSegundos) * 100);
    tiempoLabel = formatTiempo(Math.ceil(restante));
    timerCorriendo = restante > 0;
  } else if (descansoSegundos > 0) {
    tiempoLabel = formatTiempo(descansoSegundos);
  }

  // Click sobre la fila cuando ya está completada → reactivar el timer
  // de descanso. No dispara si el click viene de los inputs o botones.
  const handleRowClick = (e) => {
    if (!set.completada) return;
    if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;
    if (e.target.closest("button")) return;
    onReiniciarDescanso();
  };

  return (
    // Envoltorio de la fila (bloque 11d): la barra del descanso va aquí y no dentro de la fila,
    // que es una retícula. En el iPhone (WebKit), un hijo con position: absolute dentro de una
    // retícula no se pintaba donde tocaba y la barra no se veía.
    <>
    <div className={styles.filaSerie}>
      <div
        className={`${styles.setRow} ${set.completada ? styles.setRowCompleted : ""}`}
        onClick={handleRowClick}
      >
        <span className={styles.setIndex}>{setIndex + 1}</span>
        <input
          type="number"
          inputMode="decimal"
          step="0.5"
          min="0"
          className={styles.setInput}
          value={set.peso}
          onChange={(e) => onChangePeso(e.target.value)}
          // Vacío, muestra en gris lo de la vez anterior (setInput::placeholder usa el
          // color de texto secundario, para no confundirlo con un valor escrito).
          placeholder={anterior?.peso != null ? String(anterior.peso) : "—"}
          aria-label={
            anterior?.peso != null
              ? `Peso de la serie ${setIndex + 1}. La vez anterior: ${anterior.peso} kg`
              : `Peso de la serie ${setIndex + 1}`
          }
        />
        <input
          type="number"
          inputMode="numeric"
          min="0"
          className={styles.setInput}
          value={set.reps}
          onChange={(e) => onChangeReps(e.target.value)}
          placeholder={anterior?.reps != null ? String(anterior.reps) : "—"}
          aria-label={
            anterior?.reps != null
              ? `Repeticiones de la serie ${setIndex + 1}. La vez anterior: ${anterior.reps}`
              : `Repeticiones de la serie ${setIndex + 1}`
          }
        />
        {/* Pill de descanso: siempre visible si hay descanso configurado.
            - En serie completada + timer activo: cuenta atrás en verde brillante.
            - En el resto: descanso total en gris como referencia. */}
        {tiempoLabel ? (
          <span
            className={`${styles.restPill} ${timerCorriendo ? styles.restPillActive : ""}`}
            aria-hidden="true"
          >
            {tiempoLabel}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onToggleCompletada}
          className={`${styles.completeButton} ${set.completada ? styles.completed : ""}`}
          aria-label={
            set.completada
              ? "Desmarcar como completada"
              : "Marcar como completada"
          }
        >
          {set.completada ? (
            <IconCheck />
          ) : (
            <span className={styles.circle}></span>
          )}
        </button>
        <button
          type="button"
          onClick={onQuitar}
          className={styles.deleteSetButton}
          aria-label="Quitar serie"
        >
          <IconTrash />
        </button>
      </div>

      {/* Barra de progreso animada del timer de descanso. Se dibuja como borde inferior de
          la fila y se rellena de izquierda a derecha con scaleX (no con width): WebKit la
          anima mejor y no obliga a recalcular el diseño de la página cada segundo. */}
      {timerActivo && (
        <div className={styles.timerTrack} aria-hidden="true">
          <div
            className={styles.timerFill}
            style={{ transform: `scaleX(${progresoPct / 100})` }}
          />
        </div>
      )}
      </div>
      {/* Esfuerzo (bloque 5c): fuera de la fila, así la barra del descanso sigue pegada a ella y,
          con "no mostrar", la fila queda exactamente como antes. */}
      {esfuerzo && (
        <EsfuerzoSerie
          rpe={set.rpe ?? null}
          rpeAnterior={anterior?.rpe ?? null}
          numeroSerie={setIndex + 1}
          {...esfuerzo}
        />
      )}
    </>
  );
}

function calcularResumen(session) {
  let ejerciciosCompletados = 0;
  let setsCompletados = 0;
  for (const ej of session.ejercicios) {
    const completadosEjercicio = ej.sets.filter((s) => s.completada).length;
    if (completadosEjercicio > 0) {
      ejerciciosCompletados += 1;
      setsCompletados += completadosEjercicio;
    }
  }
  return { ejerciciosCompletados, setsCompletados };
}