import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWorkout } from '@/api/workouts.js';
import { listExercises } from '@/api/exercises.js';
import {
  readActiveSession,
  writeActiveSession,
  clearActiveSession,
  buildActiveSessionFromWorkout,
} from '@/utils/activeSession.js';
import { cargarOpciones, tipoDisponible } from '@/hooks/useOpcionesEjercicio.js';

// Hook para arrancar una sesión de entrenamiento desde una rutina.
// Encapsula todo el flujo, incluyendo la carga del catálogo de ejercicios
// para poder resolver los nombres si la rutina viene sin populate.
export function useStartSession() {
  const navigate = useNavigate();
  const [conflicto, setConflicto] = useState(false);
  const [pendingWorkoutId, setPendingWorkoutId] = useState(null);
  const [error, setError] = useState('');

  const arrancar = async (workoutId) => {
    setError('');
    try {
      // Cargamos rutina y catálogo en paralelo para minimizar latencia.
      // El catálogo se usa para resolver los nombres de los ejercicios de
      // la rutina si el backend no los devuelve populados.
      // Las opciones (grupos y tipos) dicen qué tipos están bloqueados (cardio).
      const [woRes, catRes, opciones] = await Promise.all([
        getWorkout(workoutId),
        listExercises(),
        cargarOpciones(),
      ]);
      const wo = woRes.data.workout;
      const catalogo = catRes.data.exercises;

      // Construimos un mapa {id → nombre} para resolución O(1) durante el build.
      const nombreById = new Map(catalogo.map((ex) => [ex._id, ex.nombre]));

      // Defensa: una rutina puede apuntar a un ejercicio que ya no existe (rutinas
      // de antes de que el borrado las limpiara). Si entrara en la sesión, el
      // servidor rechazaría el entreno entero al guardarlo. Se descarta aquí, sin
      // aviso: todavía no se ha registrado nada, así que no se pierde nada.
      const disponibles = wo.ejercicios.filter((ej) =>
        nombreById.has(String(ej.exerciseId)),
      );
      if (disponibles.length === 0) {
        setError('Esta rutina no tiene ejercicios disponibles. Edítala para añadir alguno.');
        return;
      }

      // Ejercicios que existen pero aún no se pueden registrar (cardio, 0030). Si la
      // rutina solo tiene de esos, no hay nada que hacer en la sesión.
      const bloqueados = new Set(
        catalogo.filter((ex) => !tipoDisponible(opciones, ex.tipo)).map((ex) => ex._id),
      );
      if (disponibles.every((ej) => bloqueados.has(String(ej.exerciseId)))) {
        setError(
          'Esta rutina solo tiene ejercicios de cardio, que estarán disponibles próximamente.',
        );
        return;
      }

      const nueva = buildActiveSessionFromWorkout(
        { ...wo, ejercicios: disponibles },
        nombreById,
        bloqueados,
        new Map(catalogo.map((ex) => [ex._id, { grupoMuscular: ex.grupoMuscular, tipo: ex.tipo }])),
      );
      writeActiveSession(nueva);
      navigate('/sessions/active');
    } catch {
      setError('No se pudo iniciar la sesión. Inténtalo de nuevo.');
    }
  };

  const start = (workoutId) => {
    const activa = readActiveSession();
    if (activa) {
      setPendingWorkoutId(workoutId);
      setConflicto(true);
      return;
    }
    arrancar(workoutId);
  };

  const confirmarDescartar = () => {
    clearActiveSession();
    setConflicto(false);
    if (pendingWorkoutId) arrancar(pendingWorkoutId);
  };

  const cancelarConflicto = () => {
    setConflicto(false);
    setPendingWorkoutId(null);
  };

  return { start, conflicto, confirmarDescartar, cancelarConflicto, error };
}