import { Link } from 'react-router-dom';
import Button from '../../../components/Button/Button.jsx';
import useInView from '../../../hooks/useInView.js';
import styles from './CtaFinal.module.css';

// CTA final de la landing: botón grande "Empieza ya" que lleva al registro.
// Aparece con fade + scale al entrar en viewport y tiene padding vertical
// amplio para separar el bloque anterior del final de la página.
export default function CtaFinal() {
  const [ref, visible] = useInView({ threshold: 0.5 });

  return (
    <section ref={ref} className={styles.section}>
      <div className={`${styles.wrapper} ${visible ? styles.visible : ''}`}>
        <Link to="/register" className={styles.linkWrapper}>
          <Button variant="outline">Empieza ya</Button>
        </Link>
      </div>
    </section>
  );
}