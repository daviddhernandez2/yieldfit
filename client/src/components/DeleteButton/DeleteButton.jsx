import styles from './DeleteButton.module.css';

// Botón de eliminación estándar de la app.
// Diseñado como texto rojo con icono, discreto pero identificable.
// Se usa en todos los flujos destructivos: borrar sesión, borrar rutina,
// borrar ejercicio, etc.
export default function DeleteButton({ children = 'Eliminar', onClick, disabled }) {
  return (
    <button
      type="button"
      className={styles.button}
      onClick={onClick}
      disabled={disabled}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
      <span>{children}</span>
    </button>
  );
}