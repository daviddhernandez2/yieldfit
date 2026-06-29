import Sidebar from '../Sidebar/Sidebar.jsx';
import TabBar from '../TabBar/TabBar.jsx';
import styles from './Layout.module.css';

// Layout principal para rutas autenticadas. Envuelve el contenido y muestra
// la navegación adecuada según el tamaño de pantalla:
// - <768px: barra de pestañas inferior (mobile).
// - >=768px: sidebar vertical izquierdo (desktop).
// CSS decide qué se ve mediante media queries, no JavaScript.
export default function Layout({ children }) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.content}>{children}</main>
      <TabBar />
    </div>
  );
}