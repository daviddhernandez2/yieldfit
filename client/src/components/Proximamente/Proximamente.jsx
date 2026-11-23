import styles from '@/components/Proximamente/Proximamente.module.css';

// Etiqueta "Próximamente" para lo que existe pero aún no se puede usar (hoy, el cardio:
// DECISIONS.md, 0030). Gris a propósito: en la app el verde y el rojo significan
// ganancia y pérdida, y esto no es ni una cosa ni la otra.
export default function Proximamente() {
  return <span className={styles.etiqueta}>Próximamente</span>;
}
