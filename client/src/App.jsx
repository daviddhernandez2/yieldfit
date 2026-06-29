import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import Layout from './components/Layout/Layout.jsx';
import Welcome from './pages/Welcome/Welcome.jsx';
import Login from './pages/Login/Login.jsx';
import Register from './pages/Register/Register.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Exercises from './pages/Exercises/Exercises.jsx';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas privadas. Cada una se envuelve con PrivateRoute para protegerla. */}
     <Route
  path="/dashboard"
  element={
    <PrivateRoute>
      <Layout>
        <Dashboard />
      </Layout>
    </PrivateRoute>
  }
/>
          <Route
            path="/exercises"
            element={
              <PrivateRoute>
                <Layout>
                  <Exercises />
                </Layout>
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