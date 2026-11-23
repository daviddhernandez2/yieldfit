import { useEffect, useState } from 'react';
import Button from '@/components/Button/Button.jsx';
import GrupoBotones from '@/components/GrupoBotones/GrupoBotones.jsx';
import { crearReporte } from '@/api/reports.js';
import styles from '@/components/ReportarFallo/ReportarFallo.module.css';

// Mismos máximos que el modelo BugReport del servidor: así el usuario no puede escribir
// algo que luego se rechace por largo.
const MAX_DESCRIPCION = 2000;
const MAX_CONTEXTO = 1000;

// Hoja (móvil) o panel (escritorio) con el formulario de reporte.
// Debajo de los campos se enseña, tal cual, lo que se envía solo: el usuario sabe
// exactamente qué datos manda.
export default function FormularioReporte({ ruta, onCerrar }) {
  const [descripcion, setDescripcion] = useState('');
  const [contexto, setContexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  // Se capturan una vez, al abrir: lo que veía el usuario cuando pulsó el botón.
  const [pantalla] = useState(() => ({ ancho: window.innerWidth, alto: window.innerHeight }));
  const navegador = navigator.userAgent;

  // Escape cierra, salvo mientras se envía (si no, no sabrías si llegó).
  useEffect(() => {
    const alPulsar = (e) => {
      if (e.key === 'Escape' && !enviando) onCerrar();
    };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [enviando, onCerrar]);

  const enviar = async (e) => {
    e.preventDefault();
    if (!descripcion.trim()) {
      setError('Cuenta qué ha fallado.');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      await crearReporte({ descripcion, contexto, ruta, pantalla });
      setEnviado(true);
    } catch (err) {
      // El servidor ya da un mensaje para el usuario (429 con los minutos, 400 con el campo).
      setError(err.response?.data?.message ?? 'No se ha podido enviar. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const cerrarDesdeFondo = () => {
    if (!enviando) onCerrar();
  };

  return (
    <div className={styles.fondo} onClick={cerrarDesdeFondo}>
      <div
        className={styles.hoja}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reporte-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="reporte-titulo" className={styles.titulo}>
          Reportar un fallo
        </h2>

        {enviado ? (
          <>
            <p className={styles.gracias} role="status">
              Gracias, lo he recibido. Lo revisaré lo antes posible.
            </p>
            <Button type="button" onClick={onCerrar} fullWidth>
              Cerrar
            </Button>
          </>
        ) : (
          <form className={styles.formulario} onSubmit={enviar} noValidate>
            <label className={styles.campo}>
              <span className={styles.etiqueta}>¿Qué ha fallado?</span>
              <textarea
                className={styles.areaTexto}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                maxLength={MAX_DESCRIPCION}
                rows={4}
                required
                autoFocus
              />
            </label>

            <label className={styles.campo}>
              <span className={styles.etiqueta}>
                ¿Qué estabas haciendo? <span className={styles.opcional}>(opcional)</span>
              </span>
              <textarea
                className={styles.areaTexto}
                value={contexto}
                onChange={(e) => setContexto(e.target.value)}
                maxLength={MAX_CONTEXTO}
                rows={2}
              />
            </label>

            <div className={styles.datos}>
              <p className={styles.datosTitulo}>Se envía también</p>
              <dl className={styles.datosLista}>
                <dt>Pantalla</dt>
                <dd>{ruta}</dd>
                <dt>Tamaño</dt>
                <dd>
                  {pantalla.ancho} × {pantalla.alto}
                </dd>
                <dt>Navegador y sistema</dt>
                <dd className={styles.navegador}>{navegador}</dd>
              </dl>
            </div>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <GrupoBotones>
              <Button type="button" variant="outline" onClick={onCerrar} disabled={enviando}>
                Cancelar
              </Button>
              <Button type="submit" disabled={enviando}>
                {enviando ? 'Enviando…' : 'Enviar'}
              </Button>
            </GrupoBotones>
          </form>
        )}
      </div>
    </div>
  );
}
