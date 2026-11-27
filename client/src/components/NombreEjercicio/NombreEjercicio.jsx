import { etiquetaDe } from '@/hooks/useOpcionesEjercicio.js';
import styles from '@/components/NombreEjercicio/NombreEjercicio.module.css';

// Nombre de un ejercicio con su grupo y su tipo debajo, en gris: "Pecho · Máquinas"
// (bloque 9b, DECISIONS.md 0036). Sirve para distinguir ejercicios que se llaman igual,
// como "Press en máquina" de pecho y de hombros.
//
// - opciones: las del servidor, para mostrar los textos con tilde ("Máquinas"). Si aún no
//   han llegado (p. ej. la sesión activa sin cobertura), se muestra el valor guardado.
// - mostrarTipo: false donde el tipo ya está en otra columna (lista de Ejercicios).
// - claseTipo: clase para la parte " · Tipo", para que una página la muestre solo a algunos
//   anchos (lista de Ejercicios, bloque 10: en el móvil el tipo va aquí y no en su columna).
// - Sin grupo (sesiones activas empezadas antes de esto), solo se ve el nombre.
export default function NombreEjercicio({ nombre, grupoMuscular, tipo, opciones, mostrarTipo = true, claseTipo, className = '' }) {
  const texto = (lista, valor) => (opciones ? etiquetaDe(lista(opciones), valor) : valor);
  const grupo = grupoMuscular && texto((o) => o.gruposMusculares, grupoMuscular);
  // Si el tipo dice lo mismo que el grupo ("Cardio · Cardio"), se muestra una sola vez.
  const tipoTexto = mostrarTipo && tipo && texto((o) => o.tipos, tipo);
  const parteTipoRepetida = tipoTexto && tipoTexto === grupo;
  // El separador va con el tipo: si el tipo se oculta, no queda un " · " colgando.
  const parteTipo = tipoTexto && !parteTipoRepetida && (grupo ? ` · ${tipoTexto}` : tipoTexto);
  const detalle = (grupo || parteTipo) && (
    <>
      {grupo}
      {parteTipo && (claseTipo ? <span className={claseTipo}>{parteTipo}</span> : parteTipo)}
    </>
  );

  return (
    <span className={`${styles.nombreEjercicio} ${className}`}>
      <span className={styles.nombre}>{nombre}</span>
      {detalle && <span className={styles.detalle}>{detalle}</span>}
    </span>
  );
}
