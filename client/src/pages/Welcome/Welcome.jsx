import { Link } from 'react-router-dom';
import Dither from '../../components/Dither/Dither.jsx';
import Logo from '../../components/Logo/Logo.jsx';
import Button from '../../components/Button/Button.jsx';
import styles from './Welcome.module.css';

// Pantalla de bienvenida. Fondo ColorBends (WebGL) a pantalla completa,
// logo pequeño arriba a la izquierda (desktop) o centrado (móvil), botones
// en el header (desktop) o al pie (móvil), y titular grande en el centro.
// El diseño responsive replica el mockup: layout distinto según viewport.
export default function Welcome() {
  return (
    <div className={styles.page}>
      {/* Fondo animado a pantalla completa. Va como primera capa (z-index 0)
          y todo lo demás lo tapa desde encima. */}
      <div className={styles.background} aria-hidden="true">
          <Dither/>
      </div>
      {/* Header: en desktop se ve como una barra superior con logo a la
          izquierda y botones a la derecha. En móvil el logo queda centrado
          y los botones desaparecen de aquí (van al footer). */}
      <header className={styles.header}>
        <Logo width={125} className={styles.logo} />
        <nav className={styles.headerActions}>
          <Link to="/login" className={styles.linkWrapper}>
            <Button variant="outline">Iniciar sesión</Button>
          </Link>
          <Link to="/register" className={styles.linkWrapper}>
            <Button variant="primary">Registrarse</Button>
          </Link>
        </nav>
      </header>

      {/* Titular central. Grande, en negrita, con salto de línea natural
          según el ancho del viewport. */}
      <main className={styles.main}>
        <h1 className={styles.headline}>
          Registra, visualiza y progresa.
        </h1>
      </main>

      {/* Footer: solo se muestra en móvil, con los botones apilados en fila. */}
      <footer className={styles.footer}>
        <Link to="/login" className={styles.linkWrapper}>
          <Button variant="outline" fullWidth>Iniciar sesión</Button>
        </Link>
        <Link to="/register" className={styles.linkWrapper}>
          <Button variant="primary" fullWidth>Registrarse</Button>
        </Link>
      </footer>
    </div>
  );
}