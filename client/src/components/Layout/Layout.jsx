import Sidebar from '@/components/Sidebar/Sidebar.jsx';
import TabBar from '@/components/TabBar/TabBar.jsx';
import MiniSession from '@/components/MiniSession/MiniSession.jsx';
import DarkVeil from '@/components/DarkVeil/DarkVeil.jsx';
import ServerWakingUp from '@/components/ServerWakingUp/ServerWakingUp.jsx';
import ReportarFallo from '@/components/ReportarFallo/ReportarFallo.jsx';
import { useLocation } from 'react-router-dom';
import { useActiveSession } from '@/hooks/useActiveSession.js';
import { hayBotonReemplazar, hayMiniSession } from '@/utils/barrasInferiores.js';
import styles from '@/components/Layout/Layout.module.css';

// Layout de las rutas privadas.
// El fondo animado DarkVeil actúa como capa ambiental global de toda la app,
// unificando visualmente todas las pantallas con una estética parecida a la de
// Welcome (que usa otro fondo, Dither). Es fixed y ocupa todo el viewport
// independientemente del scroll, por lo que un solo componente cubre toda
// la experiencia de sesión.
export default function Layout({ children }) {
  // Con MiniSession o «Reemplazar» abajo, la página deja más espacio al final (la misma regla
  // que sube el botón "Reportar": utils/barrasInferiores.js).
  const { pathname } = useLocation();
  const session = useActiveSession();
  const elevado = hayMiniSession(session, pathname) || hayBotonReemplazar(pathname);

  return (
    <div className={styles.layout}>
      <div className={styles.veil} aria-hidden="true">
        <DarkVeil />
      </div>
      <Sidebar />
      <main className={`${styles.main} ${elevado ? styles.mainElevado : ''}`}>{children}</main>
      <TabBar />
      <MiniSession />
      <ServerWakingUp flotante />
      <ReportarFallo />
    </div>
  );
}