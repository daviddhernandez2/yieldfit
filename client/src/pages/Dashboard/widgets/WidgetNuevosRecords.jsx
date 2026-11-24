import { useNavigate } from 'react-router-dom';
import Cargando from '@/pages/Dashboard/widgets/Cargando.jsx';
import { formatKg } from '@/utils/formato.js';
import styles from '@/pages/Dashboard/widgets/Widget.module.css';

// Récords que caben en cada tamaño.
const EN_M = 2;
const EN_G = 6;

// Nuevos récords (bloque 9d): los récords personales más recientes, con el 1RM estimado anterior y
// el nuevo ("100 → 105 kg", como el aviso del bloque 4b): es una estimación, no un peso
// levantado, y la cabecera lo dice. Cada fila abre la sesión del récord.
// Props: tamano ("M" | "G"), records (null mientras carga), error.
export default function WidgetNuevosRecords({ tamano, records, error, className = '' }) {
  const navigate = useNavigate();
  const visibles = (records ?? []).slice(0, tamano === 'G' ? EN_G : EN_M);

  return (
    <section className={`${styles.widget} glassCard ${className}`} aria-label="Nuevos récords">
      <div className={styles.cabeceraCifra}>
        <h2 className={styles.etiqueta}>Nuevos récords</h2>
        <span className={styles.dato}>1RM estimado</span>
      </div>
      {error ? (
        <p className={styles.error}>No se ha podido cargar.</p>
      ) : !records ? (
        <Cargando que="los récords" />
      ) : records.length === 0 ? (
        <p className={styles.mensaje}>Aún no hay récords: supera tu mejor 1RM estimado en un ejercicio.</p>
      ) : (
        <ul className={styles.listaRecords}>
          {visibles.map((r) => (
            <li key={`${r.sessionId}-${r.exerciseId}`}>
              <button
                type="button"
                className={styles.filaRecord}
                onClick={() => navigate(`/history/${r.sessionId}`)}
                aria-label={`${r.nombre}: 1RM estimado de ${formatKg(r.anterior)} a ${formatKg(r.nuevo)} kg. Ver la sesión`}
              >
                <span className={styles.nombreEjercicio}>{r.nombre}</span>
                <span className={styles.mejora}>
                  {formatKg(r.anterior)} → <strong>{formatKg(r.nuevo)} kg</strong>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
