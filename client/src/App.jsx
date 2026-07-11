import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext.jsx';
import PrivateRoute from '@/components/PrivateRoute.jsx';
import Layout from '@/components/Layout/Layout.jsx';
import Intro from '@/components/Intro/Intro.jsx';
import Welcome from '@/pages/Welcome/Welcome.jsx';
import Login from '@/pages/Login/Login.jsx';
import Register from '@/pages/Register/Register.jsx';
import Dashboard from '@/pages/Dashboard/Dashboard.jsx';
import Exercises from '@/pages/Exercises/Exercises.jsx';
import ExerciseForm from '@/pages/ExerciseForm/ExerciseForm.jsx';
import Workouts from '@/pages/Workouts/Workouts.jsx';
import WorkoutForm from '@/pages/WorkoutForm/WorkoutForm.jsx';
import ActiveSession from '@/pages/ActiveSession/ActiveSession.jsx';
import History from '@/pages/History/History.jsx';
import SessionDetail from '@/pages/SessionDetail/SessionDetail.jsx';
import Profile from '@/pages/Profile/Profile.jsx';

function App() {
  // Intro cinemática:
  //   - Si el usuario NO tiene sesión activa (no hay token en localStorage),
  //     el intro aparece en cada refresco de la app.
  //   - Si el usuario está logueado, no aparece: agilizamos el uso diario
  //     para quien ya conoce la marca y usa la app con normalidad.
  const [mostrarIntro, setMostrarIntro] = useState(() => {
    return !localStorage.getItem('yieldfit_token');
  });

  const finalizarIntro = () => {
    setMostrarIntro(false);
  };

  // Permite reactivar la intro desde cualquier parte de la app.
  // La exponemos como función global en window para que el componente Logo
  // pueda llamarla sin necesidad de Context ni propagación de props.
  if (typeof window !== 'undefined') {
    window.__yieldfitReplayIntro = () => setMostrarIntro(true);
  }

  return (
    <AuthProvider>
      {mostrarIntro && <Intro onFinish={finalizarIntro} />}
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
                  <WorkoutForm />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/workouts/:id/edit"
            element={
              <PrivateRoute>
                <Layout>
                  <WorkoutForm />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/sessions/active"
            element={
              <PrivateRoute>
                <Layout>
                  <ActiveSession />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/history"
            element={
              <PrivateRoute>
                <Layout>
                  <History />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/history/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <SessionDetail />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Layout>
                  <Profile />
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