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
      const [woRes, catRes] = await Promise.all([
        getWorkout(workoutId),
        listExercises(),
      ]);
      const wo = woRes.data.workout;
      const catalogo = catRes.data.exercises;

      // Construimos un mapa {id → nombre} para resolución O(1) durante el build.
      const nombreById = new Map(catalogo.map((ex) => [ex._id, ex.nombre]));

      const nueva = buildActiveSessionFromWorkout(wo, nombreById);
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