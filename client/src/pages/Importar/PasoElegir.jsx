import Button from '@/components/Button/Button.jsx';
import RadioGroup from '@/components/RadioGroup/RadioGroup.jsx';
import { formatFechaLote, formatTamano } from '@/utils/importar.js';
import styles from '@/pages/Importar/Importar.module.css';

// Paso 1 de la importación: cómo exportar desde Strong, el archivo, la unidad de los pesos y,
// debajo, las importaciones anteriores (cada una con "Deshacer"). Solo pinta: el estado y las
// llamadas viven en Importar.jsx.
// Props: opciones ({ maxBytes, unidades } o null mientras carga), archivo, unidad, onUnidad,
// onArchivo(file), onVistaPrevia, ocupado, lotes (o null), loteEnCurso (el que se deshace),
// onDeshacer({ lote, sesiones, fecha }).
export default function PasoElegir({ opciones, archivo, unidad, onUnidad, onArchivo, onVistaPrevia, ocupado, lotes, loteEnCurso, onDeshacer }) {
  return (
    <>
      <section className={styles.tarjeta}>
        <p className={styles.texto}>En Strong: Ajustes → Exportar datos → CSV. Lo que ya importaste antes no se repite.</p>

        {/* El input de archivo de verdad va escondido dentro de la etiqueta: toda la caja se
            puede tocar, y en el iPhone abre el selector de Archivos. */}
        <label className={`${styles.archivo} ${ocupado ? styles.archivoOcupado : ''}`}>
          <input
            type="file"
            accept=".csv,text/csv"
            className={styles.inputArchivo}
            disabled={!opciones || Boolean(ocupado)}
            onChange={(e) => {
              onArchivo(e.target.files?.[0]);
              e.target.value = ''; // permite volver a elegir el mismo archivo
            }}
          />
          <span className={styles.archivoAccion}>{archivo ? 'Cambiar archivo' : 'Elegir archivo CSV'}</span>
          <span className={styles.archivoDetalle}>
            {ocupado === 'leyendo'
              ? 'Leyendo el archivo…'
              : archivo
                ? `${archivo.nombre} · ${formatTamano(archivo.tamano)}`
                : opciones
                  ? `Hasta ${formatTamano(opciones.maxBytes)}`
                  : 'Conectando…'}
          </span>
        </label>

        {opciones && (
          <RadioGroup label="Los pesos del archivo están en" name="unidad" value={unidad} onChange={onUnidad} options={opciones.unidades} />
        )}
        <p className={styles.textoPequeno}>Strong no lo dice en el archivo: elige la unidad que tenías en la app. En lb se pasa a kg al importar.</p>
      </section>

      <Button variant="primary" fullWidth disabled={!archivo || Boolean(ocupado)} onClick={onVistaPrevia}>
        {ocupado === 'previa' ? 'Leyendo el archivo…' : 'Ver vista previa'}
      </Button>

      <section className={styles.tarjeta}>
        <h2 className={styles.tituloTarjeta}>Importaciones anteriores</h2>
        {lotes === null && <p className={styles.textoPequeno}>Cargando…</p>}
        {lotes?.length === 0 && <p className={styles.textoPequeno}>Todavía no has importado nada.</p>}
        {lotes?.length > 0 && (
          <ul className={styles.lista}>
            {lotes.map((l) => (
              <li key={l.lote} className={styles.fila}>
                <div className={styles.filaTexto}>
                  <span className={styles.filaNombre}>{formatFechaLote(l.fecha)}</span>
                  <span className={styles.filaSub}>
                    Strong · {l.sesiones} {l.sesiones === 1 ? 'sesión' : 'sesiones'}
                  </span>
                </div>
                <button
                  type="button"
                  className={`${styles.accionFila} ${styles.accionPeligro}`}
                  disabled={Boolean(ocupado)}
                  onClick={() => onDeshacer(l)}
                >
                  {loteEnCurso === l.lote ? 'Deshaciendo…' : 'Deshacer'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
