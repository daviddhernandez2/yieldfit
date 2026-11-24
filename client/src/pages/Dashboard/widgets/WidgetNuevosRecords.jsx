import { useNavigate } from 'react-router-dom';
import MarcoWidget from '@/pages/Dashboard/widgets/MarcoWidget.jsx';
import Cargando from '@/pages/Dashboard/widgets/Cargando.jsx';
import { formatKg } from '@/utils/formato.js';
import styles from '@/pages/Dashboard/widgets/Widget.module.css';

// Récords que caben en cada tamaño: 2 filas de 32 px en M y 6 de 36 px en G.
const EN_M = 2;
const EN_G = 6;

// Nuevos récords (bloque 9d): los récords personales más recientes, con el 1RM estimado anterior y
// el nuevo ("100 → 105 kg", como el aviso del bloque 4b): es una estimación, no un peso levantado,
// y la cabecera lo dice. Cada fila abre la sesión del récord.
// Props: tamano ("M" | "G"), records (null mientras carga), error.
export default function WidgetNuevosRecords({ tamano, records, error, className = '' }) {
  const navigate = useNavigate();
  const grande = tamano === 'G';
  const visibles = (records ?? []).slice(0, grande ? EN_G : EN_M);

  let cuerpo;
  if (error) cuerpo = <p className={styles.error}>No se ha podido cargar.</p>;
  else if (!records) cuerpo = <Cargando que="los récords" />;
  else if (records.length === 0) cuerpo = <p className={styles.mensaje}>Aún no hay récords: supera tu mejor 1RM estimado en un ejercicio.</p>;
  else {
    cuerpo = (
      <ul className={`${styles.lista} ${styles.listaRecords}`}>
        {visibles.map((r) => (
          <li key={`${r.sessionId}-${r.exerciseId}`}>
            <button
              type="button"
              className={`${styles.fila} ${styles.filaRecord} ${grande ? styles.filaRecordG : ''}`}
              onClick={() => navigate(`/history/${r.sessionId}`)}
              aria-label={`${r.nombre}: 1RM estimado de ${formatKg(r.anterior)} a ${formatKg(r.nuevo)} kg. Ver la sesión`}
            >
              <span className={styles.nombre}>{r.nombre}</span>
              <span className={`${styles.secundario} ${styles.mejora}`}>
                {formatKg(r.anterior)} → <strong>{formatKg(r.nuevo)} kg</strong>
              </span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <MarcoWidget etiqueta="Nuevos récords" dato="1RM estimado" className={className}>
      {cuerpo}
    </MarcoWidget>
  );
}
