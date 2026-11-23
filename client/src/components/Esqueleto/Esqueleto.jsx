import styles from '@/components/Esqueleto/Esqueleto.module.css';

// Esqueletos de carga (bloque 9b, DECISIONS.md 0036): mientras llegan los datos, la
// pantalla muestra la FORMA de lo que va a aparecer, con un brillo suave, en vez de un
// "Cargando...". Así no hay salto cuando llega el contenido y la espera se nota menos.
//
// Dos piezas:
//   - <Esqueleto forma ancho alto />: un hueso suelto. Formas: "linea" (texto), "bloque"
//     (gráfico, imagen), "circulo" (insignia) y "pildora" (chip).
//   - <ZonaCarga etiqueta="…" className="…">…</ZonaCarga>: envuelve los huesos de una
//     pantalla. Para un lector de pantalla, los huesos no existen (aria-hidden) y solo se
//     anuncia la etiqueta. className es el del contenedor de los huesos (p. ej. la lista).
//
// Cada pantalla compone su silueta con las clases de su propia lista (tarjeta, fila…), así
// que el esqueleto ocupa exactamente lo mismo que el contenido real.
export default function Esqueleto({ forma = 'linea', ancho = '100%', alto, className = '' }) {
  const altoPorDefecto = { linea: '0.875rem', bloque: '120px', circulo: ancho, pildora: '34px' }[forma];
  return (
    <span
      className={`${styles.hueso} ${styles[forma]} ${className}`}
      style={{ width: ancho, height: alto ?? altoPorDefecto }}
    />
  );
}

export function ZonaCarga({ etiqueta = 'Cargando…', className = '', children }) {
  return (
    <div role="status" aria-live="polite">
      <span className={styles.soloLector}>{etiqueta}</span>
      <div aria-hidden="true" className={className}>
        {children}
      </div>
    </div>
  );
}
