import { Link } from 'react-router-dom';
import Logo from '../../components/Logo/Logo.jsx';
import Button from '../../components/Button/Button.jsx';
import styles from './Welcome.module.css';

// Pantalla de bienvenida. Presenta la marca y ofrece dos rutas: crear cuenta
// o iniciar sesión. El diseño replica el mockup de Figma: bloque central
// con logo + botones, y un glow verde inferior que refuerza la identidad
// sin competir con el contenido.
export default function Welcome() {
  return (
    <div className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.content}>
        <Logo className={styles.logo} />

        <div className={styles.actions}>
          <Link to="/register" className={styles.action}>
            <Button variant="primary" fullWidth>
              Registrarse
            </Button>
          </Link>
          <Link to="/login" className={styles.action}>
            <Button variant="outline" fullWidth>
              Iniciar sesión
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}