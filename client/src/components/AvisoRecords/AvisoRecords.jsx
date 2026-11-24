import BotonIcono from '@/components/BotonIcono/BotonIcono.jsx';
import MarcaPR from '@/components/MarcaPR/MarcaPR.jsx';
import { formatKg } from '@/utils/formato.js';
import styles from '@/components/AvisoRecords/AvisoRecords.module.css';

// Aviso de récords al terminar un entreno (bloque 4b, DECISIONS 0051). Sale arriba del
// Historial, entra con una animación corta (sin ella si el sistema pide reducir movimiento) y
// se queda hasta que se cierra o se sale de la página. Solo presenta.
//
// Props:
//   - records: [{ exerciseId, nombre, anterior, nuevo }] (utils/records.js), al menos uno.
//   - onCerrar(): quitar el aviso.
export default function AvisoRecords({ records, onCerrar }) {
  const titulo =
    records.length === 1 ? `¡Nuevo récord en ${records[0].nombre}!` : `¡${records.length} récords nuevos!`;

  return (
    // role="status": el lector de pantalla lo anuncia al aparecer, sin interrumpir.
    <section className={styles.aviso} role="status">
      <div className={styles.cabecera}>
        <MarcaPR />
        <h2 className={styles.titulo}>{titulo}</h2>
        <BotonIcono variante="sinFondo" icono="cerrar" etiqueta="Cerrar el aviso" onClick={onCerrar} />
      </div>
      <ul className={styles.lista}>
        {records.map((r) => (
          <li key={r.exerciseId} className={styles.fila}>
            {/* Con un solo récord el nombre ya está en el título. */}
            {records.length > 1 && <span className={styles.nombre}>{r.nombre}</span>}
            <span className={styles.cifras}>
              <span className={styles.etiqueta}>1RM estimado</span>{' '}
              {formatKg(r.anterior)} → <strong>{formatKg(r.nuevo)} kg</strong>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
