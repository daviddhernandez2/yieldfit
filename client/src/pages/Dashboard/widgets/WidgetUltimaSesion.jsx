import { useNavigate } from 'react-router-dom';
import MarcaPR from '@/components/MarcaPR/MarcaPR.jsx';
import Cargando from '@/pages/Dashboard/widgets/Cargando.jsx';
import { contar } from '@/utils/activeSession.js';
import { formatDuracion, formatFechaRelativa } from '@/utils/formato.js';
import { recordsDeSesion } from '@/utils/records.js';
import styles from '@/pages/Dashboard/widgets/Widget.module.css';

// Ejercicios que se ven en el tamaño G.
const EJERCICIOS_EN_G = 4;

// Última sesión (bloque 9d): qué hiciste y cuándo, y la marca PR si batiste algún récord. Toda la
// tarjeta abre el detalle de la sesión. En G, además, sus ejercicios con el número de series.
// Props: tamano ("M" | "G"), sesion (undefined mientras carga; null si no hay ninguna), error.
export default function WidgetUltimaSesion({ tamano, sesion, error, className = '' }) {
  const navigate = useNavigate();

  let cuerpo;
  if (error) cuerpo = <p className={styles.error}>No se ha podido cargar.</p>;
  else if (sesion === undefined) cuerpo = <Cargando que="la última sesión" />;
  else if (sesion === null) cuerpo = <p className={styles.mensaje}>Aún no hay sesiones. Empieza una desde Entrenar.</p>;

  if (cuerpo) {
    return (
      <section className={`${styles.widget} glassCard ${className}`} aria-label="Última sesión">
        <h2 className={styles.etiqueta}>Última sesión</h2>
        {cuerpo}
      </section>
    );
  }

  const conRecord = recordsDeSesion(sesion).length > 0;
  return (
    // La tarjeta entera es el botón: es un acceso al detalle.
    <button
      type="button"
      // En M, el contenido centrado en alto (como los P): sin espacio vacío abajo. En G lo llena la lista.
      className={`${styles.widget} ${styles.widgetBoton} ${tamano === 'M' ? styles.cifras : ''} glassCard ${className}`}
      onClick={() => navigate(`/history/${sesion._id}`)}
      aria-label={`Última sesión: ${sesion.nombre}, ${formatFechaRelativa(sesion.fecha)}. Ver el detalle`}
    >
      <span className={styles.etiqueta}>Última sesión</span>
      <span className={styles.tituloFila}>
        <span className={styles.nombreSesion}>{sesion.nombre}</span>
        {conRecord && <MarcaPR />}
      </span>
      <span className={styles.pie}>
        {formatFechaRelativa(sesion.fecha)} · {formatDuracion(sesion.duracionSegundos)} ·{' '}
        {contar(sesion.ejercicios.length, 'ejercicio', 'ejercicios')}
      </span>
      {tamano === 'G' && (
        <span className={styles.listaSimple}>
          {sesion.ejercicios.slice(0, EJERCICIOS_EN_G).map((ej) => (
            <span key={ej._id} className={styles.ejercicio}>
              <span className={styles.nombreEjercicio}>{ej.nombreSnapshot}</span>
              <span className={styles.dato}>{contar(ej.sets.length, 'serie', 'series')}</span>
            </span>
          ))}
          {sesion.ejercicios.length > EJERCICIOS_EN_G && (
            <span className={styles.dato}>y {sesion.ejercicios.length - EJERCICIOS_EN_G} más</span>
          )}
        </span>
      )}
    </button>
  );
}
