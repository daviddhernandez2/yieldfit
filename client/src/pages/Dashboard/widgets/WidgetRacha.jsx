import Cargando from '@/pages/Dashboard/widgets/Cargando.jsx';
import { textoRacha } from '@/utils/actividad.js';
import styles from '@/pages/Dashboard/widgets/Widget.module.css';

// Racha (bloque 9d), tamaño P: semanas seguidas con al menos una sesión. La semana en curso no
// la rompe mientras no termina (lo calcula el servidor, utils/actividad.js).
// Props: actividad (null mientras carga), error.
export default function WidgetRacha({ actividad, error, className = '' }) {
  const racha = actividad?.racha;
  return (
    <section className={`${styles.widget} ${styles.cifras} glassCard ${className}`} aria-label="Racha">
      <h2 className={styles.etiqueta}>Racha</h2>
      {error ? (
        <p className={styles.error}>No se ha podido cargar.</p>
      ) : !actividad ? (
        <Cargando que="la racha" />
      ) : (
        <div className={styles.valor}>
          <span className={styles.cifra}>{textoRacha(racha)}</span>
          <p className={styles.pie}>{racha.semanas === 0 ? 'entrena esta semana para empezarla' : 'seguidas entrenando'}</p>
        </div>
      )}
    </section>
  );
}
