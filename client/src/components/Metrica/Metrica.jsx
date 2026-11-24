import { useId } from 'react';
import styles from '@/components/Metrica/Metrica.module.css';

// Ancho y alto internos de la sparkline (el SVG se estira al ancho de la tarjeta).
const ANCHO = 240;
const ALTO = 56;

// Convierte una serie de números en el trazo de la sparkline y el área de debajo.
// La serie se escala entre su mínimo y su máximo, con 4 de margen arriba y abajo.
const trazos = (serie) => {
  if (serie.length < 2) return null;
  const min = Math.min(...serie);
  const max = Math.max(...serie);
  const rango = max - min || 1; // serie plana: una línea recta en medio
  const linea = serie
    .map((v, i) => [(i / (serie.length - 1)) * ANCHO, ALTO - 4 - ((v - min) / rango) * (ALTO - 8)])
    .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
  return { linea, area: `${linea} L${ANCHO} ${ALTO} L0 ${ALTO} Z` };
};

// Tarjeta de métrica (design system, components/Metrica/README.md; bloque 9c): micro-etiqueta,
// cifra grande, variación con flecha y una sparkline con área degradada.
//
// Props:
//   - etiqueta: el nombre de la cifra ("Progreso"). Se muestra en MAYÚSCULAS por CSS.
//   - valor: el texto YA formateado ("+12,4"); el consumidor pone la coma decimal.
//   - unidad: "%", "kg"… (opcional).
//   - variacion: número en % (opcional). Se muestra con flecha ↗/↘ y signo, nunca solo color.
//   - periodo: "vs. mes pasado"… (opcional, junto a la variación).
//   - serie: números para la sparkline (opcional; 2 o más).
// Responsive por contenedor (container queries): la cifra y la gráfica escalan con el ancho de
// la propia tarjeta, no de la pantalla. Va en una rejilla fluida (ver Dashboard.module.css).
export default function Metrica({ etiqueta, valor, unidad, variacion, periodo, serie = [] }) {
  // Id único del degradado: con varias métricas en la página no pueden repetirse.
  const id = useId().replace(/:/g, '');
  const sube = variacion >= 0;
  const grafica = trazos(serie);
  // Sin variación, la sparkline usa el color de ganancia solo si la serie sube.
  const tendenciaSube = variacion !== undefined ? sube : serie.length < 2 || serie.at(-1) >= serie[0];
  const color = tendenciaSube ? 'var(--chart-gain)' : 'var(--chart-loss)';

  return (
    <div className={styles.tarjeta}>
      <span className={styles.etiqueta}>{etiqueta}</span>
      <div className={styles.cifra}>
        <span className={styles.valor}>{valor}</span>
        {unidad && <span className={styles.unidad}>{unidad}</span>}
      </div>

      {variacion !== undefined && (
        <div className={styles.pie}>
          <span className={`${styles.variacion} ${sube ? styles.sube : styles.baja}`}>
            <svg className={styles.flecha} viewBox="0 0 12 12" aria-hidden="true">
              <path d={sube ? 'M3 9 9 3M4.5 3H9v4.5' : 'M3 3l6 6M9 4.5V9H4.5'} />
            </svg>
            {sube ? '+' : '−'}
            {Math.abs(variacion).toFixed(1).replace('.', ',')}&nbsp;%
          </span>
          {periodo && <span className={styles.periodo}>{periodo}</span>}
        </div>
      )}

      {grafica && (
        <svg className={styles.grafica} viewBox={`0 0 ${ANCHO} ${ALTO}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.22" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={grafica.area} fill={`url(#g${id})`} />
          <path d={grafica.linea} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
    </div>
  );
}
