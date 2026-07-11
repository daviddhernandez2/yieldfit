import { useEffect } from 'react';
import Button from '@/components/Button/Button.jsx';
import styles from '@/components/ConfirmDialog/ConfirmDialog.module.css';

// Diálogo de confirmación reutilizable. Aparece como overlay sobre el contenido.
// Casos típicos: confirmar borrados, salir sin guardar, acciones destructivas.
// Props:
//  - open: si está visible o no.
//  - title, message: textos del diálogo.
//  - confirmLabel, cancelLabel: textos de los botones.
//  - confirmVariant: 'primary' (verde) o 'danger' (rojo). Por defecto 'primary'.
//  - onConfirm, onCancel: callbacks de los botones.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}) {
  // Cerrar con tecla Escape. Mejora de accesibilidad estándar para modales.
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      {/* stopPropagation evita que clicks dentro del diálogo cierren el modal. */}
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={styles.title}>{title}</h2>
        {message && <p className={styles.message}>{message}</p>}

        <div className={styles.actions}>
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}