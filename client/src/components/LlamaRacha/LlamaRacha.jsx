import { useId } from 'react';
import styles from '@/components/LlamaRacha/LlamaRacha.module.css';

// Llama de la racha (bloque 9d; opción A del design system, tarjeta "Racha"). Se enciende
// mientras llevas semanas seguidas entrenando y se apaga si la racha se rompe, como en Duolingo
// o Snapchat. Tres estados, que decide el servidor (utils/actividad.js):
//   - "activa": encendida (relleno verde con halo). Al aparecer se enciende una vez (600 ms);
//     con "reducir movimiento", aparece ya encendida.
//   - "enRiesgo": a medio encender (contorno verde, mitad de abajo rellena).
//   - "rota": apagada (contorno gris, sin relleno).
// Es un dibujo (aria-hidden): quien la usa dice el estado con texto.
//
// Props: estado, tamano (px, por defecto 24).
const LLAMA = 'M12 2.5c.6 3.2-1.6 4.9-3.1 6.7C7.4 11 6 12.9 6 15.4a6 6 0 0 0 12 0c0-2.5-1.2-4.3-2.6-5.8-.3 1.5-1.1 2.5-2.3 2.9.4-3.4-.4-6.7-1.1-10Z';

export default function LlamaRacha({ estado, tamano = 24, className = '' }) {
  // Ids de los degradados: únicos por llama, que puede haber varias en la página.
  const id = useId().replace(/:/g, '');
  const relleno = estado === 'activa' ? `url(#lleno${id})` : estado === 'enRiesgo' ? `url(#mitad${id})` : 'none';

  return (
    <svg
      className={`${styles.llama} ${styles[estado]} ${className}`}
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`lleno${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="var(--chart-gain)" />
          <stop offset="1" stopColor="var(--color-accent)" />
        </linearGradient>
        {/* Mitad de abajo rellena, mitad de arriba vacía: corte seco al 50 %. */}
        <linearGradient id={`mitad${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="var(--chart-gain)" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="var(--chart-gain)" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="var(--chart-gain)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={LLAMA} fill={relleno} className={styles.contorno} />
    </svg>
  );
}
