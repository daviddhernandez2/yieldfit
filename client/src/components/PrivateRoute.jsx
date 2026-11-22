import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';
import ServerWakingUp from '@/components/ServerWakingUp/ServerWakingUp.jsx';

// Componente envoltorio para rutas que requieren autenticación.
// Tres comportamientos según el estado del contexto:
//  - 'loading': mostramos un placeholder mientras se valida el token.
//  - 'authenticated': renderizamos el contenido normalmente.
//  - 'unauthenticated': redirigimos a /login.
export default function PrivateRoute({ children }) {
  const { status } = useAuth();

  // Es la primera petición al abrir la app con sesión (validar el token), y la que
  // más a menudo se encuentra el servidor dormido: aquí se avisa si tarda.
  if (status === 'loading') {
    return (
      <>
        <p>Cargando...</p>
        <ServerWakingUp />
      </>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
