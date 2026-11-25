import MarcoWidget from '@/pages/Dashboard/widgets/MarcoWidget.jsx';
import Cargando from '@/pages/Dashboard/widgets/Cargando.jsx';
import Variacion from '@/pages/Dashboard/widgets/Variacion.jsx';
import styles from '@/pages/Dashboard/widgets/Widget.module.css';

// Widgets de una cifra, tamaño P (bloque 9d): "Progreso total" y "Sesiones totales". Los dos
// salen del progreso de todo el historial (GET /api/progress sin fechas), que el Dashboard pide
// una sola vez y reparte. Sin gráfica: la gráfica ya está en el grupo "Todos".
// Anatomía: cabecera, cifra de 32 px y pie 8 px por debajo.
// Props: tipo ("progresoTotal" | "sesionesTotales"), progreso (null mientras carga), error.
export default function WidgetCifra({ tipo, progreso, error, className = '' }) {
  const esProgreso = tipo === 'progresoTotal';
  const etiqueta = esProgreso ? 'Progreso total' : 'Sesiones totales';

  let cuerpo;
  if (error) cuerpo = <p className={styles.error}>No se ha podido cargar.</p>;
  else if (!progreso) cuerpo = <Cargando que={etiqueta.toLowerCase()} />;
  else if (esProgreso) {
    // Sin sesiones suficientes para comparar, el servidor devuelve porcentaje null.
    cuerpo = (
      <>
        <span className={styles.cifra}>
          {progreso.porcentaje === null ? '—' : <Variacion valor={progreso.porcentaje} tamano="grande" />}
        </span>
        <span className={styles.pie}>{progreso.porcentaje === null ? 'aún sin datos' : 'desde el inicio'}</span>
      </>
    );
  } else {
    cuerpo = (
      <>
        <span className={styles.cifra}>{progreso.sesiones.toLocaleString('es-ES')}</span>
        <span className={styles.pie}>en total</span>
      </>
    );
  }

  return (
    <MarcoWidget etiqueta={etiqueta} className={className}>
      {cuerpo}
    </MarcoWidget>
  );
}
