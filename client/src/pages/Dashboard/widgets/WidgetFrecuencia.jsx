import MarcoWidget from '@/pages/Dashboard/widgets/MarcoWidget.jsx';
import Cargando from '@/pages/Dashboard/widgets/Cargando.jsx';
import { alturasBarras, mediaPorSemana } from '@/utils/actividad.js';
import styles from '@/pages/Dashboard/widgets/Widget.module.css';

const FECHA_CORTA = { day: 'numeric', month: 'short' };
// Semanas que se muestran (el servidor manda más, para la Racha).
const SEMANAS = 12;
// Alto máximo de las barras por tamaño: lo que cabe en el contenido (anatomía de widget, con las
// medidas de la tarjeta Espaciado: contenido de 120 px en M y 312 en G).
const ALTO_BARRAS = { M: 60, G: 236 };

// Frecuencia semanal (bloque 9d): barras con las sesiones de las últimas 12 semanas y la media en
// la cabecera. Barras de 14 px con 6 px de hueco, alineadas a la izquierda: no se estiran. La
// semana actual va en el verde de los datos (también con 0). En G, las sesiones encima de cada
// barra; en M, al pasar el ratón. Debajo, la fecha de la primera semana y "esta semana".
// Props: tamano ("M" | "G"), actividad (null mientras carga), error.
export default function WidgetFrecuencia({ tamano, actividad, error, className = '' }) {
  const semanas = (actividad?.semanas ?? []).slice(-SEMANAS);
  const alturas = alturasBarras(semanas);
  const fecha = (inicio) => new Date(`${inicio}T00:00:00`).toLocaleDateString('es-ES', FECHA_CORTA);
  const alto = ALTO_BARRAS[tamano] ?? ALTO_BARRAS.M;
  // Ancho de las 12 barras con sus huecos: las fechas van justo debajo, del mismo ancho.
  const anchoBarras = semanas.length * 20 - 6;

  let cuerpo;
  if (error) cuerpo = <p className={styles.error}>No se ha podido cargar.</p>;
  else if (!actividad) cuerpo = <Cargando que="la frecuencia" />;
  else {
    cuerpo = (
      <>
        {/* Las barras son un dibujo: el lector de pantalla recibe los números en el texto. */}
        <div
          className={styles.barras}
          role="img"
          aria-label={`Sesiones por semana en las últimas ${semanas.length} semanas, de la más antigua a esta: ${semanas.map((s) => s.sesiones).join(', ')}`}
        >
          {semanas.map((s, i) => {
            const actual = i === semanas.length - 1;
            return (
              <div
                key={s.inicio}
                className={styles.columnaBarra}
                title={`${actual ? 'Esta semana' : `Semana del ${fecha(s.inicio)}`}: ${s.sesiones} ${s.sesiones === 1 ? 'sesión' : 'sesiones'}`}
              >
                {tamano === 'G' && <span className={styles.numeroBarra}>{s.sesiones}</span>}
                <div
                  className={`${styles.barra} ${actual ? styles.barraActual : ''} ${s.sesiones === 0 ? styles.barraVacia : ''}`}
                  style={{ height: `${Math.round((alturas[i] / 100) * alto)}px` }}
                />
              </div>
            );
          })}
        </div>
        <div className={styles.fechasBarras} style={{ width: `${anchoBarras}px` }} aria-hidden="true">
          <span>{semanas.length > 0 && fecha(semanas[0].inicio)}</span>
          <span>esta semana</span>
        </div>
      </>
    );
  }

  return (
    <MarcoWidget
      etiqueta="Frecuencia semanal"
      dato={actividad && `${mediaPorSemana(semanas).toLocaleString('es-ES')} por semana`}
      className={className}
    >
      {cuerpo}
    </MarcoWidget>
  );
}
