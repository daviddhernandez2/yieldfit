import { useEffect, useState } from 'react';
import { listReports, updateReportEstado } from '@/api/admin.js';
import { limitesDias } from '@/utils/filtroFechas.js';
import Button from '@/components/Button/Button.jsx';
import Chip from '@/components/Chip/Chip.jsx';
import Esqueleto, { ZonaCarga } from '@/components/Esqueleto/Esqueleto.jsx';
import styles from '@/pages/Developer/Developer.module.css';

const ESTADOS = [
  { valor: 'pendiente', etiqueta: 'Pendientes' },
  { valor: 'resuelto', etiqueta: 'Resueltos' },
  { valor: '', etiqueta: 'Todos' },
];

// Parámetros de la consulta a partir de los filtros. Los vacíos quedan undefined y axios no
// los manda. Función aparte porque la usan la primera página y "Cargar más".
const parametros = ({ estado, usuario, desde, hasta }) => ({
  estado: estado || undefined,
  usuario: usuario || undefined,
  ...limitesDias(desde, hasta),
});

const formatFechaHora = (fecha) =>
  new Date(fecha).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// Bandeja de reportes de /developer. Filtros: estado (por defecto, los pendientes), usuario
// y fechas. Al cambiar un filtro se vuelve a pedir la primera página; "Cargar más" sigue
// con el cursor, como el Historial.
export default function ReportesAdmin({ users }) {
  const [estado, setEstado] = useState('pendiente');
  const [usuario, setUsuario] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const [reports, setReports] = useState([]);
  const [siguienteCursor, setSiguienteCursor] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState('');
  // Error al cargar más o al cambiar un estado: no debe ocultar lo ya cargado.
  const [errorAccion, setErrorAccion] = useState('');
  const [cambiando, setCambiando] = useState(null); // id del reporte que se está cambiando

  useEffect(() => {
    // Si el filtro cambia antes de que llegue la respuesta anterior, esa respuesta ya no
    // vale: se descarta para no mezclar resultados de dos filtros.
    let vigente = true;
    setCargando(true);
    setError('');
    setErrorAccion('');
    listReports(parametros({ estado, usuario, desde, hasta }))
      .then((response) => {
        if (!vigente) return;
        setReports(response.data.reports);
        setSiguienteCursor(response.data.siguienteCursor);
      })
      .catch((err) => {
        if (vigente) setError(err.response?.data?.message || 'No se han podido cargar los reportes.');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [estado, usuario, desde, hasta]);

  const cargarMas = async () => {
    setErrorAccion('');
    setCargandoMas(true);
    try {
      const response = await listReports({
        ...parametros({ estado, usuario, desde, hasta }),
        cursor: siguienteCursor,
      });
      setReports((actuales) => [...actuales, ...response.data.reports]);
      setSiguienteCursor(response.data.siguienteCursor);
    } catch (err) {
      setErrorAccion(err.response?.data?.message || 'No se han podido cargar más reportes.');
    } finally {
      setCargandoMas(false);
    }
  };

  // El reporte se queda en la lista con su estado nuevo, aunque ya no cumpla el filtro: así
  // se ve que el cambio se ha hecho. Al cambiar de filtro o recargar, desaparece.
  const cambiarEstado = async (report) => {
    const nuevo = report.estado === 'pendiente' ? 'resuelto' : 'pendiente';
    setErrorAccion('');
    setCambiando(report._id);
    try {
      const response = await updateReportEstado(report._id, nuevo);
      setReports((actuales) =>
        actuales.map((r) => (r._id === report._id ? response.data.report : r))
      );
    } catch (err) {
      setErrorAccion(err.response?.data?.message || 'No se ha podido cambiar el estado.');
    } finally {
      setCambiando(null);
    }
  };

  const hayFiltrosExtra = usuario || desde || hasta;

  return (
    <section className={styles.seccion} aria-label="Reportes">
      <div className={styles.filtros}>
        <div className={styles.chips}>
          {ESTADOS.map(({ valor, etiqueta }) => (
            <Chip key={etiqueta} label={etiqueta} selected={estado === valor} onClick={() => setEstado(valor)} />
          ))}
        </div>

        <div className={styles.camposFiltro}>
          <label className={styles.campo}>
            <span className={styles.etiqueta}>Usuario</span>
            <select className={styles.control} value={usuario} onChange={(e) => setUsuario(e.target.value)}>
              <option value="">Todos</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.nombreCompleto} · {u.email}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.campo}>
            <span className={styles.etiqueta}>Desde</span>
            <input type="date" className={styles.control} value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} />
          </label>
          <label className={styles.campo}>
            <span className={styles.etiqueta}>Hasta</span>
            <input type="date" className={styles.control} value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} />
          </label>
        </div>

        {hayFiltrosExtra && (
          <button
            type="button"
            className={styles.limpiar}
            onClick={() => {
              setUsuario('');
              setDesde('');
              setHasta('');
            }}
          >
            Quitar filtros de usuario y fechas
          </button>
        )}
      </div>

      {cargando && (
        <ZonaCarga etiqueta="Cargando los reportes" className={styles.lista}>
          {[70, 55, 62].map((ancho) => (
            <div key={ancho} className={`${styles.tarjeta} glassCard`}>
              <Esqueleto ancho="40%" alto="0.75rem" />
              <Esqueleto ancho={`${ancho}%`} alto="1rem" />
              <Esqueleto ancho="30%" alto="0.75rem" />
            </div>
          ))}
        </ZonaCarga>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {!cargando && !error && reports.length === 0 && (
        <p className={styles.vacioTexto}>No hay reportes con estos filtros.</p>
      )}

      {!cargando && !error && reports.length > 0 && (
        <ul className={styles.lista}>
          {reports.map((r) => (
            <li key={r._id} className={`${styles.tarjeta} glassCard`}>
              <div className={styles.tarjetaCabecera}>
                <span className={styles.meta}>
                  {formatFechaHora(r.createdAt)} ·{' '}
                  {r.userId ? `${r.userId.nombreCompleto} (${r.userId.email})` : 'Usuario borrado'}
                </span>
                <span className={`${styles.estado} ${r.estado === 'resuelto' ? styles.resuelto : ''}`}>
                  {r.estado === 'resuelto' ? 'Resuelto' : 'Pendiente'}
                </span>
              </div>

              <p className={styles.descripcion}>{r.descripcion}</p>
              {r.contexto && (
                <p className={styles.contexto}>
                  <span className={styles.etiqueta}>Estaba haciendo:</span> {r.contexto}
                </p>
              )}

              <dl className={styles.datosTecnicos}>
                <dt>Pantalla</dt>
                <dd>{r.ruta || '—'}</dd>
                <dt>Tamaño</dt>
                <dd>{r.pantalla?.ancho ? `${r.pantalla.ancho} × ${r.pantalla.alto}` : '—'}</dd>
                <dt>Navegador</dt>
                <dd className={styles.navegador}>{r.navegador || '—'}</dd>
              </dl>

              <div className={styles.tarjetaAcciones}>
                <Button
                  variant="outline"
                  onClick={() => cambiarEstado(r)}
                  disabled={cambiando === r._id}
                >
                  {r.estado === 'pendiente' ? 'Marcar resuelto' : 'Marcar pendiente'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {errorAccion && <p className={styles.error}>{errorAccion}</p>}

      {!cargando && !error && siguienteCursor && (
        <div className={styles.cargarMas}>
          <Button variant="outline" onClick={cargarMas} disabled={cargandoMas}>
            {cargandoMas ? 'Cargando...' : 'Cargar más'}
          </Button>
        </div>
      )}
    </section>
  );
}
