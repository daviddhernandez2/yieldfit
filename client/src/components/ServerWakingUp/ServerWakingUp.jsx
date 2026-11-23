import { useServerWakingUp } from '@/hooks/useServerWakingUp.js';
import styles from '@/components/ServerWakingUp/ServerWakingUp.module.css';

// Trayectoria de la línea del ticker: una cotización que sube con algún altibajo. La usan
// la línea, el área de debajo y el punto que la recorre (offset-path en el CSS).
const TRAYECTORIA = 'M2 36 L22 30 L38 33 L56 22 L72 26 L92 14 L110 18 L128 8 L146 4';

// Ticker (bloque 9b, DECISIONS.md 0036): una línea de cotización que se dibuja de
// izquierda a derecha con un punto en la punta, se rellena y vuelve a empezar. Es la
// gráfica del Dashboard en miniatura. Decorativo: el texto de al lado es el que informa.
const Ticker = () => (
  <svg className={styles.ticker} viewBox="0 0 148 44" aria-hidden="true">
    <path className={styles.area} d={`${TRAYECTORIA} L146 40 L2 40 Z`} />
    <path className={styles.linea} d={TRAYECTORIA} />
    <circle className={styles.punta} r="6" />
  </svg>
);

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
          <Ticker />
          Despertando el servidor… La primera conexión puede tardar hasta un minuto.
        </>
      )}
    </div>
  );
}
