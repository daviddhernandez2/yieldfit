import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useActiveSession } from '@/hooks/useActiveSession.js';
import { hayBotonReemplazar, hayMiniSession } from '@/utils/barrasInferiores.js';
import FormularioReporte from '@/components/ReportarFallo/FormularioReporte.jsx';
import styles from '@/components/ReportarFallo/ReportarFallo.module.css';

// Icono de bichito (trazo, como los del menú). currentColor para heredar el color del botón.
const IconoBicho = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="8" y="6" width="8" height="14" rx="4" />
    <path d="M9 7.5 7 5M15 7.5 17 5" />
    <path d="M8 11H4M20 11h-4M8 16H4.5M19.5 16H16" />
    <path d="M12 12v8" />
  </svg>
);

// Botón para reportar un fallo (bloque 11b, paso 11b.2), en todas las pantallas con sesión.
// Dos sitios, según `ubicacion`:
//   - "flotante" (en Layout): solo en el móvil. Círculo abajo a la derecha, por encima de las
//     barras (opción C): justo encima de la barra de menú, y sube cuando aparece la MiniSession
//     o el botón "Reemplazar". Sus alturas, en variables.css (--reportar-*).
//   - "barraLateral" (en Sidebar): solo en escritorio, debajo del menú (bloque 9d: la píldora
//     flotante de la esquina tapaba la última tarjeta al bajar del todo).
// La pantalla (ruta) se toma al abrir el formulario: es donde estaba el usuario al pulsar.
export default function ReportarFallo({ ubicacion = 'flotante' }) {
  const [abierto, setAbierto] = useState(false);
  const { pathname } = useLocation();
  const session = useActiveSession();
  const elevado = hayMiniSession(session, pathname) || hayBotonReemplazar(pathname);

  const clase =
    ubicacion === 'barraLateral' ? styles.enBarraLateral : `${styles.boton} ${elevado ? styles.elevado : ''}`;

  return (
    <>
      <button
        type="button"
        className={clase}
        onClick={() => setAbierto(true)}
        aria-label="Reportar un fallo"
        aria-haspopup="dialog"
      >
        <IconoBicho />
        {ubicacion === 'barraLateral' && (
          <span className={styles.texto} aria-hidden="true">
            Reportar un fallo
          </span>
        )}
      </button>
      {abierto && <FormularioReporte ruta={pathname} onCerrar={() => setAbierto(false)} />}
    </>
  );
}
