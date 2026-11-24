import Cargando from '@/pages/Dashboard/widgets/Cargando.jsx';
import { textoRacha } from '@/utils/actividad.js';
import styles from '@/pages/Dashboard/widgets/Widget.module.css';

const FECHA_CORTA = { day: 'numeric', month: 'short' };

// Racha (bloque 9d): semanas seguidas con al menos una sesión. La semana en curso no la rompe
// mientras no termina (lo calcula el servidor, utils/actividad.js).
//   - P: la cifra y "seguidas entrenando".
//   - M (como en Strava): además, una fila de círculos con las últimas 12 semanas: lleno si
//     entrenaste, vacío si no, y la semana actual con un anillo aunque aún no tenga sesiones.
// Props: tamano ("P" | "M"), actividad (null mientras carga), error.
export default function WidgetRacha({ tamano, actividad, error, className = '' }) {
  const racha = actividad?.racha;
  const semanas = actividad?.semanas ?? [];
  const fecha = (inicio) => new Date(`${inicio}T00:00:00`).toLocaleDateString('es-ES', FECHA_CORTA);

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
          {tamano === 'M' && (
            // Los círculos son un dibujo: el lector de pantalla recibe el resumen en el texto.
            <div
              className={styles.semanasRacha}
              role="img"
              aria-label={`Últimas ${semanas.length} semanas: ${semanas.filter((s) => s.sesiones > 0).length} con entreno`}
            >
              {semanas.map((s, i) => {
                const actual = i === semanas.length - 1;
                return (
                  <span
                    key={s.inicio}
                    className={`${styles.circuloSemana} ${s.sesiones > 0 ? styles.circuloLleno : ''} ${actual ? styles.circuloActual : ''}`}
                    title={`${actual ? 'Esta semana' : `Semana del ${fecha(s.inicio)}`}: ${s.sesiones} ${s.sesiones === 1 ? 'sesión' : 'sesiones'}`}
                  />
                );
              })}
            </div>
          )}
          <p className={styles.pie}>{racha.semanas === 0 ? 'entrena esta semana para empezarla' : 'seguidas entrenando'}</p>
        </div>
      )}
    </section>
  );
}
