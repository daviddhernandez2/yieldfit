import styles from './Button.module.css';

// Botón reutilizable con dos variantes visuales:
// - "primary": fondo verde sólido, texto oscuro. Para CTAs principales.
// - "outline": borde verde, fondo transparente, texto verde. Para acciones secundarias.
// Acepta cualquier prop estándar de <button> a través de ...rest (onClick, disabled, type...).
export default function Button({
  variant = 'primary',
  children,
  fullWidth = false,
  ...rest
}) {
  const className = [
    styles.button,
    styles[variant],
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