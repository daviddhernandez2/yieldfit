import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { listSessions } from '../../api/sessions.js';
import {
  calcularProgresoTodos,
  mediaGrupo,
  serieAgregadaTodos,
} from '../../utils/performance.js';
import styles from './Dashboard.module.css';

// Formatea un número decimal como porcentaje con signo: 3.14 → "+3,1%".
const formatPorcentaje = (n) => {
  const redondeado = Number(n.toFixed(1));
  const signo = redondeado > 0 ? '+' : '';
  return `${signo}${redondeado.toString().replace('.', ',')}%`;
};

// Determina la clase CSS según el signo del porcentaje.
const claseSigno = (n) => {
  if (n > 0) return styles.positive;
  if (n < 0) return styles.negative;
  return styles.neutral;
};

// Icono flecha arriba/abajo/plana según el signo.
const IconTrend = ({ value }) => {
  if (value > 0) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    );
  }
  if (value < 0) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
};

// Icono + para el botón "Nuevo grupo" del header.
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// Pantalla principal del progreso.
// En MVP muestra un único grupo por defecto llamado "Todos" que agrupa
// todos los ejercicios con al menos 2 sesiones registradas.
// El sistema de Charts personalizados se implementará en pulido.
export default function Dashboard() {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const response = await listSessions();
        setSesiones(response.data.sessions);
      } catch (err) {
        const message = err.response?.data?.message || 'Error al cargar el progreso.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const progresoPorEjercicio = useMemo(
    () => calcularProgresoTodos(sesiones),
    [sesiones]
  );

  const mediaTotal = useMemo(
    () => mediaGrupo(progresoPorEjercicio),
    [progresoPorEjercicio]
  );

  const serieGrafica = useMemo(
    () => serieAgregadaTodos(sesiones),
    [sesiones]
  );

  if (loading) {
    return <p className={styles.feedback}>Cargando...</p>;
  }

  if (error) {
    return <p className={styles.feedbackError}>{error}</p>;
  }

  return (
    <div className={styles.page}>
      {/* Header con título a la izquierda y botón de nuevo grupo a la derecha
          como acción principal de la pantalla. Deshabilitado en MVP hasta
          que se implemente el sistema completo de Charts personalizados. */}
      <header className={styles.header}>
        <h1 className={styles.title}>Progreso</h1>
        <button
          type="button"
          className={styles.newGroupButton}
          disabled
          title="Próximamente"
        >
          <IconPlus />
          <span>Nuevo grupo</span>
        </button>
      </header>

      {sesiones.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Aún no has terminado ninguna sesión.</p>
          <p className={styles.emptyHint}>
            Empieza una desde Entrenamiento para ver tu progreso aquí.
          </p>
        </div>
      ) : (
        <section className={`${styles.groupCard} glassCard`}>
          <div className={styles.groupHeader}>
            <h2 className={styles.groupName}>Todos</h2>
            {mediaTotal !== null && (
              <div className={`${styles.groupPercent} ${claseSigno(mediaTotal)}`}>
                <IconTrend value={mediaTotal} />
                <span>{formatPorcentaje(mediaTotal)}</span>
              </div>
            )}
          </div>

          {serieGrafica.length >= 2 ? (
            <div className={styles.chart}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={serieGrafica} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3EF87E" stopOpacity={0.6} />
                      <stop offset="50%" stopColor="#3EF87E" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#3EF87E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1f1f1f" vertical={false} />
                  <XAxis
                    dataKey="etiqueta"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={['dataMin - 5', 'dataMax + 5']}
                    tickFormatter={(v) => `${Math.round(v)}kg`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #1f1f1f',
                      borderRadius: '8px',
                      color: '#ffffff',
                    }}
                    formatter={(value) => [`${Math.round(value)} kg`, '1RM medio']}
                    labelStyle={{ color: '#888888' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="media1RM"
                    stroke="#3EF87E"
                    strokeWidth={2.5}
                    fill="url(#areaGradient)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#3EF87E' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={styles.chartEmpty}>
              Necesitas al menos 2 sesiones registradas para ver la gráfica.
            </p>
          )}

          {progresoPorEjercicio.length > 0 ? (
            <div className={styles.exerciseList}>
              {progresoPorEjercicio.map((ej) => (
                <div key={ej.exerciseId} className={styles.exerciseRow}>
                  <span className={styles.badge}>{ej.iniciales}</span>
                  <span className={styles.exerciseName}>{ej.nombre}</span>
                  <div className={`${styles.exercisePercent} ${claseSigno(ej.porcentaje)}`}>
                    <IconTrend value={ej.porcentaje} />
                    <span>{formatPorcentaje(ej.porcentaje)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.chartEmpty}>
              Ningún ejercicio tiene aún dos sesiones registradas.
            </p>
          )}
        </section>
      )}
    </div>
  );
}