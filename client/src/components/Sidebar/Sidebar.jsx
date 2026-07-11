import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '@/components/NavItems.jsx';
import Logo from '@/components/Logo/Logo.jsx';
import styles from '@/components/Sidebar/Sidebar.module.css';

// Sidebar vertical para pantallas desktop. Solo se muestra en >=768px.
// El logo va arriba, fuera del card de navegación; los items dentro del card
// para que la sección activa quede visualmente contenida (patrón del mockup).
export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <Logo width={130} className={styles.logo} />

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ''}`
            }
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}