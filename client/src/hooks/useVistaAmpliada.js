import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';

// Abrir y cerrar la vista ampliada de un pictograma (bloque 10, tarjeta Pictograma del design
// system): el marco pequeño de la fila crece hasta el centro y, al cerrar, vuelve a su sitio.
//
// Tres caminos, del mejor al más sencillo:
//   1. View Transitions (Chrome, Safari 18+): el navegador hace una foto antes y otra después y
//      anima entre las dos. Los dos marcos llevan el mismo view-transition-name, así que el
//      navegador sabe que son "el mismo" y lo mueve y escala; el resto de la página (el velo, la
//      tarjeta, el texto) entra con un fundido.
//   2. FLIP con Web Animations (navegadores sin lo anterior): se mide dónde está el marco pequeño
//      (First), se abre el diálogo y se mide el grande (Last), se calcula la diferencia (Invert)
//      y se anima desde ahí hasta su sitio (Play).
//   3. Movimiento reducido (prefers-reduced-motion): se abre y se cierra sin animar.
//
// Duración y curva salen de los tokens (--duration-overlay, --ease-standard): en View
// Transitions las pone el CSS; en FLIP se leen de variables.css al animar.
//
// Devuelve las refs que la vista conecta: origen (el botón de la fila, que contiene el marco
// pequeño), dialogo, marcoGrande y tarjeta.

const NOMBRE = 'pictograma-ampliado';

const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// "280ms" → 280. Si el token faltara, 280 (el valor del design system).
const tokenMs = (nombre) => {
  const valor = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(nombre));
  return Number.isFinite(valor) ? valor : 280;
};
const curva = () => getComputedStyle(document.documentElement).getPropertyValue('--ease-standard').trim() || 'ease';

// Transformación que lleva el rectángulo `grande` hasta donde está `pequeño` (centro y tamaño).
const delta = (pequeño, grande) => {
  const dx = pequeño.left + pequeño.width / 2 - (grande.left + grande.width / 2);
  const dy = pequeño.top + pequeño.height / 2 - (grande.top + grande.height / 2);
  return `translate(${dx}px, ${dy}px) scale(${pequeño.width / grande.width})`;
};

export function useVistaAmpliada() {
  const [abierta, setAbierta] = useState(false);
  const origen = useRef(null);
  const dialogo = useRef(null);
  const marcoGrande = useRef(null);
  const tarjeta = useRef(null);
  // Mientras se anima, se ignoran más toques (doble toque, Escape repetido).
  const animando = useRef(false);

  // El marco pequeño es el primer hijo del botón (el span de Pictograma).
  const marcoPequeño = () => origen.current?.firstElementChild;

  // flushSync: React pinta el diálogo YA, dentro de esta función, porque View Transitions hace
  // la segunda foto en cuanto termina la función que se le pasa.
  const mostrar = () => {
    flushSync(() => setAbierta(true));
    dialogo.current?.showModal();
    // showModal lleva el foco a la ✕ (el primer control); se lleva al diálogo, que tiene
    // tabIndex -1: el lector anuncia su nombre y el anillo solo sale al tabular hasta la ✕.
    dialogo.current?.focus({ preventScroll: true });
  };
  const ocultar = () => {
    dialogo.current?.close();
    flushSync(() => setAbierta(false));
    // El diálogo nativo ya devuelve el foco, pero no todos los navegadores lo hacen igual.
    origen.current?.focus();
  };

  const abrir = () => {
    if (abierta || animando.current) return;
    const pequeño = marcoPequeño();
    if (!pequeño || sinMovimiento()) return mostrar();

    if (document.startViewTransition) {
      animando.current = true;
      pequeño.style.viewTransitionName = NOMBRE;
      const transicion = document.startViewTransition(() => {
        pequeño.style.viewTransitionName = '';
        mostrar();
        if (marcoGrande.current) marcoGrande.current.style.viewTransitionName = NOMBRE;
      });
      transicion.finished.finally(() => {
        if (marcoGrande.current) marcoGrande.current.style.viewTransitionName = '';
        animando.current = false;
      });
      return;
    }

    const desde = pequeño.getBoundingClientRect();
    mostrar();
    const grande = marcoGrande.current;
    if (!grande) return;
    const opciones = { duration: tokenMs('--duration-overlay'), easing: curva() };
    animando.current = true;
    const vuelo = grande.animate([{ transform: delta(desde, grande.getBoundingClientRect()) }, { transform: 'none' }], opciones);
    tarjeta.current?.animate([{ opacity: 0 }, { opacity: 1 }], opciones);
    vuelo.finished.finally(() => {
      animando.current = false;
    });
  };

  const cerrar = () => {
    if (!abierta || animando.current) return;
    const pequeño = marcoPequeño();
    const grande = marcoGrande.current;
    if (!pequeño || !grande || sinMovimiento()) return ocultar();

    animando.current = true;
    if (document.startViewTransition) {
      grande.style.viewTransitionName = NOMBRE;
      const transicion = document.startViewTransition(() => {
        ocultar();
        pequeño.style.viewTransitionName = NOMBRE;
      });
      transicion.finished.finally(() => {
        pequeño.style.viewTransitionName = '';
        animando.current = false;
      });
      return;
    }

    const opciones = { duration: tokenMs('--duration-overlay'), easing: curva(), fill: 'forwards' };
    const vuelo = grande.animate([{ transform: 'none' }, { transform: delta(pequeño.getBoundingClientRect(), grande.getBoundingClientRect()) }], opciones);
    tarjeta.current?.animate([{ opacity: 1 }, { opacity: 0 }], opciones);
    vuelo.finished
      .catch(() => {})
      .finally(() => {
        ocultar();
        animando.current = false;
      });
  };

  return { abierta, abrir, cerrar, origen, dialogo, marcoGrande, tarjeta };
}
