import { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext.jsx';
import PrivateRoute from '@/components/PrivateRoute.jsx';
import Layout from '@/components/Layout/Layout.jsx';
import Intro from '@/components/Intro/Intro.jsx';
import { haySesionGuardada } from '@/utils/indicadorSesion.js';

// Todas las páginas se cargan de forma perezosa (code-splitting por ruta).
// Cada una se descarga en un chunk separado la primera vez que se visita
// su ruta, en vez de ir todas dentro del bundle inicial. Reduce el peso
// del primer render y evita el aviso de Vite sobre chunks > 500kB.
const Welcome = lazy(() => import('@/pages/Welcome/Welcome.jsx'));
const Login = lazy(() => import('@/pages/Login/Login.jsx'));
const Register = lazy(() => import('@/pages/Register/Register.jsx'));
const Dashboard = lazy(() => import('@/pages/Dashboard/Dashboard.jsx'));
const Exercises = lazy(() => import('@/pages/Exercises/Exercises.jsx'));
const ExerciseForm = lazy(() => import('@/pages/ExerciseForm/ExerciseForm.jsx'));
const Workouts = lazy(() => import('@/pages/Workouts/Workouts.jsx'));
const WorkoutForm = lazy(() => import('@/pages/WorkoutForm/WorkoutForm.jsx'));
const ActiveSession = lazy(() => import('@/pages/ActiveSession/ActiveSession.jsx'));
const ReplaceExercise = lazy(() => import('@/pages/ReplaceExercise/ReplaceExercise.jsx'));
const GroupForm = lazy(() => import('@/pages/GroupForm/GroupForm.jsx'));
const History = lazy(() => import('@/pages/History/History.jsx'));
const SessionDetail = lazy(() => import('@/pages/SessionDetail/SessionDetail.jsx'));
const Profile = lazy(() => import('@/pages/Profile/Profile.jsx'));
const Developer = lazy(() => import('@/pages/Developer/Developer.jsx'));

// Fallback minimalista mientras se descarga el chunk de la página.
// Se muestra solo durante fracciones de segundo en conexiones normales.
const RouteFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
    <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>Cargando…</span>
  </div>
);

function App() {
  // Intro cinemática:
  //   - Si este dispositivo NO tiene una sesión abierta, la intro aparece en cada refresco.
  //   - Si la tiene, no aparece: agilizamos el uso diario a quien ya conoce la marca.
  // Se decide con un indicador sin datos (utils/indicadorSesion.js): desde el bloque 11 el
  // token vive en memoria y al abrir la app todavía no se sabe si la sesión sigue viva.
  const [mostrarIntro, setMostrarIntro] = useState(() => !haySesionGuardada());

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
        <Suspense fallback={<RouteFallback />}>
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
            {['/groups/new', '/groups/:id/edit'].map((ruta) => (
              <Route
                key={ruta}
                path={ruta}
                element={
                  <PrivateRoute>
                    <Layout>
                      <GroupForm />
                    </Layout>
                  </PrivateRoute>
                }
              />
            ))}
            <Route
              path="/sessions/active/replace/:index"
              element={
                <PrivateRoute>
                  <Layout>
                    <ReplaceExercise />
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
            {/* Solo admin (bloque 11b): la página redirige si no lo eres, y el servidor
                responde 403 a cada petición. */}
            <Route
              path="/developer"
              element={
                <PrivateRoute>
                  <Layout>
                    <Developer />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Cualquier URL desconocida vuelve a Welcome. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;