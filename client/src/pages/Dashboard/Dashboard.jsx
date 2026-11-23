import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listCharts } from '@/api/charts.js';
import GrupoProgreso from '@/components/GrupoProgreso/GrupoProgreso.jsx';
import { ID_TODOS, guardarOrden, leerOrden, ordenarGrupos } from '@/utils/grupos.js';
import { moverElemento } from '@/utils/orden.js';
import ListaOrdenable, { Asa } from '@/components/ListaOrdenable/ListaOrdenable.jsx';
import styles from '@/pages/Dashboard/Dashboard.module.css';

// Icono + para el botón "Nuevo grupo" del header.
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// Pantalla principal del progreso (bloque 9, DECISIONS.md 0034).
// "Todos" (todos los ejercicios; no se edita ni se borra) y los grupos del usuario, en el
// orden que él elija ("Ordenar", arrastrando). El orden se guarda en este dispositivo (utils/grupos.js).
// Cada tarjeta (GrupoProgreso) pide su propio progreso con su rango, así que aquí solo se
// cargan los grupos.
export default function Dashboard() {
  const navigate = useNavigate();
  const [grupos, setGrupos] = useState(null);
  const [error, setError] = useState('');
  const [ordenGuardado, setOrdenGuardado] = useState(() => leerOrden());
  const [ordenando, setOrdenando] = useState(false);

  useEffect(() => {
    listCharts()
      .then((res) => setGrupos(res.data.charts))
      .catch((err) => setError(err.response?.data?.message || 'Error al cargar tus grupos.'));
  }, []);

  // Mientras cargan los grupos, solo se puede mostrar "Todos".
  const porId = new Map((grupos ?? []).map((g) => [g._id, g]));
  const orden = ordenarGrupos([ID_TODOS, ...(grupos ?? []).map((g) => g._id)], ordenGuardado);
  const nombreDe = (id) => (id === ID_TODOS ? 'Todos' : porId.get(id).nombre);

  const mover = (desde, hasta) => {
    const nuevo = moverElemento(orden, desde, hasta);
    setOrdenGuardado(nuevo);
    guardarOrden(nuevo);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Progreso</h1>
        <div className={styles.acciones}>
          {grupos?.length > 0 && (
            <button type="button" className={styles.botonSecundario} onClick={() => setOrdenando((o) => !o)}>
              {ordenando ? 'Hecho' : 'Ordenar'}
            </button>
          )}
          {!ordenando && (
            <button type="button" className={styles.newGroupButton} onClick={() => navigate('/groups/new')} aria-label="Nuevo grupo">
              <IconPlus />
              <span className={styles.newGroupButtonLabel}>Nuevo grupo</span>
            </button>
          )}
        </div>
      </header>

      {error && <p className={styles.feedbackError}>{error}</p>}

      {ordenando ? (
        // Modo ordenar: lista compacta que se reordena arrastrando desde el asa ⋮⋮ (bloque
        // 9b; antes eran flechas). Las tarjetas no se cargan mientras tanto.
        <ListaOrdenable ids={orden} nombreDe={nombreDe} onMover={mover} className={`${styles.listaOrden} glassCard`}>
          {(id, asa) => (
            <div className={styles.filaOrden}>
              <Asa {...asa} />
              <span className={styles.nombreOrden}>{nombreDe(id)}</span>
            </div>
          )}
        </ListaOrdenable>
      ) : (
        orden.map((id) =>
          id === ID_TODOS ? (
            <GrupoProgreso key={id} nombre="Todos" />
          ) : (
            <GrupoProgreso key={id} grupoId={id} nombre={porId.get(id).nombre} numEjercicios={porId.get(id).exerciseIds.length} />
          ),
        )
      )}
    </div>
  );
}
