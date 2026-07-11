import { useEffect, useState } from 'react';
import styles from '@/components/Intro/Intro.module.css';

// Intro cinemática mínima: fondo negro con el símbolo de la marca centrado.
// Fade-in del símbolo al aparecer y fade-out al terminar, sin efectos de
// canvas ni animaciones extra. Se muestra solo antes del login si no hay
// sesión iniciada.
export default function Intro({ onFinish }) {
    const [saliendo, setSaliendo] = useState(false);

    useEffect(() => {
        // Duración total ~2s. A los 1.5s empieza el fade-out del intro,
        // a los 2s desmontamos para dar paso a Welcome.
        const timerSalir = setTimeout(() => setSaliendo(true), 1500);
        const timerFin = setTimeout(() => onFinish(), 2000);
        return () => {
            clearTimeout(timerSalir);
            clearTimeout(timerFin);
        };
    }, [onFinish]);

    return (
        <div className={`${styles.intro} ${saliendo ? styles.saliendo : ''}`} aria-hidden="true">
            <div className={styles.logoWrapper}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 175.52 175.52"
                    width="80"
                    height="80"
                    aria-label="Yield Fit"
                >
                    <defs>
                        <linearGradient id="introSymbolGrad" x1="79.59" y1="69.28" x2="55.66" y2="117.26" gradientUnits="userSpaceOnUse">
                            <stop offset="0" stopColor="#41cb7e" />
                            <stop offset=".8" stopColor="#3ef87e" />
                        </linearGradient>
                    </defs>
                    <rect fill="#0d0d0d" width="175.52" height="175.52" rx="38.17" ry="38.17" />
                    <g>
                        <path fill="#3ef87e" d="M101.45,56.73l34.04,61.93h-29.56l-18.3-35.7-18.04,35.7h-29.56l33.91-61.93s27.51,0,27.51,0Z" />
                        <polygon fill="url(#introSymbolGrad)" points="87.63 82.96 73.94 56.73 40.03 118.79 69.59 118.79 87.63 82.96" />
                    </g>
                </svg>
            </div>
        </div>
    );
}