import { useEffect, useId, useState } from 'react';
import { getRecordEjercicio } from '@/api/estadisticas.js';
import MarcoWidget from '@/pages/Dashboard/widgets/MarcoWidget.jsx';
import Cargando from '@/pages/Dashboard/widgets/Cargando.jsx';
import { formatKg } from '@/utils/formato.js';
import styles from '@/pages/Dashboard/widgets/Widget.module.css';

// Fecha corta con espacio que no se parte ("12 nov" no se separa en dos líneas).
const fechaCorta = (fecha) =>
  new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace(' ', ' ');

// Récords que se listan en G, debajo de la gráfica.
const EN_G = 3;

// Gráfica en escalones de la marca (bloque 9d, tarjeta Widget): sube en cada récord y se queda
// plana hasta el siguiente. Un dibujo de alto fijo, a todo el ancho de su caja: el SVG se estira
// en horizontal (preserveAspectRatio="none") y la línea mantiene su grosor (non-scaling-stroke).
// Los récords van separados por igual, no por fecha: lo que importa es cuánto subió cada vez.
// valores: del más antiguo al más nuevo, empezando por la marca que batió el primero.
function Escalones({ valores, alto }) {
  // Id del degradado, único por gráfica: puede haber varios widgets de récord en la página.
  const id = `relleno-${useId().replace(/:/g, '')}`;
  const ancho = 300;
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  // Si todas valen lo mismo (no pasa con récords, pero por si acaso), la línea va por el medio.
  const y = (v) => (max === min ? alto / 2 : alto - 2 - ((v - min) / (max - min)) * (alto - 8));
  const x = (i) => (i / (valores.length - 1)) * ancho;
  let d = `M0 ${y(valores[0]).toFixed(1)}`;
  valores.forEach((v, i) => {
    if (i > 0) d += ` H${x(i).toFixed(1)} V${y(v).toFixed(1)}`;
  });
  d += ` H${ancho}`;
  return (
    <svg className={styles.escalones} width="100%" height={alto} viewBox={`0 0 ${ancho} ${alto}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--chart-gain)" stopOpacity="0.2" />
          <stop offset="1" stopColor="var(--chart-gain)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} V${alto} H0 Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke="var(--chart-gain)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// Récord de un ejercicio (bloque 9d, diseño aprobado en el artefacto, versión 25): la marca actual
// (1RM estimado) del ejercicio que eligió el usuario. El nombre va en la pastilla.
//   - P: la marca y "1RM estimado · fecha".
//   - M: además, cuánto subió en el último récord y la marca anterior; a la derecha, la marca en
//     escalones, de alto fijo.
//   - G: la gráfica a todo el ancho (96 px) y los tres últimos récords.
// Sin récord todavía (la primera vez no cuenta, bloque 4b): un texto en su lugar.
// Pide sus propios datos (GET /api/estadisticas/record), como un grupo pide su progreso.
// Props: tamano ("P" | "M" | "G"), exerciseId.
export default function WidgetRecordEjercicio({ tamano, exerciseId, className = '' }) {
  const [record, setRecord] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let montado = true;
    setRecord(null);
    setError(false);
    getRecordEjercicio(exerciseId)
      .then((res) => montado && setRecord(res.data.record))
      .catch(() => montado && setError(true));
    return () => {
      montado = false;
    };
  }, [exerciseId]);

  const ultimo = record?.historia[0];
  // Del más antiguo al más nuevo, empezando por la marca que batió el primero de la lista.
  const valores = record?.historia.length
    ? [record.historia.at(-1).anterior, ...[...record.historia].reverse().map((r) => r.valor)]
    : [];
  const subida = ultimo ? ultimo.valor - ultimo.anterior : 0;

  let cuerpo;
  if (error) cuerpo = <p className={styles.error}>No se ha podido cargar.</p>;
  else if (!record) cuerpo = <Cargando que="el récord" />;
  else if (!ultimo) {
    cuerpo = (
      <>
        <span className={styles.sinRecord}>{tamano === 'P' ? 'Sin récord' : 'Sin récord todavía'}</span>
        <p className={`${styles.pie} ${tamano === 'P' ? '' : styles.unaLinea}`}>
          {tamano === 'P' ? 'Llegará cuando superes tu marca' : 'La primera vez no cuenta: llegará cuando superes tu marca'}
        </p>
      </>
    );
  } else {
    const cifra = (
      <span className={styles.cifra}>
        {formatKg(ultimo.valor)}
        <span className={styles.unidad}>kg</span>
        {tamano !== 'P' && <span className={styles.subidaRecord}>+{formatKg(subida)} kg</span>}
      </span>
    );
    if (tamano === 'P') {
      cuerpo = (
        <>
          {cifra}
          <p className={styles.pie}>1RM estimado · {fechaCorta(ultimo.fecha)}</p>
        </>
      );
    } else if (tamano === 'M') {
      cuerpo = (
        <div className={styles.recordM}>
          <div className={styles.recordMCifra}>
            {cifra}
            <p className={`${styles.pie} ${styles.unaLinea}`}>
              {fechaCorta(ultimo.fecha)} · antes {formatKg(ultimo.anterior)} kg
            </p>
          </div>
          <div className={styles.recordMGrafica}>
            <Escalones valores={valores} alto={58} />
          </div>
        </div>
      );
    } else {
      cuerpo = (
        <>
          {cifra}
          <p className={`${styles.pie} ${styles.unaLinea}`}>
            Récord del {fechaCorta(ultimo.fecha)} · {record.total} {record.total === 1 ? 'récord' : 'récords'} en total
          </p>
          <div className={styles.zonaGrafica}>
            <Escalones valores={valores} alto={96} />
          </div>
          <ul className={`${styles.lista} ${styles.listaGrupo}`}>
            {record.historia.slice(0, EN_G).map((r) => (
              <li key={r.sessionId} className={styles.fila}>
                <span className={styles.secundario}>{fechaCorta(r.fecha)}</span>
                <span className={`${styles.secundario} ${styles.mejora}`}>
                  {formatKg(r.anterior)} → <strong>{formatKg(r.valor)} kg</strong>
                </span>
              </li>
            ))}
          </ul>
        </>
      );
    }
  }

  return (
    <MarcoWidget
      etiqueta={record?.nombre ?? 'Récord'}
      dato={tamano === 'P' ? null : '1RM estimado'}
      etiquetaAccesible={record ? `Récord de ${record.nombre}` : 'Récord de un ejercicio'}
      className={className}
    >
      {cuerpo}
    </MarcoWidget>
  );
}
