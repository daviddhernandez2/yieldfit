import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resetPassword } from '@/api/auth.js';
import Button from '@/components/Button/Button.jsx';
import Input from '@/components/Input/Input.jsx';
import ServerWakingUp from '@/components/ServerWakingUp/ServerWakingUp.jsx';
// Misma tarjeta que el login.
import styles from '@/pages/Login/Login.module.css';

const MINIMO = 8; // el mismo mínimo que el servidor

// El token llega detrás de "#" (yieldfit.app/restablecer#token=…): esa parte de la URL el
// navegador no la envía a ningún servidor, así que no queda en los logs de Vercel.
const leerToken = () => new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '';

// Pantalla del enlace del email (bloque 11b): elegir la contraseña nueva. Al terminar lleva
// al login con un aviso (decisión de David): así se comprueba que la nueva funciona.
export default function Restablecer() {
  const navigate = useNavigate();
  // Se lee al montar (inicializador de useState) y se guarda en el estado.
  const [token] = useState(leerToken);
  const [password, setPassword] = useState('');
  const [repetida, setRepetida] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  // El servidor respondió que el enlace no vale (400): se ofrece pedir otro.
  const [enlaceInvalido, setEnlaceInvalido] = useState(false);

  // Después, se quita de la barra de direcciones: que no quede en el historial del navegador
  // ni se comparta al copiar la URL. Va en un efecto y no al leerlo porque en desarrollo
  // React ejecuta dos veces el inicializador (modo estricto): si borrara la URL ahí, la
  // segunda lectura no encontraría el token. Borrarla dos veces, en cambio, no cambia nada.
  // Consecuencia: al recargar, el token ya no está y hay que volver a abrir el email.
  useEffect(() => {
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    if (password.length < MINIMO) return setError(`La contraseña necesita al menos ${MINIMO} caracteres.`);
    if (password !== repetida) return setError('Las dos contraseñas no coinciden.');

    setError('');
    setGuardando(true);
    try {
      const response = await resetPassword(token, password);
      navigate('/login', { replace: true, state: { aviso: response.data.message } });
    } catch (err) {
      setError(err.response?.data?.message || 'No se ha podido cambiar la contraseña. Inténtalo de nuevo.');
      setEnlaceInvalido(err.response?.status === 400);
      setGuardando(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Enlace no válido</h1>
          <p className={styles.subtitle}>
            Abre el enlace directamente desde el email. Si ya lo usaste o ha caducado, pide otro.
          </p>
          <p className={styles.footer}>
            <Link to="/recuperar" className={styles.link}>
              Pedir otro enlace
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Nueva contraseña</h1>
        <p className={styles.subtitle}>Al cambiarla se cerrará la sesión en todos tus dispositivos.</p>

        <form className={styles.form} onSubmit={guardar} noValidate>
          {/* new-password: el gestor de contraseñas del iPhone ofrece guardarla. */}
          <Input
            id="password"
            label={`Contraseña nueva (mínimo ${MINIMO} caracteres)`}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            autoFocus
          />
          <Input
            id="repetida"
            label="Repite la contraseña"
            type="password"
            value={repetida}
            onChange={(e) => setRepetida(e.target.value)}
            autoComplete="new-password"
          />
          {error && (
            <div className={styles.errorBanner} role="alert">
              {error}{' '}
              {/* Si el enlace ya no vale, lo útil es pedir otro desde aquí mismo. */}
              {enlaceInvalido && (
                <Link to="/recuperar" className={styles.link}>
                  Pedir otro enlace
                </Link>
              )}
            </div>
          )}
          <Button type="submit" variant="primary" fullWidth disabled={guardando || !password || !repetida}>
            {guardando ? 'Guardando...' : 'Cambiar contraseña'}
          </Button>
          <ServerWakingUp />
        </form>
      </div>
    </div>
  );
}
