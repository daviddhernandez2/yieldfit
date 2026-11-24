import { formatConSigno } from '@/utils/formato.js';
import styles from '@/pages/Dashboard/widgets/Widget.module.css';

// Una variación con flecha y signo, como en bolsa (design system: ↗ sube, ↘ baja; nunca solo el
// color). tamano: "grande" (la cifra de un widget) o "normal" (en una línea de texto).
// unidad: "%" por defecto; "" para una diferencia sin unidad ("+2" sesiones).
export default function Variacion({ valor, tamano = 'normal', unidad = '%' }) {
  const clase = valor > 0 ? styles.sube : valor < 0 ? styles.baja : styles.igual;
  return (
    <span className={`${styles.variacion} ${tamano === 'grande' ? styles.variacionGrande : ''} ${clase}`}>
      {valor !== 0 && (
        <svg className={styles.flecha} viewBox="0 0 12 12" aria-hidden="true">
          <path d={valor > 0 ? 'M3 9 9 3M4.5 3H9v4.5' : 'M3 3l6 6M9 4.5V9H4.5'} />
        </svg>
      )}
      {formatConSigno(valor)}
      {unidad && <>&nbsp;{unidad}</>}
    </span>
  );
}
