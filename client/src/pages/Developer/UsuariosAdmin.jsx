import Esqueleto, { ZonaCarga } from '@/components/Esqueleto/Esqueleto.jsx';
import styles from '@/pages/Developer/Developer.module.css';

const formatFecha = (fecha) =>
  fecha
    ? new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Nunca';

// Lista de usuarios de /developer: nombre, email, registro, último acceso y actividad.
// Sin fecha de nacimiento, peso, altura ni género: el servidor ni los lee.
// El último acceso existe desde el bloque 11b: quien no ha entrado desde entonces sale
// como "Nunca".
export default function UsuariosAdmin({ users, total, cargando, error }) {
  if (cargando) {
    return (
      <ZonaCarga etiqueta="Cargando los usuarios" className={styles.lista}>
        {[50, 42, 58].map((ancho) => (
          <div key={ancho} className={`${styles.tarjeta} glassCard`}>
            <Esqueleto ancho={`${ancho}%`} alto="1rem" />
            <Esqueleto ancho="70%" alto="0.75rem" />
          </div>
        ))}
      </ZonaCarga>
    );
  }

  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <section className={styles.seccion} aria-label="Usuarios">
      <p className={styles.resumen}>
        {total === 1 ? '1 usuario' : `${total} usuarios`}
        {users.length < total && ` · se muestran los ${users.length} más recientes`}
      </p>

      <ul className={styles.lista}>
        {users.map((u) => (
          <li key={u._id} className={`${styles.tarjeta} glassCard`}>
            <div className={styles.tarjetaCabecera}>
              <span className={styles.nombre}>{u.nombreCompleto}</span>
              {u.rol === 'admin' && <span className={styles.estado}>Admin</span>}
            </div>
            <span className={styles.meta}>{u.email}</span>

            <dl className={styles.datosTecnicos}>
              <dt>Registro</dt>
              <dd>{formatFecha(u.createdAt)}</dd>
              <dt>Último acceso</dt>
              <dd>{formatFecha(u.ultimoAcceso)}</dd>
            </dl>

            <div className={styles.contadores}>
              <span><strong>{u.sesiones}</strong> sesiones</span>
              <span><strong>{u.ejercicios}</strong> ejercicios</span>
              <span><strong>{u.rutinas}</strong> rutinas</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
