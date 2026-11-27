import Icono from '@/components/Icono/Icono.jsx';
import styles from '@/components/BotonIcono/BotonIcono.module.css';

// Los trazos están en Icono (iconos propios del design system).

// Botón de solo icono para volver, avanzar, abrir, cerrar y editar (bloque 9c, DECISIONS 0048).
// Dos variantes:
//   - "circulo" (por defecto): navegar entre pantallas o periodos (volver en las cabeceras,
//     flechas del calendario). Círculo de 40 px con fondo de tarjeta y borde fino.
//   - "sinFondo": acciones dentro de una tarjeta (plegar un grupo, cerrar un panel). Solo el
//     icono; al pasar el ratón o pulsar aparece un círculo suave. Menos volumen.
// En los dos, la zona que se puede pulsar mide 48 px aunque se vea más pequeño (el design
// system pide 48 px para todo control táctil).
//
// etiqueta: el nombre accesible ("Volver al historial"). Obligatoria: sin texto visible, es lo
// único que un lector de pantalla puede leer.
export default function BotonIcono({ icono, etiqueta, variante = 'circulo', className = '', ...rest }) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      className={`${styles.boton} ${styles[variante]} ${className}`}
      {...rest}
    >
      <Icono nombre={icono} />
    </button>
  );
}
