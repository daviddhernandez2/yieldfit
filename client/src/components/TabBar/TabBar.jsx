import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../NavItems.jsx';
import styles from './TabBar.module.css';

// Tab bar inferior para pantallas móviles. Se oculta en >=768px.
// Cada item es vertical (icono encima del label, formato típico de apps móviles).
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