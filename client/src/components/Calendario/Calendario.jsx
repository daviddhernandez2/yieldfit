import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTrainedDays } from "@/api/sessions.js";
import Chip from "@/components/Chip/Chip.jsx";
import { contar } from "@/utils/activeSession.js";
import {
  claveDia,
  inicioDeMeses,
  moverMes,
  nivelDeDia,
  nombreDelMes,
  rangoDelAnio,
  rejillaDelAnio,
  rejillaDelMes,
} from "@/utils/calendario.js";
import styles from "@/components/Calendario/Calendario.module.css";
import BotonIcono from "@/components/BotonIcono/BotonIcono.jsx";

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const IconChevron = ({ direccion }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {direccion === "izquierda" && <polyline points="15 18 9 12 15 6" />}
    {direccion === "derecha" && <polyline points="9 18 15 12 9 6" />}
  </svg>
);

// Calendario de días entrenados (bloque 8, DECISIONS.md 0033), arriba del Historial.
// Dos vistas: mes (rejilla de lunes a domingo) y año (mapa tipo GitHub, una columna por
// semana). Las dos leen del mismo dato: los días de un año natural, pedidos una vez por año
// (GET /api/sessions/days). Tocar un día entrenado: con una sesión, abre su detalle; con
// varias, las lista debajo.
export default function Calendario() {
  const navigate = useNavigate();
  const hoy = new Date();
  const claveHoy = claveDia(hoy);

  const [vista, setVista] = useState("mes"); // "mes" | "anio"
  const [mes, setMes] = useState({ anio: hoy.getFullYear(), mes: hoy.getMonth() });
  // Días ya pedidos, por año: { 2026: { "2026-10-02": [{ _id, nombre }] } }.
  const [porAnio, setPorAnio] = useState({});
  const [error, setError] = useState("");
  const [diaAbierto, setDiaAbierto] = useState(null);
  const mapaAnualRef = useRef(null);

  const dias = porAnio[mes.anio];

  useEffect(() => {
    if (porAnio[mes.anio]) return; // ese año ya está pedido
    let montado = true;
    setError("");
    getTrainedDays(rangoDelAnio(mes.anio))
      .then((res) => {
        if (!montado) return;
        const mapa = Object.fromEntries(res.data.dias.map((d) => [d.dia, d.sesiones]));
        setPorAnio((actual) => ({ ...actual, [mes.anio]: mapa }));
      })
      .catch(() => montado && setError("No se han podido cargar los días entrenados."));
    return () => {
      montado = false;
    };
    // porAnio no va en las dependencias: solo importa cuando cambia el año.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes.anio]);

  // En la vista anual, el mapa no cabe entero en un móvil: se desplaza hasta el final para
  // que lo primero que se vea sea lo más reciente (como GitHub en el móvil).
  useEffect(() => {
    if (vista === "anio" && dias && mapaAnualRef.current) {
      mapaAnualRef.current.scrollLeft = mapaAnualRef.current.scrollWidth;
    }
  }, [vista, dias]);

  // Sesiones del periodo que se ve (mes o año), para la cabecera.
  const prefijo = vista === "mes" ? `${mes.anio}-${String(mes.mes + 1).padStart(2, "0")}` : `${mes.anio}`;
  const totalSesiones = dias
    ? Object.entries(dias)
        .filter(([dia]) => dia.startsWith(prefijo))
        .reduce((n, [, sesiones]) => n + sesiones.length, 0)
    : null;

  const enElPresente =
    vista === "mes" ? mes.anio === hoy.getFullYear() && mes.mes === hoy.getMonth() : mes.anio === hoy.getFullYear();

  const mover = (paso) => {
    setMes((actual) => (vista === "mes" ? moverMes(actual, paso) : { ...actual, anio: actual.anio + paso }));
    setDiaAbierto(null);
  };

  const cambiarVista = (nueva) => {
    setVista(nueva);
    setDiaAbierto(null);
  };

  const tocarDia = (dia) => {
    const sesiones = dias[dia];
    if (sesiones.length === 1) navigate(`/history/${sesiones[0]._id}`);
    else setDiaAbierto((actual) => (actual === dia ? null : dia));
  };

  // Una celda de día, en cualquiera de las dos vistas. Los días entrenados son botones.
  const celdaDia = (celda, claseBase, conNumero) => {
    const sesiones = dias?.[celda.dia];
    const nivel = nivelDeDia(sesiones?.length ?? 0);
    const clases = [
      claseBase,
      nivel === 1 && styles.nivel1,
      nivel === 2 && styles.nivel2,
      celda.dia === claveHoy && styles.diaHoy,
      celda.dia === diaAbierto && styles.diaAbierto,
    ]
      .filter(Boolean)
      .join(" ");
    // En la vista de mes el número va dentro de un círculo de tamaño fijo: la celda ocupa
    // el ancho de su columna, pero lo verde no crece con ella.
    const contenido = conNumero ? <span className={styles.circulo}>{celda.numero}</span> : null;
    return sesiones ? (
      <button
        key={celda.dia}
        type="button"
        className={clases}
        onClick={() => tocarDia(celda.dia)}
        aria-label={`${celda.dia}: ${sesiones.map((s) => s.nombre).join(", ")}`}
        title={`${celda.dia} · ${sesiones.map((s) => s.nombre).join(", ")}`}
      >
        {contenido}
      </button>
    ) : (
      <span key={celda.dia} className={clases} title={conNumero ? undefined : celda.dia}>
        {contenido}
      </span>
    );
  };

  // Las dos vistas se pintan siempre, una encima de otra en el mismo hueco, y se oculta la
  // que no toca: así la tarjeta mide siempre lo que la más alta y no "salta" al cambiar de
  // vista. Por lo mismo, el mes tiene siempre 6 filas (aunque algunos meses ocupen 5).
  const semanasDelMes = rejillaDelMes(mes.anio, mes.mes);
  while (semanasDelMes.length < 6) semanasDelMes.push(Array(7).fill(null));
  const semanasDelAnio = rejillaDelAnio(mes.anio);

  return (
    <section className={`${styles.calendario} glassCard`}>
      {/* Cabecera como la de las tarjetas del Dashboard: título y dato a la izquierda,
          controles a la derecha. */}
      <div className={styles.cabecera}>
        <div>
          <h2 className={styles.titulo}>Días entrenados</h2>
          <p className={styles.resumen}>
            {totalSesiones === null ? "…" : contar(totalSesiones, "sesión", "sesiones")}
          </p>
        </div>
        <div className={styles.selector} role="group" aria-label="Vista del calendario">
          <Chip label="Mes" selected={vista === "mes"} onClick={() => cambiarVista("mes")} />
          <Chip label="Año" selected={vista === "anio"} onClick={() => cambiarVista("anio")} />
        </div>
      </div>

      {/* ‹ periodo ›: las flechas quedan en los bordes de la rejilla que hay debajo. */}
      <div className={`${styles.navegacion} ${vista === "mes" ? styles.anchoMes : ""}`}>
        <BotonIcono
          icono="atras"
          etiqueta={vista === "mes" ? "Mes anterior" : "Año anterior"}
          onClick={() => mover(-1)}
        />
        <span className={styles.periodo}>{vista === "mes" ? nombreDelMes(mes.anio, mes.mes) : mes.anio}</span>
        <BotonIcono
          icono="adelante"
          etiqueta={vista === "mes" ? "Mes siguiente" : "Año siguiente"}
          onClick={() => mover(1)}
          disabled={enElPresente}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.vistas}>
        {/* inert: la vista oculta no se puede tocar ni recibe el foco del teclado. */}
        <div className={`${styles.vista} ${vista === "mes" ? "" : styles.oculta}`} inert={vista !== "mes"}>
          <div className={`${styles.rejillaMes} ${styles.anchoMes}`}>
            {DIAS_SEMANA.map((d) => (
              <span key={d} className={styles.diaSemana} aria-hidden="true">
                {d}
              </span>
            ))}
            {semanasDelMes
              .flat()
              // Los huecos son cuadrados como los días: una fila entera de huecos (los meses
              // de 5 semanas, rellenados a 6) mide lo mismo que una de días.
              .map((celda, i) => (celda ? celdaDia(celda, styles.dia, true) : <span key={`hueco-${i}`} className={styles.huecoMes} />))}
          </div>
        </div>

        <div className={`${styles.vista} ${styles.vistaAnio} ${vista === "anio" ? "" : styles.oculta}`} inert={vista !== "anio"}>
          <div className={styles.mapaAnual} ref={mapaAnualRef}>
            {/* Nombres de los meses encima de la columna en la que empieza cada uno. */}
            <div className={styles.meses} style={{ "--columnas": semanasDelAnio.length }}>
              {inicioDeMeses(semanasDelAnio).map(({ mes: m, columna }) => (
                <span key={m} style={{ gridColumn: columna + 1 }}>
                  {MESES_CORTOS[m]}
                </span>
              ))}
            </div>
            <div className={styles.semanas}>
              {semanasDelAnio.map((semana, s) => (
                <div key={s} className={styles.semana}>
                  {semana.map((celda, d) =>
                    celda ? celdaDia(celda, styles.cuadro, false) : <span key={`hueco-${s}-${d}`} className={styles.huecoCuadro} />,
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className={styles.leyenda} aria-hidden="true">
            <span>Menos</span>
            <span className={styles.cuadro} />
            <span className={`${styles.cuadro} ${styles.nivel1}`} />
            <span className={`${styles.cuadro} ${styles.nivel2}`} />
            <span>Más</span>
          </div>
        </div>

        {/* Día con varias sesiones: la lista aparece encima del calendario, no debajo, para
            que la tarjeta no cambie de tamaño. */}
        {diaAbierto && dias?.[diaAbierto] && (
          <div className={`${styles.capaDia} glassCard`}>
            <div className={styles.capaDiaCabecera}>
              <span>{diaAbierto.split("-").reverse().join("/")}</span>
              <BotonIcono variante="sinFondo" icono="cerrar" etiqueta="Cerrar" onClick={() => setDiaAbierto(null)} />
            </div>
            <ul className={styles.listaDia}>
              {dias[diaAbierto].map((s) => (
                <li key={s._id}>
                  <button type="button" className={styles.sesionDia} onClick={() => navigate(`/history/${s._id}`)}>
                    {s.nombre}
                    <IconChevron direccion="derecha" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
