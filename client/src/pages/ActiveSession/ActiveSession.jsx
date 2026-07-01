import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  readActiveSession,
  writeActiveSession,
  clearActiveSession,
} from '../../utils/activeSession.js';
import { createSession } from '../../api/sessions.js';
import Button from '../../components/Button/Button.jsx';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx';
import styles from './ActiveSession.module.css';

// Formatea segundos como MM:SS. Sigue creciendo pasada la hora (65:30, 120:00).
const formatTiempo = (segundos) => {
  const mm = Math.floor(segundos / 60);
  const ss = segundos % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};

// Iconos inline para mantener coherencia visual sin dependencias externas.
const IconChevronDown = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

// Pantalla principal de la sesión activa.
// Estructura del componente:
//  - session: objeto que replica el schema de localStorage.
//  - restTimer: descanso activo de la última serie completada (no persiste).
//  - expandedIndex: qué ejercicio está expandido (acordeón).
//  - Cronómetro grande calculado de forma pura: Date.now() - session.startTime.
export default function ActiveSession() {
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [restTimer, setRestTimer] = useState(null);
  const [confirmTerminar, setConfirmTerminar] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // tickTock forzará re-renders para cronómetro grande y timer de descanso.
  const [, setTick] = useState(0);

  // Carga inicial de la sesión desde localStorage. Si no existe, salimos.
  useEffect(() => {
    const activa = readActiveSession();
    if (!activa) {
      navigate('/workouts', { replace: true });
      return;
    }
    setSession(activa);
  }, [navigate]);

  // Intervalo global de 1s. Los dos cronómetros (grande y descanso)
  // se calculan por diferencia de timestamps, no por incrementos.
  // Ventaja: siempre son precisos aunque el navegador esté en segundo plano.
  useEffect(() => {
    if (!session) return;
    const intervalo = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(intervalo);
  }, [session]);

  // Persiste cualquier cambio de session en localStorage inmediatamente.
  // Ejecutar en cada cambio evita perder datos si el usuario cierra la pestaña.
  useEffect(() => {
    if (session) writeActiveSession(session);
  }, [session]);

  if (!session) return null;

  const elapsedSeconds = Math.floor((Date.now() - session.startTime) / 1000);

  // Helper para modificar un set concreto dentro del array anidado.
  // React necesita nuevas referencias para detectar cambios: map en todos los niveles.
  const updateSet = (exerciseIndex, setIndex, cambios) => {
    setSession((prev) => ({
      ...prev,
      ejercicios: prev.ejercicios.map((ej, i) =>
        i !== exerciseIndex
          ? ej
          : {
              ...ej,
              sets: ej.sets.map((set, j) =>
                j !== setIndex ? set : { ...set, ...cambios }
              ),
            }
      ),
    }));
  };

  // Toggle de completada. Si se marca, arranca el restTimer.
  // Si se desmarca, se limpia el restTimer si era el de esa serie.
  const handleToggleCompletada = (exerciseIndex, setIndex) => {
    const set = session.ejercicios[exerciseIndex].sets[setIndex];
    const nuevaCompletada = !set.completada;

    updateSet(exerciseIndex, setIndex, { completada: nuevaCompletada });

    if (nuevaCompletada) {
      setRestTimer({
        exerciseIndex,
        setIndex,
        completedAt: Date.now(),
      });
    } else if (
      restTimer &&
      restTimer.exerciseIndex === exerciseIndex &&
      restTimer.setIndex === setIndex
    ) {
      setRestTimer(null);
    }
  };

  // Añade un set vacío al final del ejercicio expandido.
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
                { peso: '', reps: '', excluido: false, completada: false },
              ],
            }
      ),
    }));
  };

  // Quita un set. Si tenía el timer activo, lo limpia.
  const handleQuitarSerie = (exerciseIndex, setIndex) => {
    setSession((prev) => ({
      ...prev,
      ejercicios: prev.ejercicios.map((ej, i) =>
        i !== exerciseIndex
          ? ej
          : { ...ej, sets: ej.sets.filter((_, j) => j !== setIndex) }
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

  // Acordeón: expande el ejercicio pulsado. Click en el ya expandido no hace nada
  // (siempre hay uno abierto para el flujo natural del entrenamiento).
  const handleToggleExpand = (index) => {
    setExpandedIndex((actual) => (actual === index ? actual : index));
  };

  const resumen = calcularResumen(session);

  const handleAbrirTerminar = () => {
    setErrorMessage('');
    if (resumen.setsCompletados === 0) {
      setErrorMessage('No has completado ninguna serie. Marca alguna antes de terminar.');
      return;
    }
    setConfirmTerminar(true);
  };

  // Terminar de verdad: POST al backend y limpia localStorage.
  // El payload preserva el numeroSerie original de cada set aunque se salten series.
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
            // Asignamos numeroSerie ANTES de filtrar para preservar el índice original.
            // Ejemplo: si el usuario completa serie 1 y 3 pero no la 2, el payload envía
            // numeroSerie: 1 y numeroSerie: 3. Esto refleja la realidad del entrenamiento.
            sets: ej.sets
              .map((s, idx) => ({
                numeroSerie: idx + 1,
                peso: Number(s.peso) || 0,
                reps: Number(s.reps) || 0,
                excluido: s.excluido,
                completada: s.completada,
              }))
              .filter((s) => s.completada)
              // Quitamos "completada" del payload final: es un flag interno del cliente.
              .map(({ completada, ...resto }) => resto),
          })),
      };

      await createSession(payload);
      clearActiveSession();
      navigate('/workouts');
    } catch (err) {
      const data = err.response?.data;
      const message = data?.details?.[0] || data?.message || 'Error al guardar la sesión.';
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
            {new Date(session.startTime).toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
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
            <div key={exerciseIndex} className={styles.exerciseCard}>
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
                  className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}
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
                  </div>

                  {ej.sets.map((set, setIndex) => {
                    const timerActivoEnEsta =
                      restTimer &&
                      restTimer.exerciseIndex === exerciseIndex &&
                      restTimer.setIndex === setIndex;

                    return (
                      <SetRow
                        key={setIndex}
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

      <Button variant="primary" fullWidth onClick={handleAbrirTerminar}>
        Terminar
      </Button>

      <ConfirmDialog
        open={confirmTerminar}
        title="¿Terminar la sesión?"
        message={
          `Resumen: ${resumen.ejerciciosCompletados} ejercicios · ${resumen.setsCompletados} series · ` +
          `${formatTiempo(elapsedSeconds)}. Se guardará y no podrás editarla.`
        }
        confirmLabel={submitting ? 'Guardando...' : 'Terminar y guardar'}
        cancelLabel="Cancelar"
        confirmVariant="primary"
        onConfirm={handleConfirmTerminar}
        onCancel={() => setConfirmTerminar(false)}
      />
    </div>
  );
}

// Componente aparte para cada fila de serie.
// Extraerlo del componente padre reduce ruido en el render principal.
function SetRow({
  setIndex,
  set,
  descansoSegundos,
  timerActivo,
  onChangePeso,
  onChangeReps,
  onToggleCompletada,
  onQuitar,
}) {
  // Si el timer está activo en esta serie, calcula segundos restantes.
  // Puro cálculo por diferencia, no acumulador; siempre correcto.
  let timerLabel = null;
  if (timerActivo) {
    const elapsed = Math.floor((Date.now() - timerActivo.completedAt) / 1000);
    const restante = Math.max(0, descansoSegundos - elapsed);
    timerLabel = formatTiempo(restante);
  }

  return (
    <div className={styles.setRow}>
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
      <button
        type="button"
        onClick={onToggleCompletada}
        className={`${styles.completeButton} ${set.completada ? styles.completed : ''}`}
        aria-label={set.completada ? 'Desmarcar como completada' : 'Marcar como completada'}
      >
        {set.completada ? <IconCheck /> : <span className={styles.circle}></span>}
      </button>
      <button
        type="button"
        onClick={onQuitar}
        className={styles.deleteSetButton}
        aria-label="Quitar serie"
      >
        <IconTrash />
      </button>

      {timerLabel && (
        <div className={styles.timerBar}>
          <span className={styles.timerLabel}>Descanso:</span>
          <span className={styles.timerValue}>{timerLabel}</span>
        </div>
      )}
    </div>
  );
}

// Calcula el resumen que se muestra en el modal de terminar.
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