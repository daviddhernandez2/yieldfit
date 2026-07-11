import useInView from '@/hooks/useInView.js';
import styles from '@/pages/Welcome/sections/FeatureProgreso.module.css';

// Bloque 3: presenta la visualización del progreso con una card que
// contiene un gráfico de área SVG que se dibuja al entrar en viewport.
// Debajo del gráfico se listan dos ejercicios con sus porcentajes de
// mejora, que aparecen con fade escalonado tras el trazo. A la derecha
// el texto explicativo del método Epley (1RM).
export default function FeatureProgreso() {
  const [ref, visible] = useInView({ threshold: 0.35 });

  return (
    <section ref={ref} className={styles.section}>
      <div className={styles.grid}>
        <div className={`${styles.card} ${visible ? styles.cardVisible : ''}`}>
          <svg
            className={styles.grafico}
            viewBox="0 0 400 140"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3ef87e" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3ef87e" stopOpacity="0" />
              </linearGradient>
            </defs>

            <path
              className={styles.area}
              d="M 0 90 C 40 80, 80 100, 120 85 C 160 70, 200 50, 240 55 C 280 60, 320 40, 400 30 L 400 140 L 0 140 Z"
              fill="url(#areaGrad)"
            />

            <path
              className={styles.linea}
              d="M 0 90 C 40 80, 80 100, 120 85 C 160 70, 200 50, 240 55 C 280 60, 320 40, 400 30"
              fill="none"
              stroke="#3ef87e"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>

          <div className={styles.ejercicios}>
            <div className={styles.ejercicio} style={{ transitionDelay: '1400ms' }}>
              <span className={styles.ejSigla}>SL</span>
              <span className={styles.ejNombre}>Sentadilla Libre</span>
              <span className={styles.ejPct}>↑ 5,2%</span>
            </div>
            <div className={styles.ejercicio} style={{ transitionDelay: '1600ms' }}>
              <span className={styles.ejSigla}>PB</span>
              <span className={styles.ejNombre}>Press banca</span>
              <span className={styles.ejPct}>↑ 8,6%</span>
            </div>
          </div>
        </div>

        <div className={styles.texto}>
          <h2 className={styles.titulo}>Visualiza tu progreso</h2>
          <p className={styles.parrafo}>
            Analiza de un vistazo tu progresión en el entrenamiento utilizando
            el método Epley (1RM)
          </p>
        </div>
      </div>
    </section>
  );
}