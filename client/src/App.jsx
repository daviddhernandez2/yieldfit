import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import Welcome from './pages/Welcome/Welcome.jsx';
import Login from './pages/Login/Login.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';

// Placeholder para la pantalla de Register. Lo implementaremos en el Bloque 3.2.
function RegisterPlaceholder() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Register</h1>
      <p>Formulario pendiente. Lo implementaremos en el siguiente bloque.</p>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterPlaceholder />} />

          {/* Ruta privada */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Cualquier URL desconocida vuelve a Welcome. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;