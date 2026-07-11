import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useActiveSession } from '@/hooks/useActiveSession.js';
import styles from '@/components/MiniSession/MiniSession.module.css';

// Formatea segundos como MM:SS o HH:MM:SS según duración.
const formatTiempo = (segundos) => {
  const hh = Math.floor(segundos / 3600);
  const mm = Math.floor((segundos % 3600) / 60);
  const ss = segundos % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (hh > 0) return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  return `${pad(mm)}:${pad(ss)}`;
};

const IconChevronUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

// Barra flotante inferior visible cuando hay una sesión de entrenamiento
// activa y el usuario está en cualquier ruta distinta a /sessions/active.
// Al pulsarla, reabre la sesión activa para seguir entrenando.
// Se oculta automáticamente en /sessions/active para no duplicar información.
export default function MiniSession() {
  const session = useActiveSession();
  const navigate = useNavigate();
  const location = useLocation();

  // Fuerza re-render cada segundo para que el cronómetro avance.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [session]);

  if (!session) return null;
  if (location.pathname === '/sessions/active') return null;

  const elapsed = Math.floor((Date.now() - session.startTime) / 1000);

  // Detecta el ejercicio "en curso": el primero cuya última serie no está
  // completada, es la mejor heurística de "en qué va el usuario ahora".
  const ejercicioActual = session.ejercicios.find(
    (ej) => !ej.sets.every((s) => s.completada)
  );

  return (
    <button
      type="button"
      className={styles.bar}
      onClick={() => navigate('/sessions/active')}
      aria-label="Reabrir sesión activa"
    >
      <span className={styles.timer}>{formatTiempo(elapsed)}</span>
      <div className={styles.textBlock}>
        <span className={styles.workoutName}>{session.nombre}</span>
        {ejercicioActual && (
          <span className={styles.exerciseName}>
            {ejercicioActual.exerciseNombre}
          </span>
        )}
      </div>
      <span className={styles.chevron}>
        <IconChevronUp />
      </span>
    </button>
  );
}