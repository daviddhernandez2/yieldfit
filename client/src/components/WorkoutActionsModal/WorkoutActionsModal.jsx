import { useEffect } from 'react';
import Button from '@/components/Button/Button.jsx';
import styles from '@/components/WorkoutActionsModal/WorkoutActionsModal.module.css';

// Modal de acciones sobre una rutina. Aparece al pulsar sobre una rutina
// desde la lista y presenta dos acciones: Editar (va al formulario) e
// Iniciar (arranca la sesión de entrenamiento). Cierra con Escape o
// clic fuera del contenedor.
export default function WorkoutActionsModal({
  open,
  workout,
  onEdit,
  onStart,
  onClose,
}) {
  // Cierre con tecla Escape para respetar el patrón del ConfirmDialog.
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open || !workout) return null;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Acciones sobre ${workout.nombre}`}
    >
      <div
        className={`${styles.panel} glassCard`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={styles.title}>{workout.nombre}</h2>
        <p className={styles.subtitle}>¿Qué quieres hacer?</p>

        <div className={styles.actions}>
          <Button variant="outline" fullWidth onClick={onEdit}>
            Editar
          </Button>
          <Button variant="primary" fullWidth onClick={onStart}>
            Iniciar
          </Button>
        </div>
      </div>
    </div>
  );
}