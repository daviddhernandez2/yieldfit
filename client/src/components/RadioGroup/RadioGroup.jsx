import styles from './RadioGroup.module.css';

// Grupo de radio buttons estilizado. Recibe un array de opciones (value + label)
// y gestiona la selección mediante el patrón controlado de React.
// Visualmente, cada opción es una "pill" táctil; la seleccionada se marca en verde.
export default function RadioGroup({ label, name, value, onChange, options, error }) {
  return (
    <div className={styles.wrapper}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.group} role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`${styles.option} ${isSelected ? styles.selected : ''}`}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={isSelected}
                onChange={() => onChange(opt.value)}
                className={styles.input}
              />
              {opt.label}
            </label>
          );
        })}
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}