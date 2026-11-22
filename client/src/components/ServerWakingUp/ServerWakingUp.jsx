import { useServerWakingUp } from '@/hooks/useServerWakingUp.js';
import styles from '@/components/ServerWakingUp/ServerWakingUp.module.css';

// Aviso de "despertando el servidor" (arranque en frío de Render). Solo se ve mientras
// alguna petición tarda más de 4 s; el resto del tiempo no ocupa espacio.
//
// El contenedor con aria-live existe siempre y solo cambia su texto: los lectores de
// pantalla anuncian los cambios de una región que ya estaba, no de una que aparece.
//
// flotante: en las pantallas privadas (Layout) va fijo abajo, sobre el contenido,
// porque la petición lenta puede venir de cualquier pantalla (p. ej. al volver a la
// app tras 20 minutos con la pestaña abierta). En Login, Register y PrivateRoute va
// en línea, bajo el botón o el "Cargando...".
export default function ServerWakingUp({ flotante = false }) {
  const despertando = useServerWakingUp();
  const clases = [styles.aviso, flotante && styles.flotante, despertando && styles.visible]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={clases} role="status" aria-live="polite">
      {despertando && (
        <>
          <span className={styles.punto} aria-hidden="true" />
          Despertando el servidor… La primera conexión puede tardar hasta un minuto.
        </>
      )}
    </div>
  );
}
