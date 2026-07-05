import Sidebar from '../Sidebar/Sidebar.jsx';
import TabBar from '../TabBar/TabBar.jsx';
import MiniSession from '../MiniSession/MiniSession.jsx';
import styles from './Layout.module.css';

export default function Layout({ children }) {
  return (
    <div className={styles.layout}>
      <div className={styles.glow} aria-hidden="true" />
      <Sidebar />
      <main className={styles.main}>{children}</main>
      <TabBar />
      <MiniSession />
    </div>
  );
}