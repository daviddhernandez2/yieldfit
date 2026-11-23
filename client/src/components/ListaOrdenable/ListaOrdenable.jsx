import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from '@/components/ListaOrdenable/ListaOrdenable.module.css';

// Lista que se reordena arrastrando (bloque 9b, DECISIONS.md 0036), con dnd-kit. La usan
// los ejercicios de una rutina, los de la sesión activa y los grupos del Dashboard.
//
// Cómo se usa:
//   <ListaOrdenable ids={['a','b']} nombreDe={(id) => '…'} onMover={(desde, hasta) => …}>
//     {(id, asa) => <Fila … asa={<Asa {...asa} />} />}
//   </ListaOrdenable>
// Cada elemento recibe `asa`: las props del asa ⋮⋮ desde la que se arrastra. Solo el asa
// arrastra: así, en el iPhone, deslizar el dedo por la lista sigue haciendo scroll.
//
// Funciona con ratón, con el dedo (eventos de puntero) y con el teclado: Tab hasta el asa,
// espacio para cogerlo, flechas para moverlo, espacio para soltarlo, Escape para cancelar.
// Lo que pasa se anuncia en español a los lectores de pantalla.
export default function ListaOrdenable({ ids, nombreDe, onMover, className = '', children }) {
  const sensores = useSensors(
    // distance: hay que mover 4 px antes de que empiece el arrastre, para que un toque
    // sin querer en el asa no mueva nada.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const posicion = (id) => `${ids.indexOf(id) + 1} de ${ids.length}`;
  const anuncios = {
    onDragStart: ({ active }) => `Has cogido «${nombreDe(active.id)}», posición ${posicion(active.id)}.`,
    onDragOver: ({ active, over }) => (over ? `«${nombreDe(active.id)}» está en la posición ${posicion(over.id)}.` : undefined),
    onDragEnd: ({ active, over }) => (over ? `«${nombreDe(active.id)}» queda en la posición ${posicion(over.id)}.` : `«${nombreDe(active.id)}» no se ha movido.`),
    onDragCancel: ({ active }) => `Cancelado. «${nombreDe(active.id)}» vuelve a su sitio.`,
  };

  const alSoltar = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    onMover(ids.indexOf(active.id), ids.indexOf(over.id));
  };

  return (
    <DndContext
      sensors={sensores}
      collisionDetection={closestCenter}
      onDragEnd={alSoltar}
      accessibility={{
        announcements: anuncios,
        screenReaderInstructions: {
          draggable: 'Para mover este elemento, pulsa espacio, usa las flechas y vuelve a pulsar espacio para soltarlo. Escape cancela.',
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {ids.map((id) => (
            <Elemento key={id} id={id} nombre={nombreDe(id)}>
              {(asa) => children(id, asa)}
            </Elemento>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// Un elemento de la lista: se desplaza mientras se arrastra y entrega al contenido las
// props del asa.
function Elemento({ id, nombre, children }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      className={isDragging ? styles.arrastrando : undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      {children({ ref: setActivatorNodeRef, ...attributes, ...listeners, 'aria-label': `Mover ${nombre}` })}
    </div>
  );
}

// Asa ⋮⋮ desde la que se arrastra. Recibe las props de `asa` tal cual.
export function Asa(props) {
  return (
    <button type="button" className={styles.asa} {...props}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="9" cy="6" r="1.6" />
        <circle cx="15" cy="6" r="1.6" />
        <circle cx="9" cy="12" r="1.6" />
        <circle cx="15" cy="12" r="1.6" />
        <circle cx="9" cy="18" r="1.6" />
        <circle cx="15" cy="18" r="1.6" />
      </svg>
    </button>
  );
}
