import Cargando from '@/pages/Dashboard/widgets/Cargando.jsx';
import { alturasBarras, mediaPorSemana } from '@/utils/actividad.js';
import styles from '@/pages/Dashboard/widgets/Widget.module.css';

const FECHA_CORTA = { day: 'numeric', month: 'short' };

// Frecuencia semanal (bloque 9d): barras con las sesiones de las últimas 12 semanas y la media.
// Cada barra lleva encima sus sesiones y, al pasar el ratón, su semana; debajo, la fecha de la
// primera semana y "esta semana". La semana actual (la última) va resaltada aunque tenga 0.
// Es igual en M y en G: el G solo da más alto a las barras.
// Props: actividad (null mientras carga), error.
export default function WidgetFrecuencia({ actividad, error, className = '' }) {
  const semanas = actividad?.semanas ?? [];
  const alturas = alturasBarras(semanas);
  const media = mediaPorSemana(semanas);
  const fecha = (inicio) => new Date(`${inicio}T00:00:00`).toLocaleDateString('es-ES', FECHA_CORTA);

  return (
    <section className={`${styles.widget} glassCard ${className}`} aria-label="Frecuencia semanal">
      <div className={styles.cabeceraCifra}>
        <h2 className={styles.etiqueta}>Frecuencia semanal</h2>
        {actividad && <span className={styles.dato}>{media.toLocaleString('es-ES')} por semana</span>}
      </div>
      {error ? (
        <p className={styles.error}>No se ha podido cargar.</p>
      ) : !actividad ? (
        <Cargando que="la frecuencia" />
      ) : (
        <>
          {/* Las barras son un dibujo: el lector de pantalla recibe los números en el texto. */}
          <div
            className={styles.barras}
            role="img"
            aria-label={`Sesiones por semana en las últimas ${semanas.length} semanas, de la más antigua a esta: ${semanas.map((s) => s.sesiones).join(', ')}`}
          >
            {semanas.map((s, i) => (
              <div
                key={s.inicio}
                className={`${styles.columnaBarra} ${i === semanas.length - 1 ? styles.columnaActual : ''}`}
                title={`${i === semanas.length - 1 ? 'Esta semana' : `Semana del ${fecha(s.inicio)}`}: ${s.sesiones} ${s.sesiones === 1 ? 'sesión' : 'sesiones'}`}
              >
                <span className={styles.numeroBarra}>{s.sesiones}</span>
                <div
                  className={`${styles.barra} ${i === semanas.length - 1 ? styles.barraActual : ''} ${s.sesiones === 0 ? styles.barraVacia : ''}`}
                  style={{ height: `${alturas[i]}%` }}
                />
              </div>
            ))}
          </div>
          <div className={styles.fechasBarras} aria-hidden="true">
            <span>{fecha(semanas[0].inicio)}</span>
            <span>esta semana</span>
          </div>
        </>
      )}
    </section>
  );
}
