import { useEffect, useState } from "react";
import { listExercises } from "@/api/exercises.js";
import Button from "@/components/Button/Button.jsx";
import ExercisePicker from "@/components/ExercisePicker/ExercisePicker.jsx";
import useOpcionesEjercicio from "@/hooks/useOpcionesEjercicio.js";
import styles from "@/pages/ActiveSession/ReemplazarEjercicio.module.css";

// Ventana para elegir el ejercicio que sustituye a otro en la sesión activa (bloque 6).
// Muestra el mismo catálogo que al crear una rutina (ExercisePicker), sin los ejercicios
// que ya están en la sesión. Solo elige: qué pasa después (confirmar si había series
// hechas, cambiar la sesión) lo decide ActiveSession con `onElegir(ejercicio)`.
//
// El catálogo se pide al abrir la ventana: es la única pantalla de la sesión que lo
// necesita, y así una sesión sin cobertura solo falla si de verdad se quiere reemplazar.
export default function ReemplazarEjercicio({ ejercicioActual, idsEnSesion, onElegir, onCerrar }) {
  const { opciones, error: errorOpciones } = useOpcionesEjercicio();
  const [catalogo, setCatalogo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let montado = true;
    listExercises()
      .then((res) => {
        if (montado) setCatalogo(res.data.exercises);
      })
      .catch(() => {
        if (montado) setError("No se ha podido cargar tu catálogo. Revisa la conexión.");
      });
    return () => {
      montado = false;
    };
  }, []);

  // Cerrar con Escape, como el resto de ventanas de la app.
  useEffect(() => {
    const alPulsar = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [onCerrar]);

  const fallo = error || errorOpciones;

  return (
    <div
      className={styles.overlay}
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-label={`Reemplazar ${ejercicioActual.exerciseNombre}`}
    >
      <div className={`${styles.panel} glassCard`} onClick={(e) => e.stopPropagation()}>
        <div>
          <h2 className={styles.title}>Reemplazar «{ejercicioActual.exerciseNombre}»</h2>
          <p className={styles.subtitle}>
            Solo para esta sesión: la rutina no cambia. Mantiene sus series y su descanso.
          </p>
        </div>

        {fallo && <p className={styles.error}>{fallo}</p>}
        {!fallo && (!catalogo || !opciones) && <p className={styles.subtitle}>Cargando...</p>}
        {!fallo && catalogo && opciones && (
          <ExercisePicker
            ejercicios={catalogo}
            opciones={opciones}
            excluidos={idsEnSesion}
            onElegir={(id) => onElegir(catalogo.find((ex) => ex._id === id))}
          />
        )}

        <Button variant="outline" onClick={onCerrar}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
