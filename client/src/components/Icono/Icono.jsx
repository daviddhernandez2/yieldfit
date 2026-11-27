// Iconos de trazo propios del design system (grupo Icons y BotonIcono): 24×24, trazo 1.5,
// extremos y uniones redondeados, sin relleno y del color del texto (currentColor). No hay
// librería de iconos: un icono nuevo se dibuja en el design system y se añade aquí.
//
// Antes del bloque 10 estos trazos vivían dentro de BotonIcono; salieron aquí cuando hizo falta
// un icono fuera de un botón (la mancuerna de una rutina sin icono).
const TRAZOS = {
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
  // Mancuerna: rutina sin icono (bloque 10, rutina.svg en el grupo Icons).
  mancuerna: <path d="M6.5 6.5v11 M17.5 6.5v11 M3.5 9v6 M20.5 9v6 M6.5 12h11" />,
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
