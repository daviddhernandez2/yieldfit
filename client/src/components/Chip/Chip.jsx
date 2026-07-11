import styles from '@/components/Chip/Chip.module.css';

// Chip seleccionable, típicamente usado en filtros.
// Visualmente: pill que cambia de gris (no seleccionado) a verde (seleccionado).
// Usado en la pantalla de Ejercicios para filtrar por grupo muscular.
export default function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.chip} ${selected ? styles.selected : ''}`}
    >
      {label}
    </button>
  );
}