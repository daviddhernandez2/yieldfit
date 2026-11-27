import { ICONOS_RUTINA } from '@compartido/pictogramas.js';
import Miniatura from '@/components/Miniatura/Miniatura.jsx';
import styles from '@/components/SelectorIcono/SelectorIcono.module.css';

// Selector del icono de una rutina (bloque 10, tarjetas Pictograma y Miniatura del design system):
// una rejilla de opciones con Miniaturas de 48 y "Sin icono" primero, porque es opcional. "Sin
// icono" es la única Miniatura con borde discontinuo: ahí significa "nada elegido".
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
              <Miniatura id={id} tam={48} discontinua={!id} className={styles.miniatura} />
              <span className={styles.texto}>{texto}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
