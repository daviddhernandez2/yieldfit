import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../NavItems.jsx';
import styles from './TabBar.module.css';

// TabBar inferior para móvil. Solo visible por debajo de 768px.
// Diseñada como pill flotante con blur, coherente con el mockup:
// cada item apila icono + label, y el activo se marca con un pill
// verde translúcido que respeta el radio del contenedor.
export default function TabBar() {
  return (
    <nav className={styles.tabbar}>
      {NAV_ITEMS.map(({ path, label, Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `${styles.item} ${isActive ? styles.active : ''}`
          }
        >
          <Icon />
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}