import Sidebar from '../Sidebar/Sidebar.jsx';
import TabBar from '../TabBar/TabBar.jsx';
import MiniSession from '../MiniSession/MiniSession.jsx';
import DarkVeil from '../DarkVeil/DarkVeil.jsx';
import styles from './Layout.module.css';

// Layout de las rutas privadas.
// El fondo animado DarkVeil actúa como capa ambiental global de toda la app,
// unificando visualmente todas las pantallas con el mismo tratamiento estético
// que Welcome (donde usamos ColorBends). Es fixed y ocupa todo el viewport
// independientemente del scroll, por lo que un solo componente cubre toda
// la experiencia de sesión.
export default function Layout({ children }) {
  return (
    <div className={styles.layout}>
      <div className={styles.veil} aria-hidden="true">
        <DarkVeil />
      </div>
      <Sidebar />
      <main className={styles.main}>{children}</main>
      <TabBar />
      <MiniSession />
    </div>
  );
}