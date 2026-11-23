import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth.js';
import Button from '@/components/Button/Button.jsx';
import GrupoBotones from '@/components/GrupoBotones/GrupoBotones.jsx';
import Input from '@/components/Input/Input.jsx';
import styles from '@/pages/Profile/Profile.module.css';

const MINIMO = 8; // el mismo mínimo que el modelo User del servidor

// "Cambiar contraseña" en Perfil (bloque 11b, paso 11b.5). También es como se sustituye la
// contraseña temporal que da `npm run restablecer`.
// Pide la actual (si alguien encuentra la sesión abierta, no puede cambiarla) y la nueva dos
// veces (un error de tecleo te dejaría fuera). Al cambiarla, el servidor cierra la sesión en
// los demás dispositivos; este sigue dentro.
export default function CambiarContrasena() {
  const { cambiarContrasena } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [hecho, setHecho] = useState(false);

  const cerrar = () => {
    setAbierto(false);
    setActual('');
    setNueva('');
    setRepetida('');
    setError('');
  };

  const guardar = async (e) => {
    e.preventDefault();
    // Las mismas comprobaciones que el servidor, para avisar sin esperar a la red. El
    // servidor las repite: quien decide es él.
    if (!actual || !nueva) return setError('Escribe la contraseña actual y la nueva.');
    if (nueva.length < MINIMO) return setError(`La contraseña nueva necesita al menos ${MINIMO} caracteres.`);
    if (nueva !== repetida) return setError('Las dos contraseñas nuevas no coinciden.');
    if (nueva === actual) return setError('La contraseña nueva tiene que ser distinta de la actual.');

    setGuardando(true);
    setError('');
    try {
      await cambiarContrasena(actual, nueva);
      cerrar();
      setHecho(true);
    } catch (err) {
      setError(err.response?.data?.message ?? 'No se ha podido cambiar la contraseña. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className={`${styles.contrasenaSeccion} glassCard`} aria-labelledby="contrasena-titulo">
      <div className={styles.contrasenaCabecera}>
        <h2 id="contrasena-titulo" className={styles.detailsTitle}>
          Contraseña
        </h2>
        {!abierto && (
          <button
            type="button"
            className={styles.contrasenaBoton}
            onClick={() => {
              setHecho(false);
              setAbierto(true);
            }}
          >
            Cambiar contraseña
          </button>
        )}
      </div>

      {hecho && (
        <p className={styles.contrasenaOk} role="status">
          Contraseña cambiada. Se ha cerrado la sesión en tus otros dispositivos.
        </p>
      )}

      {abierto && (
        <form className={styles.panelFormulario} onSubmit={guardar} noValidate>
          <Input
            id="contrasena-actual"
            type="password"
            label="Contraseña actual"
            autoComplete="current-password"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            autoFocus
          />
          {/* new-password: el gestor de contraseñas del iPhone ofrece guardar la nueva. */}
          <Input
            id="contrasena-nueva"
            type="password"
            label={`Contraseña nueva (mínimo ${MINIMO} caracteres)`}
            autoComplete="new-password"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
          />
          <Input
            id="contrasena-repetida"
            type="password"
            label="Repite la contraseña nueva"
            autoComplete="new-password"
            value={repetida}
            onChange={(e) => setRepetida(e.target.value)}
          />

          {error && (
            <p className={styles.panelError} role="alert">
              {error}
            </p>
          )}

          <GrupoBotones>
            <Button type="button" variant="outline" onClick={cerrar} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
          </GrupoBotones>
        </form>
      )}
    </section>
  );
}
