import { useAuth } from '@/hooks/useAuth.js';
import DeleteButton from '@/components/DeleteButton/DeleteButton.jsx';
import styles from '@/pages/Profile/Profile.module.css';

const formatFecha = (fecha) => {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const GENERO_LABEL = {
  masculino: 'Masculino',
  femenino: 'Femenino',
  otro: 'Otro',
};

const generarHandle = (email) => {
  if (!email) return '';
  const parte = email.split('@')[0];
  return `@${parte}`;
};

const generarIniciales = (nombreCompleto) => {
  if (!nombreCompleto) return '?';
  const palabras = nombreCompleto.trim().split(/\s+/);
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
};

// Icono ⋯ (three-dots horizontal) para el botón de editar del card.
const IconMore = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

// Pantalla de perfil del usuario. Solo lectura en MVP.
// La edición de datos se dejará para el pulido de la Semana 5.
export default function Profile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className={styles.page}>
      {/* Bloque de identidad: avatar + nombre + handle. Va arriba del todo,
          fuera del card de datos personales, para dar protagonismo visual. */}
      <section className={styles.identityBlock}>
        <div className={styles.avatar}>
          {generarIniciales(user.nombreCompleto)}
        </div>
        <h1 className={styles.name}>{user.nombreCompleto}</h1>
        <p className={styles.handle}>{generarHandle(user.email)}</p>
      </section>

      {/* Card de datos personales. Cabecera con título a la izquierda y
          botón "⋯" a la derecha como acceso a la edición. */}
      <section className={`${styles.detailsSection} glassCard`}>
        <div className={styles.detailsHeader}>
          <h2 className={styles.detailsTitle}>Datos personales</h2>
          <button
            type="button"
            className={styles.moreButton}
            disabled
            title="Editar (próximamente)"
            aria-label="Editar datos personales"
          >
            <IconMore />
          </button>
        </div>

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

        {/* Botón "Cerrar sesión" dentro del card, discreto y alineado a la
            derecha con el estilo DeleteButton estándar. */}
        <div className={styles.logoutWrapper}>
          <DeleteButton onClick={logout}>Cerrar sesión</DeleteButton>
        </div>
      </section>
    </div>
  );
}