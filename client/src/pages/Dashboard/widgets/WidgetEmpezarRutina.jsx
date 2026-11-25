import Button from '@/components/Button/Button.jsx';
import MarcoWidget from '@/pages/Dashboard/widgets/MarcoWidget.jsx';
import Cargando from '@/pages/Dashboard/widgets/Cargando.jsx';
import { contar } from '@/utils/activeSession.js';
import { formatHace } from '@/utils/formato.js';
import styles from '@/pages/Dashboard/widgets/Widget.module.css';

// Ejercicios que se listan en G (filas de 36 px); si hay más, "+N ejercicios".
const EN_G = 5;

const IconPlay = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7 4.5v15l12.5-7.5z" />
  </svg>
);

// Empezar rutina (bloque 9d, diseño aprobado en el artefacto, versión 25): acceso directo para
// empezar la rutina que eligió el usuario. El nombre va en la pastilla.
//   - P: "7 ejercicios · hace 3 días" y el botón.
//   - M: los ejercicios en línea (dos líneas como mucho) y el botón; "hace 3 días" en la cabecera.
//   - G: los ejercicios en filas con sus series (cinco y "+N") y el botón.
// Si la sesión activa es de esta rutina, el botón pasa a "Continuar" (contorno) y lleva a ella.
// Empezar no se hace aquí: lo hace el Dashboard con useStartSession, que pregunta antes si hay
// otra sesión en curso (su diálogo no puede ir dentro de la tarjeta).
// Props: tamano, resumen ({ nombre, ejercicios: [{ nombre, numSeries }], ultimaSesion }; undefined
// mientras carga, null si la rutina ya no existe), error, enCurso (minutos de la sesión de esta
// rutina, o null), onEmpezar(), onContinuar().
export default function WidgetEmpezarRutina({ tamano, resumen, error, enCurso, onEmpezar, onContinuar, className = '' }) {
  const enMarcha = enCurso !== null && enCurso !== undefined;
  const estado = enMarcha ? <span className={styles.enCurso}>En curso · {enCurso} min</span> : null;
  const hace = resumen ? formatHace(resumen.ultimaSesion) : null;

  let cuerpo;
  if (error) cuerpo = <p className={styles.error}>No se ha podido cargar.</p>;
  else if (resumen === undefined) cuerpo = <Cargando que="la rutina" />;
  else if (resumen === null) cuerpo = <p className={styles.mensaje}>Esta rutina ya no existe.</p>;
  else {
    const { ejercicios } = resumen;
    const boton = enMarcha ? (
      <Button variant="outline" size="sm" onClick={onContinuar}>
        Continuar
      </Button>
    ) : (
      <Button size="sm" onClick={onEmpezar} aria-label={`Empezar ${resumen.nombre}`}>
        <IconPlay />
        Empezar
      </Button>
    );
    cuerpo = (
      <>
        {tamano === 'P' && (
          <p className={`${styles.pie} ${styles.pieRutina}`}>
            {estado ?? `${contar(ejercicios.length, 'ejercicio', 'ejercicios')} · ${hace.replace(/ (?=\S+$)/, ' ')}`}
          </p>
        )}
        {tamano === 'M' && (
          <p className={`${styles.pie} ${styles.pieRutina} ${styles.dosLineas}`}>
            {contar(ejercicios.length, 'ejercicio', 'ejercicios')}: {ejercicios.map((ej) => ej.nombre).join(' · ')}
          </p>
        )}
        {tamano === 'G' && (
          <>
            <ul className={styles.lista}>
              {ejercicios.slice(0, EN_G).map((ej, i) => (
                <li key={`${ej.nombre}-${i}`} className={`${styles.fila} ${styles.filaRutina}`}>
                  <span className={styles.nombre}>{ej.nombre}</span>
                  <span className={styles.secundario}>{contar(ej.numSeries, 'serie', 'series')}</span>
                </li>
              ))}
            </ul>
            {ejercicios.length > EN_G && (
              <span className={styles.masEjercicios}>+{contar(ejercicios.length - EN_G, 'ejercicio', 'ejercicios')}</span>
            )}
          </>
        )}
        <div className={styles.accionRutina}>{boton}</div>
      </>
    );
  }

  // En M y G, "hace 3 días" (o "En curso") en la cabecera; en P va en el pie.
  const dato = tamano === 'P' || !resumen ? null : estado ?? hace;
  return (
    <MarcoWidget
      etiqueta={resumen?.nombre ?? 'Rutina'}
      dato={dato}
      etiquetaAccesible={resumen ? `Rutina ${resumen.nombre}` : 'Empezar rutina'}
      className={className}
    >
      {cuerpo}
    </MarcoWidget>
  );
}
