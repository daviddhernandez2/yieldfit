import { formatDuracion, formatHora } from "@/utils/formato.js";
import { contar } from "@/utils/activeSession.js";
import styles from "@/components/Calendario/Calendario.module.css";

// Flecha de variación de trazo (design system: ↗ sube, ↘ baja; nunca solo color).
const Flecha = ({ sube }) => (
  <svg className={styles.flecha} viewBox="0 0 12 12" aria-hidden="true">
    <path d={sube ? "M3 9 9 3M4.5 3H9v4.5" : "M3 3l6 6M9 4.5V9H4.5"} />
  </svg>
);

// Diferencia con el mes anterior: "↗ +2", "↘ −1h 5 min" o "=" si es igual. formato da el
// texto del valor absoluto de la diferencia.
const Variacion = ({ actual, anterior, formato = String }) => {
  if (anterior === undefined) return <span className={styles.variacion}>…</span>;
  const diferencia = actual - anterior;
  if (diferencia === 0) return <span className={`${styles.variacion} ${styles.igual}`}>= igual</span>;
  const sube = diferencia > 0;
  return (
    <span className={`${styles.variacion} ${sube ? styles.sube : styles.baja}`}>
      <Flecha sube={sube} />
      {sube ? "+" : "−"}
      {formato(Math.abs(diferencia))}
    </span>
  );
};

// Panel lateral del calendario en escritorio (bloque 8b): el día seleccionado, sus sesiones y
// cómo va el mes comparado con el anterior. Solo presenta: los datos y cálculos llegan hechos
// (utils/calendario.js).
//
// Props:
//   - dia: "2026-11-24" (el seleccionado).
//   - sesiones: las de ese día ([{ _id, nombre, fecha, duracionSegundos, numEjercicios }]),
//     o undefined si no hay.
//   - esFuturo: el día aún no ha llegado.
//   - mes: { nombre: "noviembre", actual, anteriorNombre: "octubre", anterior } con los
//     resúmenes de resumenDelMes (anterior undefined mientras carga).
//   - onAbrir(id): abrir el detalle de una sesión.
export default function PanelDia({ dia, sesiones, esFuturo, mes, onAbrir }) {
  const fecha = new Date(`${dia}T00:00:00`);
  // "jueves, noviembre de 2026" (la primera letra se pone en mayúscula por CSS).
  const diaSemana = `${fecha.toLocaleDateString("es-ES", { weekday: "long" })}, ${fecha.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}`;

  return (
    <aside className={styles.panel} aria-label="Día seleccionado">
      <div className={styles.panelFecha}>
        <span className={styles.panelNumero}>{String(fecha.getDate()).padStart(2, "0")}</span>
        <span className={styles.panelDiaSemana}>{diaSemana}</span>
      </div>

      <section className={styles.panelSeccion}>
        <h3 className={styles.panelEtiqueta}>Sesiones</h3>
        {sesiones?.length ? (
          <ul className={styles.panelLista}>
            {sesiones.map((s) => (
              <li key={s._id}>
                <button type="button" className={styles.panelSesion} onClick={() => onAbrir(s._id)}>
                  <span className={styles.panelHora}>{s.fecha ? formatHora(s.fecha) : "—"}</span>
                  <span className={styles.panelTexto}>
                    <span className={styles.panelNombre}>{s.nombre}</span>
                    <span className={styles.panelDato}>
                      {s.duracionSegundos !== undefined && formatDuracion(s.duracionSegundos)}
                      {s.numEjercicios !== undefined && ` · ${contar(s.numEjercicios, "ejercicio", "ejercicios")}`}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.panelVacio}>{esFuturo ? "Todavía no ha llegado." : "Día de descanso."}</p>
        )}
      </section>

      <section className={styles.panelSeccion}>
        <h3 className={styles.panelEtiqueta}>
          {mes.nombre} <span className={styles.panelEtiquetaSuave}>vs. {mes.anteriorNombre}</span>
        </h3>
        {mes.actual ? (
          <dl className={styles.cifrasMes}>
            <div className={styles.cifraMes}>
              <dt>Sesiones</dt>
              <dd>
                <span className={styles.cifraValor}>{mes.actual.sesiones}</span>
                <Variacion actual={mes.actual.sesiones} anterior={mes.anterior?.sesiones} />
              </dd>
            </div>
            <div className={styles.cifraMes}>
              <dt>Días entrenados</dt>
              <dd>
                <span className={styles.cifraValor}>{mes.actual.diasEntrenados}</span>
                <Variacion actual={mes.actual.diasEntrenados} anterior={mes.anterior?.diasEntrenados} />
              </dd>
            </div>
            <div className={styles.cifraMes}>
              <dt>Tiempo total</dt>
              <dd>
                <span className={styles.cifraValor}>{formatDuracion(mes.actual.segundos)}</span>
                <Variacion actual={mes.actual.segundos} anterior={mes.anterior?.segundos} formato={formatDuracion} />
              </dd>
            </div>
          </dl>
        ) : (
          <p className={styles.panelVacio}>…</p>
        )}
      </section>
    </aside>
  );
}
