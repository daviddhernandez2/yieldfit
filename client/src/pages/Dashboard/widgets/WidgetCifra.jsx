import Esqueleto, { ZonaCarga } from '@/components/Esqueleto/Esqueleto.jsx';
import Variacion from '@/pages/Dashboard/widgets/Variacion.jsx';
import { nombreMes } from '@/utils/formato.js';
import styles from '@/pages/Dashboard/widgets/Widget.module.css';

// Widgets de una cifra, tamaño P (bloque 9d): "Progreso total" y "Sesiones totales". Los dos
// salen del progreso de todo el historial (GET /api/progress sin fechas), que el Dashboard pide
// una sola vez y reparte. Sin gráfica: la gráfica ya está en el grupo "Todos".
// "Sesiones totales" añade cómo va este mes frente al anterior (`mes`, de la actividad).
//
// Props: tipo ("progresoTotal" | "sesionesTotales"), progreso (null mientras carga), error,
// mes ({ actual, anterior, mesAnterior } o null mientras carga).
export default function WidgetCifra({ tipo, progreso, error, mes = null, className = '' }) {
  const esProgreso = tipo === 'progresoTotal';
  const etiqueta = esProgreso ? 'Progreso total' : 'Sesiones';

  return (
    <section className={`${styles.widget} ${styles.cifras} glassCard ${className}`} aria-label={etiqueta}>
      <h2 className={styles.etiqueta}>{etiqueta}</h2>
      {error ? (
        <p className={styles.error}>No se ha podido cargar.</p>
      ) : !progreso ? (
        <ZonaCarga etiqueta={`Cargando ${etiqueta.toLowerCase()}`} className={styles.esqueleto}>
          <Esqueleto ancho="70%" alto="1.75rem" />
          <Esqueleto ancho="50%" />
        </ZonaCarga>
      ) : esProgreso ? (
        <div className={styles.valor}>
          {/* Sin sesiones suficientes para comparar, el servidor devuelve porcentaje null. */}
          {progreso.porcentaje === null ? (
            <span className={styles.cifra}>—</span>
          ) : (
            <Variacion valor={progreso.porcentaje} tamano="grande" />
          )}
          <p className={styles.pie}>{progreso.porcentaje === null ? 'aún sin datos' : 'desde el inicio'}</p>
        </div>
      ) : (
        <div className={styles.valor}>
          <span className={styles.cifra}>{progreso.sesiones.toLocaleString('es-ES')}</span>
          {mes ? (
            // Diferencia de sesiones de este mes con el anterior ("↗ +2 vs. octubre"). El
            // texto accesible lo dice entero.
            <p className={styles.pie} aria-label={`Este mes, ${mes.actual} sesiones; en ${nombreMes(mes.mesAnterior)}, ${mes.anterior}`}>
              <Variacion valor={mes.actual - mes.anterior} unidad="" /> vs. {nombreMes(mes.mesAnterior)}
            </p>
          ) : (
            <p className={styles.pie}>en total</p>
          )}
        </div>
      )}
    </section>
  );
}
