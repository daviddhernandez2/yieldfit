import Button from '@/components/Button/Button.jsx';
import GrupoBotones from '@/components/GrupoBotones/GrupoBotones.jsx';
import styles from '@/pages/Importar/Importar.module.css';

const plural = (n, uno, varios) => `${n.toLocaleString('es-ES')} ${n === 1 ? uno : varios}`;

// Paso 3 de la importación: lo que se ha importado y "Deshacer esta importación" (decisión A), que
// pide confirmación (Importar.jsx) con el número de sesiones y la fecha.
// Props: resultado (la respuesta de POST /api/importar/strong), deshaciendo, onDeshacer, onHistorial.
export default function Resultado({ resultado, deshaciendo, onDeshacer, onHistorial }) {
  const detalles = [
    resultado.saltadas > 0 && `${plural(resultado.saltadas, 'saltada', 'saltadas')} (días con sesiones tuyas)`,
    resultado.yaImportadas > 0 && `${plural(resultado.yaImportadas, 'ya estaba importada', 'ya estaban importadas')}`,
    resultado.ejerciciosCreados > 0 && plural(resultado.ejerciciosCreados, 'ejercicio creado', 'ejercicios creados'),
    resultado.records > 0 ? plural(resultado.records, 'sesión con récord', 'sesiones con récord') : 'récords recalculados',
  ].filter(Boolean);

  return (
    <>
      <section className={styles.tarjeta}>
        <div className={styles.hecho}>
          <span className={styles.circuloHecho} aria-hidden="true">
            ✓
          </span>
          <b className={styles.hechoTitulo}>{plural(resultado.sesiones, 'sesión importada', 'sesiones importadas')}</b>
          <span className={styles.texto}>{detalles.join(' · ')}</span>
          {resultado.juntados > 0 && (
            <span className={styles.textoPequeno}>
              {plural(resultado.juntados, 'ejercicio se ha juntado', 'ejercicios se han juntado')} con otro en la misma sesión.
            </span>
          )}
          {resultado.notasCortadas > 0 && (
            <span className={styles.textoPequeno}>{plural(resultado.notasCortadas, 'sesión tiene', 'sesiones tienen')} las notas cortadas a 500 caracteres.</span>
          )}
        </div>
      </section>

      <GrupoBotones>
        <Button variant="danger" onClick={onDeshacer} disabled={deshaciendo}>
          {deshaciendo ? 'Deshaciendo…' : 'Deshacer esta importación'}
        </Button>
        <Button variant="primary" onClick={onHistorial} disabled={deshaciendo}>
          Ver historial
        </Button>
      </GrupoBotones>
      <p className={styles.textoPequeno}>
        Deshacer borra las {plural(resultado.sesiones, 'sesión', 'sesiones')} de esta importación y recalcula los récords. Los ejercicios creados y los
        emparejamientos se quedan.
      </p>
    </>
  );
}
