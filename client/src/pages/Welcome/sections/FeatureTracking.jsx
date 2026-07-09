import { useEffect, useState } from 'react';
import useInView from '../../../hooks/useInView.js';
import styles from './FeatureTracking.module.css';

// Bloque 2: presenta el tracking activo del entrenamiento con un mockup
// estático de la pantalla ActiveSession. Al entrar en viewport dispara
// una secuencia coreografiada: abre el acordeón central, llena la barra
// de progreso del timer y baja el contador de descanso de 30 a 0. El
// resto de acordeones quedan cerrados como contexto visual.
export default function FeatureTracking() {
    const [ref, visible] = useInView({ threshold: 0.4 });
    const [abierto, setAbierto] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const [descanso, setDescanso] = useState(30);

    useEffect(() => {
        if (!visible) return;

        // Secuencia: acordeón a los 400ms, barra a los 1000ms, cuenta atrás
        // del descanso a los 1200ms con paso de 60ms hasta 0.
        const t1 = setTimeout(() => setAbierto(true), 400);
        const t2 = setTimeout(() => setProgreso(100), 1000);

        let contador;
        const t3 = setTimeout(() => {
            let n = 30;
            contador = setInterval(() => {
                n -= 1;
                setDescanso(n);
                if (n <= 0) clearInterval(contador);
            }, 60);
        }, 1200);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            if (contador) clearInterval(contador);
        };
    }, [visible]);

    const formatTiempo = (s) => {
        const m = Math.floor(s / 60).toString().padStart(2, '0');
        const rs = (s % 60).toString().padStart(2, '0');
        return `${m}:${rs}`;
    };

    return (
        <section ref={ref} className={styles.section}>
            <div className={styles.grid}>
                <div className={`${styles.texto} ${visible ? styles.textoVisible : ''}`}>
                    <h2 className={styles.titulo}>Trackea tu entrenamiento</h2>
                    <p className={styles.parrafo}>
                        Añade de forma sencilla todos los ejercicios que desees
                    </p>
                </div>

                <div className={styles.mock}>
                    <div className={styles.acordeon}>
                        <div className={styles.acordeonHeader}>
                            <span>Elevaciones laterales</span>
                            <div className={styles.acordeonRight}>
                                <span className={styles.serieCount}>3/3</span>
                                <span className={styles.chevron}>⌄</span>
                            </div>
                        </div>
                    </div>

                    <div className={`${styles.acordeon} ${styles.acordeonActivo}`}>
                        <div className={styles.acordeonHeader}>
                            <span>Press inclinado con barra</span>
                            <div className={styles.acordeonRight}>
                                <span className={styles.serieCount}>1/3</span>
                                <span className={`${styles.chevron} ${abierto ? styles.chevronOpen : ''}`}>⌄</span>
                            </div>
                        </div>

                        <div className={`${styles.acordeonBody} ${abierto ? styles.acordeonBodyOpen : ''}`}>
                            <div className={styles.tabla}>
                                <div className={styles.tablaHead}>
                                    <span></span>
                                    <span>Peso (kg)</span>
                                    <span>Reps</span>
                                    <span></span>
                                    <span></span>
                                </div>

                                <div className={`${styles.tablaRow} ${styles.tablaRowActiva}`}>
                                    <span>1</span>
                                    <span className={styles.inputMock}>67</span>
                                    <span className={styles.inputMock}>8</span>
                                    <div className={styles.timerBar}>
                                        <div
                                            className={styles.timerFill}
                                            style={{ width: `${progreso}%` }}
                                        />
                                        <span className={styles.timerTexto}>{formatTiempo(descanso)}</span>
                                    </div>
                                    <span className={styles.check}>✓</span>
                                </div>

                                <div className={styles.tablaRow}>
                                    <span>2</span>
                                    <span className={styles.inputMock}>-</span>
                                    <span className={styles.inputMock}>-</span>
                                    <div className={styles.timerBar}>
                                        <span className={styles.timerTexto}>02:00</span>
                                    </div>
                                    <span className={styles.checkPend}>○</span>
                                </div>
                                <div className={styles.tablaRow}>
                                    <span>3</span>
                                    <span className={styles.inputMock}>-</span>
                                    <span className={styles.inputMock}>-</span>
                                    <div className={styles.timerBar}>
                                        <span className={styles.timerTexto}>02:00</span>
                                    </div>
                                    <span className={styles.checkPend}>○</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.acordeon}>
                        <div className={styles.acordeonHeader}>
                            <span>Press con mancuerna</span>
                            <div className={styles.acordeonRight}>
                                <span className={styles.serieCount}>0/3</span>
                                <span className={styles.chevron}>⌄</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}