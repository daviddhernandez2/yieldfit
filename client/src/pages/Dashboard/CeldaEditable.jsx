import { useSortable } from '@dnd-kit/sortable';
import styles from '@/pages/Dashboard/Dashboard.module.css';

const IconAsa = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="9" cy="6" r="1.6" />
    <circle cx="15" cy="6" r="1.6" />
    <circle cx="9" cy="12" r="1.6" />
    <circle cx="15" cy="12" r="1.6" />
    <circle cx="9" cy="18" r="1.6" />
    <circle cx="15" cy="18" r="1.6" />
  </svg>
);

const IconQuitar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

// Un widget en el modo edición del Dashboard (bloque 9d, tarjeta "Editar dashboard"): el widget
// con el contenido atenuado (su nombre sigue a la vista) y, abajo, su barra:
//   - el asa para arrastrarlo (con el dedo, el ratón o el teclado: espacio y flechas);
//   - los tamaños que permite el catálogo, el actual marcado (si solo hay uno, no se muestran);
//   - quitar.
// Solo el asa arrastra: deslizar el dedo por el resto de la tarjeta hace scroll en el iPhone.
// El widget que se arrastra deja su sitio marcado; mientras, lo que se mueve es su copia
// (DragOverlay del Dashboard), y el sitio de destino se resalta.
// Props: id, nombre (para el lector de pantalla), tamano, tamanos (los del catálogo), estilo (fila
// y columna en la retícula), onTamano(t), onQuitar(), children (el widget).
export default function CeldaEditable({ id, nombre, tamano, tamanos, estilo, onTamano, onQuitar, children }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging, isOver, active } = useSortable({ id });
  // Destino resaltado: el widget sobre el que se va a soltar otro.
  const destino = isOver && active && active.id !== id;
  return (
    <div
      ref={setNodeRef}
      className={`${styles.celda} ${styles.celdaEditable} ${isDragging ? styles.celdaOrigen : ''} ${destino ? styles.celdaDestino : ''}`}
      style={estilo}
    >
      {/* inert: el contenido no se puede pulsar ni enfocar mientras se edita (el rango de un
          grupo, el botón Empezar…); solo la barra. */}
      <div className={styles.contenidoEditable} inert>
        {children}
      </div>
      <div className={styles.barraEdicion}>
        <button
          type="button"
          ref={setActivatorNodeRef}
          className={`${styles.botonBarra} ${styles.asaWidget}`}
          {...attributes}
          {...listeners}
          aria-label={`Mover ${nombre}`}
        >
          <IconAsa />
        </button>
        <div className={styles.tamanos} role="group" aria-label={`Tamaño de ${nombre}`}>
          {tamanos.length > 1 &&
            tamanos.map((t) => (
              <button
                key={t}
                type="button"
                className={`${styles.botonBarra} ${styles.tamano} ${t === tamano ? styles.tamanoActual : ''}`}
                aria-pressed={t === tamano}
                aria-label={`Tamaño ${t}`}
                onClick={() => onTamano(t)}
              >
                {t}
              </button>
            ))}
        </div>
        <button type="button" className={`${styles.botonBarra} ${styles.quitarWidget}`} aria-label={`Quitar ${nombre}`} onClick={onQuitar}>
          <IconQuitar />
        </button>
      </div>
    </div>
  );
}
