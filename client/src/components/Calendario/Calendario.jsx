import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTrainedDays } from "@/api/sessions.js";
import { contar } from "@/utils/activeSession.js";
import { claveDia, moverMes, nombreDelMes, rangoDelMes, rejillaDelMes } from "@/utils/calendario.js";
import styles from "@/components/Calendario/Calendario.module.css";

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

const IconChevron = ({ direccion }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {direccion === "izquierda" && <polyline points="15 18 9 12 15 6" />}
    {direccion === "derecha" && <polyline points="9 18 15 12 9 6" />}
    {direccion === "abajo" && <polyline points="6 9 12 15 18 9" />}
  </svg>
);

// Calendario de días entrenados (bloque 8, DECISIONS.md 0033), arriba del Historial.
// - Plegado al principio, para no empujar la lista: la cabecera ya dice cuántas sesiones
//   hay en el mes.
// - Pide los días de cada mes una vez (GET /api/sessions/days) y los guarda por mes.
// - Tocar un día entrenado: con una sesión, abre su detalle; con varias, las lista debajo.
export default function Calendario() {
  const navigate = useNavigate();
  const hoy = new Date();
  const [mes, setMes] = useState({ anio: hoy.getFullYear(), mes: hoy.getMonth() });
  const [abierto, setAbierto] = useState(false);
  // Días ya pedidos, por mes ("2026-10" → { "2026-10-02": [{ _id, nombre }] }).
  const [porMes, setPorMes] = useState({});
  const [error, setError] = useState("");
  // Día con varias sesiones cuya lista se muestra debajo de la rejilla.
  const [diaAbierto, setDiaAbierto] = useState(null);

  const claveMes = `${mes.anio}-${mes.mes}`;
  const dias = porMes[claveMes];

  useEffect(() => {
    if (porMes[claveMes]) return; // ese mes ya está pedido
    let montado = true;
    setError("");
    getTrainedDays(rangoDelMes(mes.anio, mes.mes))
      .then((res) => {
        if (!montado) return;
        const mapa = Object.fromEntries(res.data.dias.map((d) => [d.dia, d.sesiones]));
        setPorMes((actual) => ({ ...actual, [claveMes]: mapa }));
      })
      .catch(() => montado && setError("No se han podido cargar los días entrenados."));
    return () => {
      montado = false;
    };
    // porMes no va en las dependencias: solo importa cuando cambia el mes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveMes]);

  const totalSesiones = dias ? Object.values(dias).reduce((n, s) => n + s.length, 0) : null;
  const esMesActual = mes.anio === hoy.getFullYear() && mes.mes === hoy.getMonth();
  const claveHoy = claveDia(hoy);

  const cambiarMes = (paso) => {
    setMes((actual) => moverMes(actual, paso));
    setDiaAbierto(null);
  };

  const tocarDia = (dia) => {
    const sesiones = dias[dia];
    if (sesiones.length === 1) navigate(`/history/${sesiones[0]._id}`);
    else setDiaAbierto((actual) => (actual === dia ? null : dia));
  };

  return (
    <section className={`${styles.calendario} glassCard`}>
      <button
        type="button"
        className={styles.cabecera}
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
      >
        <span className={styles.titulo}>{nombreDelMes(mes.anio, mes.mes)}</span>
        <span className={styles.resumen}>
          {totalSesiones === null ? "…" : contar(totalSesiones, "sesión", "sesiones")}
        </span>
        <span className={`${styles.chevron} ${abierto ? styles.chevronAbierto : ""}`}>
          <IconChevron direccion="abajo" />
        </span>
      </button>

      {abierto && (
        <div className={styles.cuerpo}>
          <div className={styles.navegacion}>
            <button type="button" className={styles.flecha} onClick={() => cambiarMes(-1)} aria-label="Mes anterior">
              <IconChevron direccion="izquierda" />
            </button>
            <button
              type="button"
              className={styles.flecha}
              onClick={() => cambiarMes(1)}
              disabled={esMesActual}
              aria-label="Mes siguiente"
            >
              <IconChevron direccion="derecha" />
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.rejilla}>
            {DIAS_SEMANA.map((d) => (
              <span key={d} className={styles.diaSemana} aria-hidden="true">
                {d}
              </span>
            ))}
            {rejillaDelMes(mes.anio, mes.mes)
              .flat()
              .map((celda, i) => {
                if (!celda) return <span key={`hueco-${i}`} />;
                const sesiones = dias?.[celda.dia];
                const clases = [
                  styles.dia,
                  sesiones && styles.diaEntrenado,
                  celda.dia === claveHoy && styles.diaHoy,
                  celda.dia === diaAbierto && styles.diaAbierto,
                ]
                  .filter(Boolean)
                  .join(" ");
                return sesiones ? (
                  <button
                    key={celda.dia}
                    type="button"
                    className={clases}
                    onClick={() => tocarDia(celda.dia)}
                    aria-label={`${celda.numero}: ${sesiones.map((s) => s.nombre).join(", ")}`}
                  >
                    {celda.numero}
                  </button>
                ) : (
                  <span key={celda.dia} className={clases}>
                    {celda.numero}
                  </span>
                );
              })}
          </div>

          {diaAbierto && dias?.[diaAbierto] && (
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
          )}
        </div>
      )}
    </section>
  );
}
