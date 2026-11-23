import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listCharts } from '@/api/charts.js';
import GrupoProgreso from '@/components/GrupoProgreso/GrupoProgreso.jsx';
import styles from '@/pages/Dashboard/Dashboard.module.css';

// Icono + para el botón "Nuevo grupo" del header.
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// Pantalla principal del progreso.
// Muestra un único grupo, "Todos", con los ejercicios que tienen al menos 2 sesiones
// en el rango. Los grupos personalizados (modelo Chart) llegan en el bloque 9.
// Pantalla principal del progreso (bloque 9, DECISIONS.md 0034).
// Primero "Todos" (todos los ejercicios; no se edita ni se borra) y después los grupos del
// usuario en orden de creación. Cada tarjeta (GrupoProgreso) pide su propio progreso con
// su rango, así que aquí solo se cargan los grupos.
export default function Dashboard() {
  const navigate = useNavigate();
  const [grupos, setGrupos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listCharts()
      .then((res) => setGrupos(res.data.charts))
      .catch((err) => setError(err.response?.data?.message || 'Error al cargar tus grupos.'));
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Progreso</h1>
        <button
          type="button"
          className={styles.newGroupButton}
          onClick={() => navigate('/groups/new')}
          aria-label="Nuevo grupo"
        >
          <IconPlus />
          <span className={styles.newGroupButtonLabel}>Nuevo grupo</span>
        </button>
      </header>

      <GrupoProgreso nombre="Todos" />

      {error && <p className={styles.feedbackError}>{error}</p>}
      {grupos?.map((g) => (
        <GrupoProgreso key={g._id} grupoId={g._id} nombre={g.nombre} numEjercicios={g.exerciseIds.length} />
      ))}
    </div>
  );
}
