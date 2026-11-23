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
import { getProgress } from '@/api/progress.js';
import styles from '@/pages/Dashboard/Dashboard.module.css';

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

// Formato de las fechas del eje X según lo que abarca el gráfico. Con más de un año,
// "11 oct" se repite cada año y no se sabe de cuál es: se muestra mes y año ("abr 2017").
// Con un año o menos, día y mes ("11 oct"). El tooltip siempre lleva la fecha completa.
const UN_ANIO_MS = 365 * 24 * 60 * 60 * 1000;
const FORMATO_CORTO = { day: 'numeric', month: 'short' };
const FORMATO_LARGO = { month: 'short', year: 'numeric' };
const FORMATO_COMPLETO = { day: 'numeric', month: 'short', year: 'numeric' };

const formatoEjeX = (serie) => {
  if (serie.length < 2) return FORMATO_CORTO;
  const abarca = new Date(serie.at(-1).fecha) - new Date(serie[0].fecha);
  return abarca > UN_ANIO_MS ? FORMATO_LARGO : FORMATO_CORTO;
};

// Iniciales de 2 letras para el badge: "Press banca con barra" → "PB"; "Sentadilla" → "SE".
const generarIniciales = (nombre) => {
  if (!nombre) return '?';
  const palabras = nombre.trim().split(/\s+/);
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
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
// Muestra un único grupo, "Todos", con los ejercicios que tienen al menos 2 sesiones
// en el rango. Los grupos personalizados (modelo Chart) llegan en el bloque 9.
export default function Dashboard() {
  // El progreso llega calculado del servidor (GET /api/progress): el cliente ya no
  // descarga las sesiones ni recalcula nada (DECISIONS.md, 0026). Sin rango = todo
  // el historial; el selector de rango llega en el bloque 9.
  const [progreso, setProgreso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const response = await getProgress();
        setProgreso(response.data.progreso);
      } catch (err) {
        const message = err.response?.data?.message || 'Error al cargar el progreso.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  // Datos para la gráfica: el índice base 100 de cada sesión, con la etiqueta del eje
  // (formato según el rango, ver formatoEjeX) y la fecha completa para el tooltip.
  const serieGrafica = useMemo(() => {
    const serie = progreso?.serie ?? [];
    const formato = formatoEjeX(serie);
    return serie.map((punto) => {
      const fecha = new Date(punto.fecha);
      return {
        indice: punto.indice,
        etiqueta: fecha.toLocaleDateString('es-ES', formato),
        fechaCompleta: fecha.toLocaleDateString('es-ES', FORMATO_COMPLETO),
      };
    });
  }, [progreso]);

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
          aria-label="Nuevo grupo"
        >
          <IconPlus />
          <span className={styles.newGroupButtonLabel}>Nuevo grupo</span>
        </button>
      </header>

      {progreso.sesiones === 0 ? (
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
            {progreso.porcentaje !== null && (
              <div className={`${styles.groupPercent} ${claseSigno(progreso.porcentaje)}`}>
                <IconTrend value={progreso.porcentaje} />
                <span>{formatPorcentaje(progreso.porcentaje)}</span>
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
                    domain={['dataMin - 2', 'dataMax + 2']}
                    // El índice empieza en 100: 112 significa +12 % desde el inicio.
                    tickFormatter={(v) => formatPorcentaje(v - 100)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #1f1f1f',
                      borderRadius: '8px',
                      color: '#ffffff',
                    }}
                    formatter={(value) => [formatPorcentaje(value - 100), 'Progreso']}
                    // La etiqueta del eje puede no llevar el día; el tooltip, siempre completa.
                    labelFormatter={(etiqueta, payload) => payload?.[0]?.payload.fechaCompleta ?? etiqueta}
                    labelStyle={{ color: '#888888' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="indice"
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

          {progreso.ejercicios.length > 0 ? (
            <div className={styles.exerciseList}>
              {progreso.ejercicios.map((ej) => (
                <div key={ej.exerciseId} className={styles.exerciseRow}>
                  <span className={styles.badge}>{generarIniciales(ej.nombre)}</span>
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