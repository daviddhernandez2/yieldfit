import { useAuth } from '../../hooks/useAuth.js';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Inicio</h1>
      <p>Bienvenido, {user?.nombreCompleto}.</p>
      <p>Email: {user?.email}</p>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}