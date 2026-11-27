import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSession, deleteSession } from '@/api/sessions.js';
import BotonIcono from '@/components/BotonIcono/BotonIcono.jsx';
import DeleteButton from '@/components/DeleteButton/DeleteButton.jsx';
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog.jsx';
import MarcaPR from '@/components/MarcaPR/MarcaPR.jsx';
import Miniatura from '@/components/Miniatura/Miniatura.jsx';
import { elegirPictograma } from '@compartido/trazosPictograma.js';
// formatDuracion es la de utils/formato.js: aquí había una copia sin el arreglo del 7b, y las
// sesiones de Strong sin duración salían como "NaNh NaN min".
import { formatKg, formatDuracion } from '@/utils/formato.js';
import { useAuth } from '@/hooks/useAuth.js';
import { seMuestra, valorEsfuerzo } from '@/utils/esfuerzo.js';
import styles from '@/pages/SessionDetail/SessionDetail.module.css';

// Formatea fecha + hora: "sábado, 16 de mayo de 2026 · 18:34".
// Se mantiene en minúsculas para coherencia con el resto de textos de fecha
// de la app, en línea con el uso natural del español.
const formatFecha = (fecha) => {
  const d = new Date(fecha);
  const fechaStr = d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const horaStr = d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${fechaStr} · ${horaStr}`;
};

// Detalle de una sesión pasada. Solo lectura.
// Los datos vienen del backend con snapshots (nombreSnapshot del ejercicio),
// así que aunque el ejercicio original haya sido renombrado o borrado,
// el detalle sigue mostrando lo que hiciste ese día.
export default function SessionDetail() {
  // Esfuerzo por serie (bloque 5c): con "no mostrar" en Perfil no sale, aunque haya datos.
  const { user } = useAuth();
  const modoEsfuerzo = user?.preferencias?.esfuerzo ?? 'no';
  const navigate = useNavigate();
  const { id } = useParams();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const response = await getSession(id);
        setSession(response.data.session);
      } catch (err) {
        const message = err.response?.data?.message || 'No se pudo cargar la sesión.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id]);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteSession(id);
      navigate('/history');
    } catch (err) {
      const message = err.response?.data?.message || 'Error al eliminar la sesión.';
      setError(message);
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <p className={styles.feedback}>Cargando...</p>;
  if (error) return <p className={styles.feedbackError}>{error}</p>;
  if (!session) return null;

  const pesoTotal = session.ejercicios.reduce((total, ej) => {
    return total + ej.sets.reduce((sub, set) => sub + (set.peso || 0) * (set.reps || 0), 0);
  }, 0);

  const totalSets = session.ejercicios.reduce((n, ej) => n + ej.sets.length, 0);

  return (
    <div className={styles.page}>
      {/* Header: título + fecha a la izquierda, botón atrás a la derecha.
          Se invierte respecto al patrón habitual porque el foco principal
          en esta vista es el nombre de la sesión, no la navegación. */}
      {/* Header: botón atrás delante, título y fecha a la derecha del botón.
          Es un patrón más convencional para pantallas de detalle: la
          navegación queda pegada al inicio de la línea de lectura. */}
      <header className={styles.header}>
        <BotonIcono icono="atras" etiqueta="Volver al historial" onClick={() => navigate('/history')} />
        <div className={styles.headerText}>
          <h1 className={styles.title}>{session.nombre}</h1>
          <p className={styles.subtitle}>{formatFecha(session.fecha)}</p>
        </div>
      </header>

      <div className={styles.statsRow}>
        <div className={`${styles.statBox} glassCard`}>
          <span className={styles.statLabel}>Duración</span>
          <span className={styles.statValue}>{formatDuracion(session.duracionSegundos)}</span>
        </div>
        <div className={`${styles.statBox} glassCard`}>
          <span className={styles.statLabel}>Peso total</span>
          <span className={styles.statValue}>
            {pesoTotal.toLocaleString('es-ES')}
            <span className={styles.statUnidad}>kg</span>
          </span>
        </div>
        <div className={`${styles.statBox} glassCard`}>
          <span className={styles.statLabel}>Series</span>
          <span className={styles.statValue}>{totalSets}</span>
        </div>
      </div>

      {/* Notas del entreno (bloque 11d), si las hay: entre el resumen y los ejercicios. */}
      {session.notas && (
        <section className={`${styles.notas} glassCard`} aria-labelledby="notas-titulo">
          <h2 id="notas-titulo" className={styles.statLabel}>
            Notas
          </h2>
          <p className={styles.notasTexto}>{session.notas}</p>
        </section>
      )}

      <div className={styles.exercisesList}>
        {session.ejercicios.map((ej) => (
          <div key={ej._id} className={`${styles.exerciseCard} glassCard`}>
            {/* Récord (bloque 4b): la marca junto al nombre y el 1RM estimado que batió la
                marca anterior. Lo decide el servidor al guardar (esPR, prAnterior). */}
            <div className={styles.exerciseHeader}>
              {/* Miniatura (bloque 10), a 32 y solo imagen: la del snapshot, para que no cambie si
                  luego se edita o se borra el ejercicio. Las sesiones anteriores al bloque 10 no
                  tienen esos datos y muestran la Miniatura vacía. */}
              <Miniatura id={elegirPictograma({ presetId: ej.presetIdSnapshot, grupoMuscular: ej.grupoMuscularSnapshot })} tam={32} />
              <h2 className={styles.exerciseName}>{ej.nombreSnapshot}</h2>
              {ej.esPR && <MarcaPR />}
            </div>
            {ej.esPR && (
              <p className={styles.record}>
                Nuevo récord · 1RM estimado{' '}
                <span className={styles.recordCifra}>
                  {formatKg(ej.prAnterior)} → {formatKg(ej.mejor1RM)} kg
                </span>
              </p>
            )}

            <TablaSeries sets={ej.sets} modoEsfuerzo={modoEsfuerzo} />
          </div>
        ))}
      </div>

      {/* Acción destructiva discreta al final, alineada a la derecha.
          Usa el DeleteButton estándar de la app en lugar del antiguo botón
          rojo grande, mucho más agresivo visualmente. */}
      <div className={styles.deleteWrapper}>
        <DeleteButton onClick={() => setConfirmOpen(true)} disabled={deleting}>
          Eliminar sesión
        </DeleteButton>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Eliminar esta sesión?"
        message={`"${session.nombre}" del ${formatFecha(session.fecha)} se eliminará permanentemente.`}
        confirmLabel={deleting ? 'Eliminando...' : 'Eliminar'}
        cancelLabel="Cancelar"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

// Tabla de las series de un ejercicio. Con una columna más para el esfuerzo (bloque 5c) solo si
// alguna serie lo tiene y la preferencia no es "no mostrar"; "—" en las que no lo tienen.
// Props: sets (las del ejercicio), modoEsfuerzo ('no' | 'rpe' | 'rir').
function TablaSeries({ sets, modoEsfuerzo }) {
  const conEsfuerzo = seMuestra(modoEsfuerzo) && sets.some((s) => s.rpe != null);
  const fila = conEsfuerzo ? styles.conEsfuerzo : '';
  return (
    <div className={styles.setsTable}>
      <div className={`${styles.setsHeader} ${fila}`}>
        <span>Serie</span>
        <span>Peso (kg)</span>
        <span>Reps</span>
        {conEsfuerzo && <span>{modoEsfuerzo.toUpperCase()}</span>}
      </div>
      {sets.map((set) => (
        <div key={set._id} className={`${styles.setsRow} ${fila}`}>
          <span className={styles.setNum}>{set.numeroSerie}</span>
          <span className={styles.setValue}>{set.peso}</span>
          <span className={styles.setValue}>{set.reps}</span>
          {conEsfuerzo &&
            (set.rpe != null ? (
              <span className={styles.setValue}>{valorEsfuerzo(set.rpe, modoEsfuerzo)}</span>
            ) : (
              <span className={styles.sinEsfuerzo} aria-label="Sin esfuerzo">
                —
              </span>
            ))}
        </div>
      ))}
    </div>
  );
}
