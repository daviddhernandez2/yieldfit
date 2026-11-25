import { formatConSigno } from '@/utils/formato.js';
import styles from '@/pages/Dashboard/widgets/Widget.module.css';

// Un % con flecha y signo, como en bolsa (design system: ↗ sube, ↘ baja; nunca solo el color).
// tamano: "grande" (la cifra de un widget) o "normal" (en una línea de texto).
// En grande (bloque 9d), para que quepa en un widget P a 375 px (114 px de ancho): el % va como
// unidad pequeña, igual que "kg" o "semanas", y desde ±10 % sin decimales ("+22 %"; con cifras
// así, un decimal no aporta nada). Con 32 px, "↗ +21,9 %" no cabía; así caben hasta "+100 %".
export default function Variacion({ valor, tamano = 'normal' }) {
  const clase = valor > 0 ? styles.sube : valor < 0 ? styles.baja : styles.igual;
  const grande = tamano === 'grande';
  const numero = formatConSigno(grande && Math.abs(valor) >= 10 ? Math.round(valor) : valor);
  return (
    <span className={`${styles.variacion} ${tamano === 'grande' ? styles.variacionGrande : ''} ${clase}`}>
      {valor !== 0 && (
        <svg className={styles.flecha} viewBox="0 0 12 12" aria-hidden="true">
          <path d={valor > 0 ? 'M3 9 9 3M4.5 3H9v4.5' : 'M3 3l6 6M9 4.5V9H4.5'} />
        </svg>
      )}
      {grande ? (
        <>
          {numero}
          <span className={styles.unidadVariacion}>%</span>
        </>
      ) : (
        <>{numero}&nbsp;%</>
      )}
    </span>
  );
}
