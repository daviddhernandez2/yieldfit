import Esqueleto, { ZonaCarga } from '@/components/Esqueleto/Esqueleto.jsx';
import styles from '@/pages/Dashboard/widgets/Widget.module.css';

// Silueta de un widget mientras llegan sus datos: ocupa el espacio que queda bajo la etiqueta,
// así la retícula no salta.
export default function Cargando({ que }) {
  return (
    <ZonaCarga etiqueta={`Cargando ${que}`} className={styles.esqueleto}>
      <Esqueleto forma="bloque" alto="100%" />
    </ZonaCarga>
  );
}
