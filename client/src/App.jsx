import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import Layout from './components/Layout/Layout.jsx';
import Welcome from './pages/Welcome/Welcome.jsx';
import Login from './pages/Login/Login.jsx';
import Register from './pages/Register/Register.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Exercises from './pages/Exercises/Exercises.jsx';
import ExerciseForm from './pages/ExerciseForm/ExerciseForm.jsx';
import Workouts from './pages/Workouts/Workouts.jsx';

// Placeholder para WorkoutForm. Se implementará en el Bloque 3.4b.
function WorkoutFormPlaceholder() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Formulario de rutina</h1>
      <p>Pendiente en el siguiente bloque.</p>
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
          <Route path="/register" element={<Register />} />

          {/* Rutas privadas */}
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
          <Route
            path="/exercises/new"
            element={
              <PrivateRoute>
                <Layout>
                  <ExerciseForm />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/exercises/:id/edit"
            element={
              <PrivateRoute>
                <Layout>
                  <ExerciseForm />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/workouts"
            element={
              <PrivateRoute>
                <Layout>
                  <Workouts />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/workouts/new"
            element={
              <PrivateRoute>
                <Layout>
                  <WorkoutFormPlaceholder />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/workouts/:id/edit"
            element={
              <PrivateRoute>
                <Layout>
                  <WorkoutFormPlaceholder />
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