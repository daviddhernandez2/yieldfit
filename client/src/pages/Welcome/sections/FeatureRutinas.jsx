import useInView from '@/hooks/useInView.js';
import styles from '@/pages/Welcome/sections/FeatureRutinas.module.css';

// Bloque 1 de la landing: presenta la funcionalidad de creación de rutinas.
// A la izquierda, tres chips (Pecho, Espalda, Pierna). Cada chip tiene su
// propio IntersectionObserver (vía useInView), así que anima cuando ESE
// chip concreto entra en viewport — no cuando lo hace la sección completa.
// El stagger visual surge de forma natural del propio scroll, en vez de
// un delay artificial fijo por índice. A la derecha, el texto explicativo,
// ligado a la visibilidad de la sección completa. En móvil se apilan
// verticalmente (chips arriba, texto debajo).
export default function FeatureRutinas() {
  const [sectionRef, sectionVisible] = useInView({ threshold: 0.3 });

  // Un useInView por chip. Como son 3 elementos fijos (no una lista
  // dinámica), llamar el hook 3 veces de forma incondicional respeta las
  // Rules of Hooks sin necesidad de un hook "multi-target" genérico.
  const chip1 = useInView({ threshold: 0.5 });
  const chip2 = useInView({ threshold: 0.5 });
  const chip3 = useInView({ threshold: 0.5 });

  const chips = [
    { sigla: 'PE', nombre: 'Entrenamiento de pecho', inView: chip1 },
    { sigla: 'ES', nombre: 'Entrenamiento de espalda', inView: chip2 },
    { sigla: 'PI', nombre: 'Entrenamiento de pierna', inView: chip3 },
  ];

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.grid}>
        <div className={styles.chips}>
          {chips.map(({ sigla, nombre, inView: [chipRef, chipVisible] }) => (
            <div
              key={sigla}
              ref={chipRef}
              className={`${styles.chip} ${chipVisible ? styles.chipVisible : ''}`}
            >
              <span className={styles.sigla}>{sigla}</span>
              <span className={styles.nombre}>{nombre}</span>
            </div>
          ))}
        </div>

        <div className={`${styles.texto} ${sectionVisible ? styles.textoVisible : ''}`}>
          <h2 className={styles.titulo}>Crea rutinas de entrenamiento</h2>
          <p className={styles.parrafo}>
            Añade de forma sencilla todos los ejercicios que desees
          </p>
        </div>
      </div>
    </section>
  );
}