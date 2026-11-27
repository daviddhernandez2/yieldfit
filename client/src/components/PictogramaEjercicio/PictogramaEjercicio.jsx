import { elegirPictograma } from '@compartido/trazosPictograma.js';
import Pictograma from '@/components/Pictograma/Pictograma.jsx';
import styles from '@/components/PictogramaEjercicio/PictogramaEjercicio.module.css';

// Pictograma de un ejercicio en una fila (bloque 10): la lista y el buscador de ejercicios (40) y
// la sesión activa (48). Va DELANTE del botón de la fila, como hermano, nunca dentro: en el paso
// 5 este componente se convierte en el botón que abre la vista ampliada, y un botón no puede ir
// dentro de otro.
//
// La zona mide 48 × 48 aunque el marco sea de 40: es la zona táctil mínima del design system,
// y así la fila no cambia de alto cuando pase a ser un botón.
//
// Qué figura toca (la de su preset, la de su grupo o ninguna) lo decide elegirPictograma, en
// compartido/: aquí no hay lógica. Es decorativa (el nombre ya está escrito al lado).
//
// Props: presetId y grupoMuscular del ejercicio; tam: 40 o 48.
export default function PictogramaEjercicio({ presetId, grupoMuscular, tam = 40 }) {
  return (
    <span className={styles.zona}>
      <Pictograma id={elegirPictograma({ presetId, grupoMuscular })} tam={tam} />
    </span>
  );
}
