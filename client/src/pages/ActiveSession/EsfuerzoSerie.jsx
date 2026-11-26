import { useEffect, useRef } from 'react';
import { formatEsfuerzo, valorEsfuerzo, valoresEsfuerzo } from '@/utils/esfuerzo.js';
import styles from '@/pages/ActiveSession/ActiveSession.module.css';

// Esfuerzo de una serie en la sesión activa (bloque 5c, tarjeta Esfuerzo del design system).
// Una segunda línea bajo la fila de la serie, con una pastilla:
//   - con valor: "RPE 8" en verde;
//   - vacía con dato de la vez anterior: ese valor en gris y cursiva, SOLO como referencia (no se
//     guarda si no lo eliges, igual que el peso y las reps);
//   - vacía sin dato anterior: "RPE —" con borde discontinuo.
// Al tocarla se abren debajo los valores (filas de 5, con "Quitar" al final), sin teclado. Elegir uno
// lo guarda y cierra. Tocar fuera o Escape cierran sin cambiar nada. Solo hay una abierta a la
// vez: qué serie está abierta lo decide la sesión activa (`abierta`).
// Con "no mostrar" en Perfil, quien la usa no la pinta: la fila queda como siempre.
// Props: rpe (o null), rpeAnterior (o null), modo ('rpe' | 'rir'), rango (del servidor),
// numeroSerie, abierta, onAbrir(), onCerrar(), onElegir(rpe o null).
export default function EsfuerzoSerie({ rpe, rpeAnterior, modo, rango, numeroSerie, abierta, onAbrir, onCerrar, onElegir }) {
  const caja = useRef(null);
  const panel = useRef(null);
  const tieneValor = rpe !== null && rpe !== undefined;
  const conAnterior = !tieneValor && rpeAnterior !== null && rpeAnterior !== undefined;
  const nombre = modo.toUpperCase();

  // Abierta: tocar fuera de esta línea o pulsar Escape la cierra sin cambiar nada.
  useEffect(() => {
    if (!abierta) return;
    // Con pointerdown y no con click: en iOS, tocar algo que no es un botón no siempre da click.
    // Pero si el toque es en la pastilla de OTRA serie, aquí no se cierra nada: su click la abre
    // y esta se cierra en el mismo cambio. Si se cerrara ya, los valores (unos 200 px) desaparecen,
    // lo de debajo sube y el click cae fuera de la pastilla tocada: no se abriría ninguna (lo
    // encontró la prueba con WebKit, el motor de Safari).
    const alTocar = (e) => {
      if (!caja.current || caja.current.contains(e.target)) return;
      if (e.target.closest('[data-pastilla-esfuerzo]')) return;
      onCerrar();
    };
    const alPulsar = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('pointerdown', alTocar);
    document.addEventListener('keydown', alPulsar);
    return () => {
      document.removeEventListener('pointerdown', alTocar);
      document.removeEventListener('keydown', alPulsar);
    };
  }, [abierta, onCerrar]);

  // Al abrirse, los valores (cuatro filas, unos 200 px) se desplazan lo justo para verse enteros:
  // una serie de abajo los dejaría bajo la barra de pestañas o el círculo de "Reportar". El hueco
  // que reservan esas barras lo pone el CSS (scroll-margin-bottom). Sin animación si el sistema
  // pide reducir el movimiento.
  useEffect(() => {
    if (!abierta || !panel.current) return;
    const sinMovimiento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    panel.current.scrollIntoView({ block: 'nearest', behavior: sinMovimiento ? 'auto' : 'smooth' });
  }, [abierta]);

  let texto;
  if (tieneValor) texto = formatEsfuerzo(rpe, modo);
  else if (conAnterior) texto = formatEsfuerzo(rpeAnterior, modo);
  else texto = `${nombre} —`;

  const etiqueta = tieneValor
    ? `Esfuerzo de la serie ${numeroSerie}: ${formatEsfuerzo(rpe, modo)}. Cambiar`
    : `Esfuerzo de la serie ${numeroSerie}, sin elegir${conAnterior ? `. La vez anterior: ${formatEsfuerzo(rpeAnterior, modo)}` : ''}`;

  const elegir = (valor) => {
    onElegir(valor);
    onCerrar();
  };

  return (
    <div ref={caja} className={styles.esfuerzo}>
      <div className={styles.lineaEsfuerzo}>
        <button
          type="button"
          className={`${styles.pastillaEsfuerzo} ${tieneValor ? styles.pastillaConValor : ''} ${conAnterior ? styles.pastillaAnterior : ''} ${abierta ? styles.pastillaAbierta : ''}`}
          aria-expanded={abierta}
          aria-label={etiqueta}
          data-pastilla-esfuerzo
          onClick={abierta ? onCerrar : onAbrir}
        >
          {texto}
        </button>
      </div>
      {abierta && (
        <div ref={panel} className={styles.valoresEsfuerzo} role="group" aria-label={`${nombre} de la serie ${numeroSerie}`}>
          {valoresEsfuerzo(rango, modo).map((v) => (
            <button
              key={v.rpe}
              type="button"
              className={`${styles.valorEsfuerzo} ${v.rpe === rpe ? styles.valorElegido : ''} ${!tieneValor && v.rpe === rpeAnterior ? styles.valorAnterior : ''}`}
              aria-pressed={v.rpe === rpe}
              aria-label={`${nombre} ${valorEsfuerzo(v.rpe, modo)}`}
              onClick={() => elegir(v.rpe)}
            >
              {v.etiqueta}
            </button>
          ))}
          <button type="button" className={`${styles.valorEsfuerzo} ${styles.quitarEsfuerzo}`} onClick={() => elegir(null)}>
            Quitar
          </button>
        </div>
      )}
    </div>
  );
}
