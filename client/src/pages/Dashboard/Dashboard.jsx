import { useAuth } from '../../hooks/useAuth.js';

// Página principal de usuario autenticado. Aquí mostramos sus datos
// para confirmar que la conexión con el backend funciona.
// En la Semana 3 esta página se convertirá en el panel real de la app.
export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Bienvenido, {user?.nombreCompleto}.</p>
      <p>Email: {user?.email}</p>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}