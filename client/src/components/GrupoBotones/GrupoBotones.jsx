import styles from '@/components/GrupoBotones/GrupoBotones.module.css';

// Fila de botones que nunca desborda (bloque 11b, paso 11b.7b). Úsala SIEMPRE que haya dos o
// más botones juntos (diálogos, paneles, formularios), en lugar de un `display: flex` propio:
//   - si caben en una línea, van uno al lado del otro y se reparten el ancho;
//   - si no caben (móvil estrecho, textos largos como "Salir sin guardar"), se apilan y cada
//     uno ocupa el ancho completo.
// No depende de ningún ancho de pantalla fijo: decide el propio contenido, así que funciona
// igual en un diálogo, en una tarjeta o a pantalla completa.
//
// Orden: el último botón es la acción principal (Cancelar, Guardar). En una línea va a la
// derecha; apilados, arriba, más a mano del pulgar, como en iOS y Android. El orden del
// teclado (Tab) es siempre el del código.
//
// className: solo para el espacio por fuera (márgenes), nunca para cambiar la distribución.
export default function GrupoBotones({ children, className = '' }) {
  return <div className={`${styles.grupo} ${className}`}>{children}</div>;
}
