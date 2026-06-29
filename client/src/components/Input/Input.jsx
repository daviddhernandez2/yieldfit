import styles from './Input.module.css';

// Input reutilizable con label encima y mensaje de error opcional debajo.
// Acepta cualquier prop estándar de <input> a través de ...rest.
export default function Input({ label, error, id, ...rest }) {
  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={id}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        {...rest}
      />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}