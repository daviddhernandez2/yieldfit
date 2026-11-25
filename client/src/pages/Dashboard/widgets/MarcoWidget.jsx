import styles from '@/pages/Dashboard/widgets/Widget.module.css';

// Marco común de todos los widgets (bloque 9d): la anatomía de la tarjeta Widget del design
// system. Pinta la tarjeta, la cabecera de 20 px (etiqueta y dato secundario) y el contenido
// alineado arriba, 16 px por debajo. Cada widget solo pone su contenido.
//
// Props:
//   - etiqueta: texto de la izquierda de la cabecera, dentro de una pastilla.
//   - dato: lo de la derecha (una fecha, "1RM estimado", un botón…). Opcional.
//   - etiquetaAccesible: nombre de la región (por defecto, la etiqueta).
//   - onClick: si se pasa, la tarjeta entera es un botón (Última sesión).
export default function MarcoWidget({ etiqueta, dato, etiquetaAccesible, onClick, className = '', children }) {
  // Dentro de un botón solo valen elementos en línea (span); en una sección, div.
  const Bloque = onClick ? 'span' : 'div';
  const contenido = (
    <>
      <Bloque className={styles.cabecera}>
        <span className={styles.etiqueta} title={etiqueta}>
          {etiqueta}
        </span>
        {dato && <span className={styles.dato}>{dato}</span>}
      </Bloque>
      <Bloque className={styles.contenido}>{children}</Bloque>
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        className={`${styles.widget} ${styles.widgetBoton} glassCard ${className}`}
        onClick={onClick}
        aria-label={etiquetaAccesible ?? etiqueta}
      >
        {contenido}
      </button>
    );
  }
  return (
    <section className={`${styles.widget} glassCard ${className}`} aria-label={etiquetaAccesible ?? etiqueta}>
      {contenido}
    </section>
  );
}
