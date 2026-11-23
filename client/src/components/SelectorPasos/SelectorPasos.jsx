import styles from '@/components/SelectorPasos/SelectorPasos.module.css';

// Selector por pasos: "− 1:30 +" (bloque 9b, DECISIONS.md 0036). Para valores que se ajustan
// de poco en poco (descanso, número de series): con el dedo es más cómodo que escribir en
// un campo numérico, y no deja salirse de los límites.
//
// - valor: número que se guarda (segundos en el descanso, series en las series).
// - formato(valor): cómo se ve ("1:30"); textoAccesible(valor), cómo lo lee un lector de
//   pantalla ("1 minuto 30 segundos").
// - paso, min, max: cada pulsación suma o resta `paso`, sin pasar de los límites.
// - textoMenos / textoMas: etiquetas de los botones para el lector ("Quitar 15 segundos").
export default function SelectorPasos({
  id,
  etiqueta,
  valor,
  onCambiar,
  paso = 1,
  min = 0,
  max = Infinity,
  formato = String,
  textoAccesible = String,
  textoMenos = 'Menos',
  textoMas = 'Más',
}) {
  // Un valor guardado que no cuadra con el paso (p. ej. 100 s con pasos de 15) se ajusta al
  // primer pulsar: 100 → 90 o 105, como lo haría un selector de reloj.
  const cambiar = (direccion) => {
    const siguiente = direccion > 0 ? Math.floor(valor / paso) * paso + paso : Math.ceil(valor / paso) * paso - paso;
    onCambiar(Math.min(max, Math.max(min, siguiente)));
  };

  return (
    <div className={styles.selector} role="group" aria-labelledby={`${id}-etiqueta`}>
      <span id={`${id}-etiqueta`} className={styles.etiqueta}>
        {etiqueta}
      </span>
      <div className={styles.control}>
        <button type="button" className={styles.boton} onClick={() => cambiar(-1)} disabled={valor <= min} aria-label={textoMenos}>
          −
        </button>
        {/* aria-live: al pulsar, el lector anuncia el valor nuevo. */}
        <output className={styles.valor} aria-live="polite" aria-label={textoAccesible(valor)}>
          {formato(valor)}
        </output>
        <button type="button" className={styles.boton} onClick={() => cambiar(1)} disabled={valor >= max} aria-label={textoMas}>
          +
        </button>
      </div>
    </div>
  );
}
