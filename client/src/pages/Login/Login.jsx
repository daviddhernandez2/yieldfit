import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import Button from '../../components/Button/Button.jsx';
import Input from '../../components/Input/Input.jsx';
import styles from './Login.module.css';

// Pantalla de login. Formulario con email + password.
// Usa la función login() del AuthContext, que se encarga de guardar el token
// en localStorage y actualizar el estado global. Tras éxito, navega al dashboard.
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (error) {
      // El backend devuelve 401 con un mensaje cuando las credenciales fallan.
      // Lo extraemos para mostrar feedback claro al usuario.
      const message =
        error.response?.data?.message || 'Error al iniciar sesión. Inténtalo de nuevo.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Iniciar sesión</h1>
        <p className={styles.subtitle}>Bienvenido de nuevo a Yield Fit</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            id="password"
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {errorMessage && (
            <div className={styles.errorBanner} role="alert">
              {errorMessage}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={submitting || !email || !password}
          >
            {submitting ? 'Entrando...' : 'Iniciar sesión'}
          </Button>
        </form>

        <p className={styles.footer}>
          ¿No tienes cuenta?{' '}
          <Link to="/register" className={styles.link}>
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}