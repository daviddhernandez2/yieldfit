import useInView from '@/hooks/useInView.js';
import styles from '@/pages/Welcome/sections/FeatureRutinas.module.css';

// Bloque 1 de la landing: presenta la funcionalidad de creación de rutinas.
// A la izquierda muestra tres chips (Pecho, Espalda, Pierna) que aparecen
// en cascada uno detrás de otro al entrar en viewport. A la derecha, el
// texto explicativo. En móvil se apilan verticalmente (chips arriba, texto
// debajo) para respetar la jerarquía visual del scroll.
export default function FeatureRutinas() {
  const [ref, visible] = useInView({ threshold: 0.3 });

  const chips = [
    { sigla: 'PE', nombre: 'Entrenamiento de pecho' },
    { sigla: 'ES', nombre: 'Entrenamiento de espalda' },
    { sigla: 'PI', nombre: 'Entrenamiento de pierna' },
  ];

  return (
    <section ref={ref} className={styles.section}>
      <div className={styles.grid}>
        <div className={`${styles.chips} ${visible ? styles.chipsVisible : ''}`}>
          {chips.map((c, i) => (
            <div
              key={c.sigla}
              className={styles.chip}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <span className={styles.sigla}>{c.sigla}</span>
              <span className={styles.nombre}>{c.nombre}</span>
            </div>
          ))}
        </div>

        <div className={`${styles.texto} ${visible ? styles.textoVisible : ''}`}>
          <h2 className={styles.titulo}>Crea rutinas de entrenamiento</h2>
          <p className={styles.parrafo}>
            Añade de forma sencilla todos los ejercicios que desees
          </p>
        </div>
      </div>
    </section>
  );
}