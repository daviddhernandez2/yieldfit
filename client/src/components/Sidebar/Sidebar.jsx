import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../NavItems.jsx';
import styles from './Sidebar.module.css';

// Sidebar vertical para pantallas desktop. Solo se muestra en >=768px.
// Cada item usa NavLink de React Router para detectar la ruta activa
// y aplicar el estilo de seleccionado automáticamente.
export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>▲</span>
        <span className={styles.logoText}>Yield</span>
        <span className={styles.logoSuffix}>FIT</span>
      </div>

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