// Iconos de trazo propios del design system (grupo Icons y BotonIcono): 24×24, trazo 1.5,
// extremos y uniones redondeados, sin relleno y del color del texto (currentColor). No hay
// librería de iconos: un icono nuevo se dibuja en el design system y se añade aquí.
//
// Es la familia de los "iconos de interfaz" (regla de dos familias, tarjeta Miniatura del design
// system): navegan y actúan. Los pictogramas (ejercicios y rutinas) son la otra familia y van
// siempre dentro de una Miniatura. Un concepto, un icono: la mancuerna es "entrenar" y no hay otra.
//
// Los usan BotonIcono, el menú (NavItems), las acciones de fila y el estado vacío de Miniatura.
const TRAZOS = {
  // Menú (TabBar y Sidebar).
  inicio: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  historial: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <polyline points="3 4 3 9 8 9" />
      <polyline points="12 7 12 12 16 14" />
    </>
  ),
  // Mancuerna: "Entrenar" en el menú y el estado vacío de una Miniatura.
  entrenar: (
    <>
      <path d="M6 9v6" />
      <path d="M18 9v6" />
      <rect x="2" y="8" width="4" height="8" rx="1" />
      <rect x="18" y="8" width="4" height="8" rx="1" />
      <line x1="6" y1="12" x2="18" y2="12" />
    </>
  ),
  ejercicios: (
    <>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </>
  ),
  perfil: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  // Acciones.
  papelera: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </>
  ),
  atras: <polyline points="15 18 9 12 15 6" />,
  adelante: <polyline points="9 18 15 12 9 6" />,
  arriba: <polyline points="18 15 12 9 6 15" />,
  abajo: <polyline points="6 9 12 15 18 9" />,
  cerrar: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  // Lápiz: editar algo desde su tarjeta (bloque 9d, widgets de grupo).
  editar: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
};

// Siempre decorativo (aria-hidden): el texto accesible lo da quien lo usa (el aria-label de un
// botón, el nombre escrito al lado). El tamaño lo pone el CSS de quien lo usa o `tam`.
export default function Icono({ nombre, tam = 24, className = '' }) {
  return (
    <svg
      className={className}
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {TRAZOS[nombre]}
    </svg>
  );
}
