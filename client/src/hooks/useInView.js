import { useEffect, useRef, useState } from 'react';

// Hook para detectar cuándo un elemento entra en el viewport.
// Se usa para disparar animaciones "al hacer scroll" en secciones
// concretas de la landing. Devuelve una ref para asignar al elemento
// y un booleano estaVisible que pasa a true cuando entra en pantalla.
// Por defecto se activa una sola vez (no se resetea al salir) para
// evitar que las animaciones se disparen cada vez que el usuario
// hace scroll arriba y abajo, lo cual sería molesto.
export default function useInView({ threshold = 0.25, once = true } = {}) {
  const ref = useRef(null);
  const [estaVisible, setEstaVisible] = useState(false);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEstaVisible(true);
          if (once) observer.unobserve(elemento);
        } else if (!once) {
          setEstaVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(elemento);
    return () => observer.disconnect();
  }, [threshold, once]);

  return [ref, estaVisible];
}