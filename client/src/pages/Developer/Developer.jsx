import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';
import { listUsers } from '@/api/admin.js';
import Chip from '@/components/Chip/Chip.jsx';
import Proximamente from '@/components/Proximamente/Proximamente.jsx';
import ReportesAdmin from '@/pages/Developer/ReportesAdmin.jsx';
import UsuariosAdmin from '@/pages/Developer/UsuariosAdmin.jsx';
import styles from '@/pages/Developer/Developer.module.css';

const SECCIONES = [
  { valor: 'reportes', etiqueta: 'Reportes' },
  { valor: 'usuarios', etiqueta: 'Usuarios' },
  { valor: 'docs', etiqueta: 'Documentación' },
];

// Página de developer (bloque 11b, paso 11b.3), solo para admin.
//   - Reportes: la bandeja de fallos enviados con el botón, con filtros y estado.
//   - Usuarios: quién usa la app y cuánto, sin datos personales de más.
//   - Documentación: hueco para leer /docs y DECISIONS.md desde GitHub más adelante.
//
// Que un usuario normal no la vea es solo comodidad: si fuerza la ruta, cada petición
// responde 403 (requireAdmin en el servidor).
export default function Developer() {
  const { user } = useAuth();
  const [seccion, setSeccion] = useState('reportes');

  // Los usuarios se cargan una vez aquí: los usa su sección y también el filtro "Usuario"
  // de los reportes.
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargandoUsers, setCargandoUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState('');

  const esAdmin = user?.rol === 'admin';

  useEffect(() => {
    if (!esAdmin) return;
    listUsers()
      .then((response) => {
        setUsers(response.data.users);
        setTotal(response.data.total);
      })
      .catch((err) => setErrorUsers(err.response?.data?.message || 'No se han podido cargar los usuarios.'))
      .finally(() => setCargandoUsers(false));
  }, [esAdmin]);

  if (!esAdmin) return <Navigate to="/" replace />;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Developer</h1>
      </header>

      <nav className={styles.secciones} aria-label="Secciones">
        {SECCIONES.map(({ valor, etiqueta }) => (
          <Chip
            key={valor}
            label={etiqueta}
            selected={seccion === valor}
            onClick={() => setSeccion(valor)}
          />
        ))}
      </nav>

      {seccion === 'reportes' && <ReportesAdmin users={users} />}

      {seccion === 'usuarios' && (
        <UsuariosAdmin users={users} total={total} cargando={cargandoUsers} error={errorUsers} />
      )}

      {seccion === 'docs' && (
        <section className={`${styles.vacio} glassCard`}>
          <Proximamente />
          <p>
            Aquí se leerán la documentación de <code>/docs</code> y <code>DECISIONS.md</code>,
            directamente del repositorio en GitHub, sin copias.
          </p>
        </section>
      )}
    </div>
  );
}
