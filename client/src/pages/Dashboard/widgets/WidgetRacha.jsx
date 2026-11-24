import { useEffect, useRef, useState } from 'react';
import LlamaRacha from '@/components/LlamaRacha/LlamaRacha.jsx';
import MarcoWidget from '@/pages/Dashboard/widgets/MarcoWidget.jsx';
import Cargando from '@/pages/Dashboard/widgets/Cargando.jsx';
import { semanasQueCaben, textosRacha } from '@/utils/actividad.js';
import styles from '@/pages/Dashboard/widgets/Widget.module.css';

const FECHA_CORTA = { day: 'numeric', month: 'short' };

// Racha (bloque 9d): semanas seguidas con al menos una sesión, con una llama que se enciende
// mientras dura y se apaga si se rompe (LlamaRacha). Tres estados, que decide el servidor: activa,
// en riesgo (esta semana aún no has entrenado) y rota. Textos en utils/actividad.js (textosRacha).
// Anatomía (tarjeta Widget):
//   - P: cabecera, la llama con la cifra (28 px) y el pie, hasta dos líneas.
//   - M: además, la fila de semanas: tantas como caben en el ancho (círculos de 12 px con 8 px de
//     hueco, sin estirarse), de la más reciente hacia atrás; la actual con un anillo.
// Props: tamano ("P" | "M"), actividad (null mientras carga), error.
export default function WidgetRacha({ tamano, actividad, error, className = '' }) {
  const fila = useRef(null);
  const [ancho, setAncho] = useState(0);
  const conFila = tamano === 'M' && Boolean(actividad);

  // Ancho de la fila de semanas, para saber cuántas caben.
  useEffect(() => {
    if (!conFila || !fila.current) return;
    const observador = new ResizeObserver(([entrada]) => setAncho(entrada.contentRect.width));
    observador.observe(fila.current);
    return () => observador.disconnect();
  }, [conFila]);

  const textos = actividad ? textosRacha(actividad.racha, tamano) : null;
  const todas = actividad?.semanas ?? [];
  const visibles = todas.slice(todas.length - semanasQueCaben(ancho, todas.length));
  const fecha = (inicio) => new Date(`${inicio}T00:00:00`).toLocaleDateString('es-ES', FECHA_CORTA);

  let cuerpo;
  if (error) cuerpo = <p className={styles.error}>No se ha podido cargar.</p>;
  else if (!actividad) cuerpo = <Cargando que="la racha" />;
  else {
    cuerpo = (
      <div aria-label={textos.accesible}>
        <span className={styles.cifra}>
          <LlamaRacha estado={actividad.racha.estado} tamano={28} />
          {textos.cifra ? (
            <>
              {textos.cifra}
              <span className={styles.unidad}>{textos.unidad}</span>
            </>
          ) : (
            <span className={styles.sinRacha}>Sin racha</span>
          )}
        </span>
        {tamano === 'M' && (
          <div
            ref={fila}
            className={`${styles.semanasRacha} ${actividad.racha.estado === 'rota' ? styles.semanasRota : ''}`}
            aria-hidden="true"
          >
            {visibles.map((s, i) => {
              const actual = i === visibles.length - 1;
              return (
                <span
                  key={s.inicio}
                  className={`${styles.circuloSemana} ${s.sesiones > 0 ? styles.circuloLleno : ''} ${actual ? styles.circuloActual : ''}`}
                  title={`${actual ? 'Esta semana' : `Semana del ${fecha(s.inicio)}`}: ${s.sesiones} ${s.sesiones === 1 ? 'sesión' : 'sesiones'}`}
                />
              );
            })}
          </div>
        )}
        <p className={`${styles.pie} ${tamano === 'M' ? `${styles.unaLinea} ${styles.pieRacha}` : ''}`}>{textos.pie}</p>
      </div>
    );
  }

  return (
    <MarcoWidget etiqueta={textos?.etiqueta ?? 'Racha'} etiquetaAccesible="Racha" className={className}>
      {cuerpo}
    </MarcoWidget>
  );
}
