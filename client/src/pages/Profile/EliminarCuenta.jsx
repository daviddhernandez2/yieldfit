import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth.js';
import Button from '@/components/Button/Button.jsx';
import GrupoBotones from '@/components/GrupoBotones/GrupoBotones.jsx';
import DeleteButton from '@/components/DeleteButton/DeleteButton.jsx';
import Input from '@/components/Input/Input.jsx';
import styles from '@/pages/Profile/Profile.module.css';

// "Eliminar mi cuenta" (bloque 11b, paso 11b.4). Dos pasos a propósito:
//   1. Un botón discreto abre el panel: nadie borra la cuenta por un toque sin querer.
//   2. El panel dice exactamente qué se borra y pide la contraseña: quien encuentre la
//      sesión abierta en un móvil ajeno no puede borrarla.
// No es un diálogo flotante porque necesita un campo de contraseña y en el iPhone el
// teclado se lleva mal con los diálogos centrados; el panel se abre en su sitio.
export default function EliminarCuenta() {
  const { eliminarCuenta } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [password, setPassword] = useState('');
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState('');

  const cancelar = () => {
    setAbierto(false);
    setPassword('');
    setError('');
  };

  const confirmar = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Escribe tu contraseña.');
      return;
    }
    setBorrando(true);
    setError('');
    try {
      // Si va bien, AuthContext cierra la sesión y la app lleva a /login: este componente
      // desaparece, así que no hay nada más que hacer aquí.
      await eliminarCuenta(password);
    } catch (err) {
      setError(err.response?.data?.message ?? 'No se ha podido eliminar la cuenta. Inténtalo de nuevo.');
      setBorrando(false);
    }
  };

  if (!abierto) {
    return (
      <div className={styles.eliminarCerrado}>
        <DeleteButton onClick={() => setAbierto(true)}>Eliminar mi cuenta</DeleteButton>
      </div>
    );
  }

  return (
    <section className={`${styles.eliminarPanel} glassCard`} aria-labelledby="eliminar-titulo">
      <h2 id="eliminar-titulo" className={styles.eliminarTitulo}>
        Eliminar mi cuenta
      </h2>
      <p className={styles.eliminarTexto}>
        Se borrarán para siempre tu cuenta, tus ejercicios, rutinas, sesiones y grupos, y los
        fallos que hayas reportado. También se cerrará la sesión en todos tus dispositivos.
        <strong> No se puede deshacer.</strong>
      </p>

      <form className={styles.panelFormulario} onSubmit={confirmar} noValidate>
        <Input
          id="eliminar-password"
          type="password"
          label="Escribe tu contraseña para confirmar"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error}
          autoFocus
        />
        <GrupoBotones>
          <Button type="button" variant="outline" onClick={cancelar} disabled={borrando}>
            Cancelar
          </Button>
          <Button type="submit" variant="danger" disabled={borrando}>
            {borrando ? 'Eliminando…' : 'Eliminar definitivamente'}
          </Button>
        </GrupoBotones>
      </form>
    </section>
  );
}
