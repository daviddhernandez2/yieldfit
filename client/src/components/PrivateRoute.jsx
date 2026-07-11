import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';

// Componente envoltorio para rutas que requieren autenticación.
// Tres comportamientos según el estado del contexto:
//  - 'loading': mostramos un placeholder mientras se valida el token.
//  - 'authenticated': renderizamos el contenido normalmente.
//  - 'unauthenticated': redirigimos a /login.
export default function PrivateRoute({ children }) {
  const { status } = useAuth();

  if (status === 'loading') {
    return <p>Cargando...</p>;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
