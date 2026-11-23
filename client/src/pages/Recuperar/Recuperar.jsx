import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '@/api/auth.js';
import Button from '@/components/Button/Button.jsx';
import Input from '@/components/Input/Input.jsx';
import ServerWakingUp from '@/components/ServerWakingUp/ServerWakingUp.jsx';
// Misma tarjeta que el login: es la misma familia de pantallas.
import styles from '@/pages/Login/Login.module.css';

// "¿Olvidaste tu contraseña?" (bloque 11b): pide el email y el servidor envía un enlace.
// El mensaje de después es el mismo exista o no la cuenta: lo dice el servidor y aquí se
// enseña tal cual. Por eso tampoco se dice "no existe ninguna cuenta con ese email".
export default function Recuperar() {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState('');
  const [error, setError] = useState('');

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const response = await forgotPassword(email);
      setEnviado(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'No se ha podido enviar. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Recuperar contraseña</h1>

        {enviado ? (
          <div className={styles.avisoBanner} role="status">
            {enviado} Revisa también la carpeta de spam. El enlace caduca en 30 minutos.
          </div>
        ) : (
          <>
            <p className={styles.subtitle}>
              Escribe el email de tu cuenta y te enviaremos un enlace para elegir una nueva.
            </p>
            <form className={styles.form} onSubmit={enviar} noValidate>
              <Input
                id="email"
                label="Email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
              {error && (
                <div className={styles.errorBanner} role="alert">
                  {error}
                </div>
              )}
              <Button type="submit" variant="primary" fullWidth disabled={enviando || !email}>
                {enviando ? 'Enviando...' : 'Enviar enlace'}
              </Button>
              <ServerWakingUp />
            </form>
          </>
        )}

        <p className={styles.footer}>
          <Link to="/login" className={styles.link}>
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
