import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button.jsx';
import styles from './Welcome.module.css';

// Pantalla de bienvenida. Es la primera vista al entrar sin sesión.
// Da dos caminos: registrarse (usuario nuevo) o iniciar sesión (usuario existente).
// No tiene formulario propio; solo enruta al flujo correspondiente.
export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.logoSection}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>▲</span>
          <span className={styles.logoText}>Yield</span>
          <span className={styles.logoSuffix}>FIT</span>
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="primary" fullWidth onClick={() => navigate('/register')}>
          Registrarse
        </Button>
        <Button variant="outline" fullWidth onClick={() => navigate('/login')}>
          Iniciar sesión
        </Button>
      </div>
    </div>
  );
}