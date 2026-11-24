import { useCallback, useEffect, useState } from 'react';
import { columnasParaAncho } from '@/utils/reticula.js';

// Columnas de la retícula del Dashboard (bloque 9d): 4 o 2 según el ancho del PROPIO dashboard,
// no de la pantalla (a 1024 px la barra lateral le quita espacio). Lo mide un ResizeObserver,
// como el calendario (bloque 8b).
//
// Devuelve [ref, columnas]: `ref` va en el contenedor de la retícula. Es una ref de función
// (callback ref) porque la retícula aparece cuando llegan los datos: con useRef el efecto no se
// enteraría de que el elemento ya existe.
export default function useColumnasDashboard() {
  const [elemento, setElemento] = useState(null);
  const [columnas, setColumnas] = useState(2);

  useEffect(() => {
    if (!elemento) return;
    // Primera medida en el momento, para no pintar un instante a 2 columnas en escritorio.
    setColumnas(columnasParaAncho(elemento.getBoundingClientRect().width));
    const observador = new ResizeObserver(([entrada]) => {
      setColumnas(columnasParaAncho(entrada.contentRect.width));
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [elemento]);

  const ref = useCallback((nodo) => setElemento(nodo), []);
  return [ref, columnas];
}
