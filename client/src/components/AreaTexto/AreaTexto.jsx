import inputStyles from '@/components/Input/Input.module.css';
import styles from '@/components/AreaTexto/AreaTexto.module.css';

// Campo de texto largo (bloque 11d, notas de la sesión). Mismo aspecto que Input (usa sus
// estilos: borde, foco suave, letra de 16 px para que Safari no haga zoom en el iPhone), con
// "(opcional)" junto a la etiqueta y un contador "12/500" debajo si hay maxLength.
// Props: label, id, opcional, value, maxLength y el resto de props de <textarea> (...rest).
// FormularioReporte (Reportar) tiene todavía sus propios textarea: no se ha cambiado aquí.
export default function AreaTexto({ label, id, opcional = false, value, maxLength, ...rest }) {
  return (
    <div className={inputStyles.wrapper}>
      {label && (
        <label htmlFor={id} className={inputStyles.label}>
          {label} {opcional && <span className={styles.opcional}>(opcional)</span>}
        </label>
      )}
      <textarea
        id={id}
        className={`${inputStyles.input} ${styles.areaTexto}`}
        value={value}
        maxLength={maxLength}
        {...rest}
      />
      {maxLength && (
        // aria-live="off": el lector de pantalla no lo anuncia con cada tecla.
        <span className={styles.contador} aria-live="off">
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
}
