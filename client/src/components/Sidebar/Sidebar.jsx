import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '@/components/NavItems.jsx';
import Icono from '@/components/Icono/Icono.jsx';
import Logo from '@/components/Logo/Logo.jsx';
import ReportarFallo from '@/components/ReportarFallo/ReportarFallo.jsx';
import styles from '@/components/Sidebar/Sidebar.module.css';

// Sidebar vertical para pantallas desktop. Solo se muestra en >=768px.
// El logo va arriba, fuera del card de navegación; los items dentro del card
// para que la sección activa quede visualmente contenida (patrón del mockup).
export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      {/* El contenedor lleva el margen: Logo fija padding: 0 en línea y una clase sobre
          el propio botón no podría cambiarlo. */}
      <div className={styles.logo}>
        <Logo width={130} />
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ path, label, icono }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ''}`
            }
          >
            <Icono nombre={icono} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Reportar un fallo, debajo del menú (bloque 9d). En el móvil es el círculo flotante. */}
      <ReportarFallo ubicacion="barraLateral" />
    </aside>
  );
}