import { ICONOS_RUTINA } from '@compartido/pictogramas.js';
import Pictograma from '@/components/Pictograma/Pictograma.jsx';
import styles from '@/components/SelectorIcono/SelectorIcono.module.css';

// Selector del icono de una rutina (bloque 10, "Icono de rutina" en la tarjeta Pictograma del
// design system): una rejilla de opciones de 64 con "Sin icono" primero, porque es opcional.
//
// La lista sale de ICONOS_RUTINA (compartido/), la misma que valida el servidor: aquí no hay
// copia de las claves. Si se añade un icono allí, aparece aquí solo.
//
// Es un grupo de radio con inputs nativos ocultos, como RadioGroup: así el navegador da gratis
// las flechas para moverse, el foco y lo que lee un lector de pantalla. La figura va sin
// etiqueta propia (aria-hidden) porque el texto de la opción ya la nombra.
//
// Props:
//   - valor: la clave elegida ("empuje") o null (sin icono).
//   - onCambiar(clave | null).
export default function SelectorIcono({ valor, onCambiar, etiqueta = 'Icono (opcional)' }) {
  const opciones = [[null, null, 'Sin icono'], ...Object.entries(ICONOS_RUTINA).map(([clave, [id, texto]]) => [clave, id, texto])];

  return (
    <div className={styles.wrapper}>
      <span className={styles.label} id="selector-icono-etiqueta">{etiqueta}</span>
      <div className={styles.rejilla} role="radiogroup" aria-labelledby="selector-icono-etiqueta">
        {opciones.map(([clave, id, texto]) => {
          const elegida = (valor ?? null) === clave;
          return (
            <label key={clave ?? 'ninguno'} className={`${styles.opcion} ${elegida ? styles.elegida : ''}`}>
              <input
                type="radio"
                name="icono-rutina"
                value={clave ?? ''}
                checked={elegida}
                onChange={() => onCambiar(clave)}
                className={styles.input}
              />
              {id ? <Pictograma id={id} tam={64} className={styles.marco} /> : <span className={styles.sinIcono} aria-hidden="true">—</span>}
              <span className={styles.texto}>{texto}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
