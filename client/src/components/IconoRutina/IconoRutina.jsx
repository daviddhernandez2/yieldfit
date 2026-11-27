import { pictogramaDeRutina } from '@compartido/trazosPictograma.js';
import Pictograma from '@/components/Pictograma/Pictograma.jsx';
import Icono from '@/components/Icono/Icono.jsx';
import styles from '@/components/IconoRutina/IconoRutina.module.css';

// Icono de una rutina en la lista (bloque 10, tarjeta Pictograma del design system): su
// pictograma a 48 o, si no tiene icono, un recuadro de borde discontinuo con la mancuerna (icono
// del grupo Icons). Así una rutina sin icono se distingue de un hueco y la lista no se desalinea.
// Sustituye a la insignia de iniciales. Decorativo: el nombre de la rutina va escrito al lado.
//
// Props: icono, la clave guardada en la rutina ("empuje") o nada.
export default function IconoRutina({ icono }) {
  const id = pictogramaDeRutina(icono);
  if (id) return <Pictograma id={id} tam={48} />;
  return (
    <span className={styles.sinIcono}>
      <Icono nombre="mancuerna" />
    </span>
  );
}
