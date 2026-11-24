import styles from '@/components/BotonIcono/BotonIcono.module.css';

// Iconos de trazo 1.5 (design system, tema Premium). Uno por acción, todos 24×24 sin relleno.
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
};

// Botón de solo icono para volver, avanzar, abrir, cerrar y editar (bloque 9c, DECISIONS 0048).
// Dos variantes:
//   - "circulo" (por defecto): navegar entre pantallas o periodos (volver en las cabeceras,
//     flechas del calendario). Círculo de 40 px con fondo de tarjeta y borde fino.
//   - "sinFondo": acciones dentro de una tarjeta (plegar un grupo, cerrar un panel). Solo el
//     icono; al pasar el ratón o pulsar aparece un círculo suave. Menos volumen.
// En los dos, la zona que se puede pulsar mide 48 px aunque se vea más pequeño (el design
// system pide 48 px para todo control táctil).
//
// etiqueta: el nombre accesible ("Volver al historial"). Obligatoria: sin texto visible, es lo
// único que un lector de pantalla puede leer.
export default function BotonIcono({ icono, etiqueta, variante = 'circulo', className = '', ...rest }) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      className={`${styles.boton} ${styles[variante]} ${className}`}
      {...rest}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {TRAZOS[icono]}
      </svg>
    </button>
  );
}
