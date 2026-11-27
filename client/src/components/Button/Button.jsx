import styles from '@/components/Button/Button.module.css';

// Botón de acción en píldora (design system del artefacto, README de Button; bloque 9c).
//
// Variantes:
//   - "primary" (por defecto): cristal oscuro con borde de luz verde y texto verde (opción B).
//     Una sola acción principal por vista.
//   - "outline": borde verde con cristal sutil. Acciones secundarias y "Cancelar".
//   - "danger": rojo TONAL (fondo y borde translúcidos, texto rojo), nunca sólido. Para
//     confirmar borrados (p. ej. en ConfirmDialog con confirmVariant="danger").
//   - "ghost": sin fondo ni borde; hover suave. Acciones terciarias en barras y tarjetas.
// Tamaños: "sm" 36 px (dentro de tarjetas o filas), "md" 48 px (por defecto, formularios),
// "lg" 52 px (el CTA de una pantalla).
// Acepta cualquier prop estándar de <button> a través de ...rest (onClick, disabled, type...).
export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  ...rest
}) {
  const className = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={className} {...rest}>
      {children}
    </button>
  );
}
