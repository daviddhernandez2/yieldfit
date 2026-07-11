import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  readActiveSession,
  writeActiveSession,
  clearActiveSession,
} from "../../utils/activeSession.js";
import { createSession } from "../../api/sessions.js";
import Button from "../../components/Button/Button.jsx";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog.jsx";
import styles from "./ActiveSession.module.css";

// Formatea segundos como MM:SS. Sigue creciendo pasada la hora (65:30).
const formatTiempo = (segundos) => {
  const mm = Math.floor(segundos / 60);
  const ss = segundos % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
};

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
//  - session: replica del schema de localStorage.
//  - restTimer: descanso actual (no persiste); recuerda el par ejercicio+serie
//    y el timestamp exacto en que se marcó completada. Se calcula por
//    diferencia de tiempos para ser preciso aunque el navegador se pause.
//  - expandedIndex: qué ejercicio está expandido (acordeón).
export default function ActiveSession() {
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [restTimer, setRestTimer] = useState(null);
  const [confirmTerminar, setConfirmTerminar] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [, setTick] = useState(0);

  useEffect(() => {
    const activa = readActiveSession();
    if (!activa) {
      navigate("/workouts", { replace: true });
      return;
    }
    setSession(activa);
  }, [navigate]);

  useEffect(() => {
    if (!session) return;
    const intervalo = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(intervalo);
  }, [session]);

  useEffect(() => {
    if (session) writeActiveSession(session);
  }, [session]);

  if (!session) return null;

  const elapsedSeconds = Math.floor((Date.now() - session.startTime) / 1000);

  const updateSet = (exerciseIndex, setIndex, cambios) => {
    setSession((prev) => ({
      ...prev,
      ejercicios: prev.ejercicios.map((ej, i) =>
        i !== exerciseIndex
          ? ej
          : {
              ...ej,
              sets: ej.sets.map((set, j) =>
                j !== setIndex ? set : { ...set, ...cambios },
              ),
            },
      ),
    }));
  };

  // Toggle de completada.
  //   - Si marca: arranca timer de descanso.
  //   - Si desmarca: limpia el timer si era el de esa serie.
  const handleToggleCompletada = (exerciseIndex, setIndex) => {
    const set = session.ejercicios[exerciseIndex].sets[setIndex];
    const nuevaCompletada = !set.completada;

    updateSet(exerciseIndex, setIndex, { completada: nuevaCompletada });

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

  const handleAñadirSerie = (exerciseIndex) => {
    setSession((prev) => ({
      ...prev,
      ejercicios: prev.ejercicios.map((ej, i) =>
        i !== exerciseIndex
          ? ej
          : {
              ...ej,
              sets: [
                ...ej.sets,
                {
                  id: crypto.randomUUID(),
                  peso: "",
                  reps: "",
                  completada: false,
                },
              ],
            },
      ),
    }));
  };

  const handleQuitarSerie = (exerciseIndex, setIndex) => {
    setSession((prev) => ({
      ...prev,
      ejercicios: prev.ejercicios.map((ej, i) =>
        i !== exerciseIndex
          ? ej
          : { ...ej, sets: ej.sets.filter((_, j) => j !== setIndex) },
      ),
    }));

    if (
      restTimer &&
      restTimer.exerciseIndex === exerciseIndex &&
      restTimer.setIndex === setIndex
    ) {
      setRestTimer(null);
    }
  };

  const handleToggleExpand = (index) => {
    setExpandedIndex((actual) => (actual === index ? actual : index));
  };

  const resumen = calcularResumen(session);

  const handleAbrirTerminar = () => {
    setErrorMessage("");
    if (resumen.setsCompletados === 0) {
      setErrorMessage(
        "No has completado ninguna serie. Marca alguna antes de terminar.",
      );
      return;
    }
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
        ejercicios: session.ejercicios
          .filter((ej) => ej.sets.some((s) => s.completada))
          .map((ej) => ({
            exerciseId: ej.exerciseId,
            sets: ej.sets
              .map((s, idx) => ({
                numeroSerie: idx + 1,
                peso: Number(s.peso) || 0,
                reps: Number(s.reps) || 0,
                completada: s.completada,
              }))
              .filter((s) => s.completada)
              .map(({ completada, ...resto }) => resto),
          })),
      };

      await createSession(payload);
      clearActiveSession();
      navigate("/history");
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

      <div className={styles.exercisesList}>
        {session.ejercicios.map((ej, exerciseIndex) => {
          const isExpanded = expandedIndex === exerciseIndex;
          const setsCompletados = ej.sets.filter((s) => s.completada).length;

          return (
            <div
              key={ej.exerciseId}
              className={`${styles.exerciseCard} glassCard ${setsCompletados === ej.sets.length && ej.sets.length > 0 ? styles.exerciseCardCompleted : ""}`}
            >
              <button
                type="button"
                className={styles.exerciseHeader}
                onClick={() => handleToggleExpand(exerciseIndex)}
              >
                <span className={styles.exerciseName}>{ej.exerciseNombre}</span>
                <span className={styles.exerciseMeta}>
                  {setsCompletados}/{ej.sets.length}
                </span>
                <span
                  className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ""}`}
                >
                  <IconChevronDown />
                </span>
              </button>

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
                      />
                    );
                  })}

                  <button
                    type="button"
                    className={styles.addSetButton}
                    onClick={() => handleAñadirSerie(exerciseIndex)}
                  >
                    + Añadir serie
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

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

      <ConfirmDialog
        open={confirmTerminar}
        title="¿Terminar la sesión?"
        message={
          `Resumen: ${resumen.ejerciciosCompletados} ejercicios · ${resumen.setsCompletados} series · ` +
          `${formatTiempo(elapsedSeconds)}. Se guardará y no podrás editarla.`
        }
        confirmLabel={submitting ? "Guardando..." : "Terminar y guardar"}
        cancelLabel="Cancelar"
        confirmVariant="primary"
        onConfirm={handleConfirmTerminar}
        onCancel={() => setConfirmTerminar(false)}
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
  descansoSegundos,
  timerActivo,
  onChangePeso,
  onChangeReps,
  onToggleCompletada,
  onReiniciarDescanso,
  onQuitar,
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
        placeholder="—"
      />
      <input
        type="number"
        inputMode="numeric"
        min="0"
        className={styles.setInput}
        value={set.reps}
        onChange={(e) => onChangeReps(e.target.value)}
        placeholder="—"
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

      {/* Barra de progreso animada del timer de descanso. Se dibuja como
          borde inferior de la fila y se rellena de izquierda a derecha. */}
      {timerActivo && (
        <div className={styles.timerTrack} aria-hidden="true">
          <div
            className={styles.timerFill}
            style={{ width: `${progresoPct}%` }}
          />
        </div>
      )}
    </div>
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