import { useAuth } from '../../hooks/useAuth.js';
import Button from '../../components/Button/Button.jsx';
import styles from './Profile.module.css';

// Formatea una fecha ISO a formato legible español: "16 de mayo de 1993".
// Se aplica solo si la fecha existe (el campo fechaNacimiento es obligatorio,
// pero por si acaso hacemos defensive coding).
const formatFecha = (fecha) => {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Etiqueta legible para cada valor de género almacenado.
const GENERO_LABEL = {
  masculino: 'Masculino',
  femenino: 'Femenino',
  otro: 'Otro',
};

// Genera el "@handle" a partir del email: parte antes del @.
// Es un guiño de estilo tipo redes sociales, cuadra con el wireframe.
const generarHandle = (email) => {
  if (!email) return '';
  const parte = email.split('@')[0];
  return `@${parte}`;
};

// Iniciales del nombre para el avatar placeholder.
const generarIniciales = (nombreCompleto) => {
  if (!nombreCompleto) return '?';
  const palabras = nombreCompleto.trim().split(/\s+/);
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
};

// Pantalla de perfil del usuario. Solo lectura en MVP.
// La edición de datos se dejará para el pulido de la Semana 5.
export default function Profile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Perfil</h1>
      </header>

      {/* Bloque de identidad: avatar + nombre + handle. */}
      <section className={styles.identityBlock}>
        <div className={styles.avatar}>
          {generarIniciales(user.nombreCompleto)}
        </div>
        <h2 className={styles.name}>{user.nombreCompleto}</h2>
        <p className={styles.handle}>{generarHandle(user.email)}</p>
      </section>

      {/* Datos personales: lista de pares clave-valor. */}
      <section className={styles.detailsSection}>
        <h3 className={styles.detailsTitle}>Datos personales</h3>
        <dl className={styles.detailsList}>
          <div className={styles.detailRow}>
            <dt className={styles.detailKey}>Email</dt>
            <dd className={styles.detailValue}>{user.email}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt className={styles.detailKey}>Fecha de nacimiento</dt>
            <dd className={styles.detailValue}>{formatFecha(user.fechaNacimiento)}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt className={styles.detailKey}>Género</dt>
            <dd className={styles.detailValue}>
              {user.genero ? GENERO_LABEL[user.genero] : '—'}
            </dd>
          </div>
          <div className={styles.detailRow}>
            <dt className={styles.detailKey}>Peso</dt>
            <dd className={styles.detailValue}>
              {user.peso ? `${user.peso} kg` : '—'}
            </dd>
          </div>
          <div className={styles.detailRow}>
            <dt className={styles.detailKey}>Altura</dt>
            <dd className={styles.detailValue}>
              {user.altura ? `${user.altura} cm` : '—'}
            </dd>
          </div>
        </dl>
      </section>

      {/* Botón de edición como placeholder para pulido. */}
      <Button variant="outline" fullWidth disabled title="Próximamente">
        Editar datos
      </Button>

      <Button variant="danger" fullWidth onClick={logout}>
        Cerrar sesión
      </Button>
    </div>
  );
}