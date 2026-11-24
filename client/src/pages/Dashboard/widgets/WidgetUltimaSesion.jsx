import { useNavigate } from 'react-router-dom';
import MarcaPR from '@/components/MarcaPR/MarcaPR.jsx';
import MarcoWidget from '@/pages/Dashboard/widgets/MarcoWidget.jsx';
import Cargando from '@/pages/Dashboard/widgets/Cargando.jsx';
import { contar } from '@/utils/activeSession.js';
import { formatDuracion, formatFechaRelativa } from '@/utils/formato.js';
import { recordsDeSesion } from '@/utils/records.js';
import styles from '@/pages/Dashboard/widgets/Widget.module.css';

// Ejercicios que caben en el tamaño G (filas de 28 px).
const EJERCICIOS_EN_G = 6;

// Última sesión (bloque 9d). Anatomía (tarjeta Widget): la fecha en la cabecera; el nombre con la
// marca PR si batiste algún récord; la duración y el número de ejercicios; y sus ejercicios, en una
// línea en M o en filas con el número de series en G. Toda la tarjeta abre el detalle.
// Props: tamano ("M" | "G"), sesion (undefined mientras carga; null si no hay ninguna), error.
export default function WidgetUltimaSesion({ tamano, sesion, error, className = '' }) {
  const navigate = useNavigate();

  if (error || sesion === undefined || sesion === null) {
    return (
      <MarcoWidget etiqueta="Última sesión" className={className}>
        {error ? (
          <p className={styles.error}>No se ha podido cargar.</p>
        ) : sesion === undefined ? (
          <Cargando que="la última sesión" />
        ) : (
          <p className={styles.mensaje}>Aún no hay sesiones. Empieza una desde Entrenar.</p>
        )}
      </MarcoWidget>
    );
  }

  const fecha = formatFechaRelativa(sesion.fecha);
  return (
    <MarcoWidget
      etiqueta="Última sesión"
      dato={fecha}
      etiquetaAccesible={`Última sesión: ${sesion.nombre}, ${fecha}. Ver el detalle`}
      onClick={() => navigate(`/history/${sesion._id}`)}
      className={className}
    >
      <span className={styles.tituloSesion}>
        <span className={styles.nombre}>{sesion.nombre}</span>
        {recordsDeSesion(sesion).length > 0 && <MarcaPR />}
      </span>
      <span className={`${styles.pie} ${styles.unaLinea}`}>
        {formatDuracion(sesion.duracionSegundos)} · {contar(sesion.ejercicios.length, 'ejercicio', 'ejercicios')}
      </span>
      {tamano === 'G' ? (
        <span className={`${styles.lista} ${styles.listaSesion}`}>
          {sesion.ejercicios.slice(0, EJERCICIOS_EN_G).map((ej) => (
            <span key={ej._id} className={styles.fila}>
              <span className={styles.nombre}>{ej.nombreSnapshot}</span>
              <span className={styles.secundario}>{contar(ej.sets.length, 'serie', 'series')}</span>
            </span>
          ))}
        </span>
      ) : (
        <span className={`${styles.pie} ${styles.unaLinea}`}>{sesion.ejercicios.map((ej) => ej.nombreSnapshot).join(' · ')}</span>
      )}
    </MarcoWidget>
  );
}
