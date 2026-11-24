import styles from '@/components/Input/Input.module.css';

// Input reutilizable con label encima y mensaje de error opcional debajo.
// Acepta cualquier prop estándar de <input> a través de ...rest.
//
// Campos de fecha (type="date", bloque 11c): en el iPhone un campo de fecha vacío no muestra
// nada (ni formato ni placeholder: los navegadores ignoran `placeholder` en las fechas). Por eso,
// mientras está vacío y sin foco, se pinta encima una pista ("dd/mm/aaaa") y el texto propio del
// navegador se vuelve transparente: así se ve la misma pista en el iPhone, en Chrome y en Firefox.
// Con el foco desaparece la pista y queda el control del navegador (en escritorio se escribe la
// fecha; en el iPhone se abre la rueda).
//   - pistaFecha: el texto de la pista (por defecto "dd/mm/aaaa").
export default function Input({ label, error, id, pistaFecha = 'dd/mm/aaaa', ...rest }) {
  const esFecha = rest.type === 'date';
  // Solo con value controlado: sin value no se sabe si está vacío y no se pinta la pista.
  const fechaVacia = esFecha && rest.value === '';

  const input = (
    <input
      id={id}
      className={`${styles.input} ${error ? styles.inputError : ''} ${fechaVacia ? styles.fechaVacia : ''}`}
      {...rest}
    />
  );

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      {esFecha ? (
        <div className={styles.campoFecha}>
          {input}
          {/* aria-hidden: el lector de pantalla ya anuncia el campo de fecha con su etiqueta. */}
          {fechaVacia && (
            <span className={styles.pistaFecha} aria-hidden="true">
              {pistaFecha}
            </span>
          )}
        </div>
      ) : (
        input
      )}
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}
