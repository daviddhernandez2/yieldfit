import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import Login from './pages/Login/Login.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';

// Componente raíz de la aplicación.
// Envuelve toda la app en el AuthProvider para que cualquier componente
// del árbol pueda acceder al contexto de autenticación.
// El router define las rutas: públicas (login) y privadas (resto).
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública: accesible sin autenticación. */}
          <Route path="/login" element={<Login />} />

          {/* Ruta privada: protegida con PrivateRoute. */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Cualquier otra URL redirige a /dashboard.
              Si el usuario no está autenticado, PrivateRoute lo enviará a /login. */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;