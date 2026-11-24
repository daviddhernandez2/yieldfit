import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getProgress } from "@/api/progress.js";
import Chip from "@/components/Chip/Chip.jsx";
import Esqueleto, { ZonaCarga } from "@/components/Esqueleto/Esqueleto.jsx";
import { RANGOS, desdeDeRango, guardarPreferencias, leerPreferencias } from "@/utils/grupos.js";
import styles from "@/components/GrupoProgreso/GrupoProgreso.module.css";
import BotonIcono from "@/components/BotonIcono/BotonIcono.jsx";
import { formatPorcentaje } from "@/utils/formato.js";


const claseSigno = (n) => (n > 0 ? styles.positive : n < 0 ? styles.negative : styles.neutral);

// Iniciales de 2 letras para el badge: "Press banca con barra" → "PB"; "Sentadilla" → "SE".
const generarIniciales = (nombre) => {
  if (!nombre) return "?";
  const palabras = nombre.trim().split(/\s+/);
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
};

// Formato del eje X según lo que abarca el gráfico: con más de un año, mes y año
// ("abr 2017"); con menos, día y mes ("11 oct"). El tooltip, siempre la fecha completa.
const UN_ANIO_MS = 365 * 24 * 60 * 60 * 1000;
const FORMATO_CORTO = { day: "numeric", month: "short" };
const FORMATO_LARGO = { month: "short", year: "numeric" };
const FORMATO_COMPLETO = { day: "numeric", month: "short", year: "numeric" };
const formatoEjeX = (serie) => {
  if (serie.length < 2) return FORMATO_CORTO;
  const abarca = new Date(serie.at(-1).fecha) - new Date(serie[0].fecha);
  return abarca > UN_ANIO_MS ? FORMATO_LARGO : FORMATO_CORTO;
};

const IconTrend = ({ value }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {value > 0 && <polyline points="18 15 12 9 6 15" />}
    {value < 0 && <polyline points="6 9 12 15 18 9" />}
    {value === 0 && <line x1="5" y1="12" x2="19" y2="12" />}
  </svg>
);

const IconLapiz = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const IconChevron = ({ abierto }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points={abierto ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
  </svg>
);

// Tarjeta de un grupo de progreso (bloque 9, DECISIONS.md 0034). La misma para "Todos"
// (grupoId null) y para cada grupo del usuario. Pide su progreso al servidor con el rango
// elegido; el cálculo es el mismo para todos (utils/progreso.js en el servidor).
// El rango y si la lista está plegada se recuerdan en este dispositivo (utils/grupos.js).
export default function GrupoProgreso({ grupoId = null, nombre, numEjercicios }) {
  const navigate = useNavigate();
  const [preferencias, setPreferencias] = useState(() => leerPreferencias(grupoId));
  const [progreso, setProgreso] = useState(null);
  const [error, setError] = useState("");

  // Un grupo sin ejercicios (se borraron todos): no se pide nada, se avisa.
  const vacio = grupoId !== null && numEjercicios === 0;

  useEffect(() => {
    if (vacio) return;
    let montado = true;
    setError("");
    setProgreso(null);
    getProgress({ desde: desdeDeRango(preferencias.rango), grupo: grupoId ?? undefined })
      .then((res) => montado && setProgreso(res.data.progreso))
      .catch((err) => montado && setError(err.response?.data?.message || "Error al cargar el progreso."));
    return () => {
      montado = false;
    };
  }, [preferencias.rango, grupoId, vacio]);

  const cambiar = (cambios) => {
    setPreferencias((actual) => {
      const nuevas = { ...actual, ...cambios };
      guardarPreferencias(grupoId, nuevas);
      return nuevas;
    });
  };

  const serieGrafica = useMemo(() => {
    const serie = progreso?.serie ?? [];
    const formato = formatoEjeX(serie);
    return serie.map((punto) => {
      const fecha = new Date(punto.fecha);
      return {
        indice: punto.indice,
        etiqueta: fecha.toLocaleDateString("es-ES", formato),
        fechaCompleta: fecha.toLocaleDateString("es-ES", FORMATO_COMPLETO),
      };
    });
  }, [progreso]);

  const rangoActual = RANGOS.find((r) => r.valor === preferencias.rango);
  // Id único del degradado SVG: con varias tarjetas en la página no pueden repetirse.
  const idDegradado = `degradado-${grupoId ?? "todos"}`;

  return (
    <section className={`${styles.groupCard} glassCard`}>
      <div className={styles.groupHeader}>
        <div className={styles.nombreFila}>
          <h2 className={styles.groupName}>{nombre}</h2>
          {grupoId && (
            <button
              type="button"
              className={styles.editar}
              onClick={() => navigate(`/groups/${grupoId}/edit`)}
              aria-label={`Editar el grupo ${nombre}`}
            >
              <IconLapiz />
            </button>
          )}
        </div>
        <div className={styles.derecha}>
          {progreso?.porcentaje != null && (
            <div className={`${styles.groupPercent} ${claseSigno(progreso.porcentaje)}`}>
              <IconTrend value={progreso.porcentaje} />
              <span>{formatPorcentaje(progreso.porcentaje)}</span>
            </div>
          )}
          {/* Plegar la tarjeta entera: quedan solo el nombre y el %. */}
          <BotonIcono
            variante="sinFondo"
            icono={preferencias.tarjetaPlegada ? "abajo" : "arriba"}
            etiqueta={`${preferencias.tarjetaPlegada ? "Desplegar" : "Plegar"} ${nombre}`}
            onClick={() => cambiar({ tarjetaPlegada: !preferencias.tarjetaPlegada })}
            aria-expanded={!preferencias.tarjetaPlegada}
          />
        </div>
      </div>

      {preferencias.tarjetaPlegada ? null : vacio ? (
        <p className={styles.mensaje}>
          Este grupo no tiene ejercicios:{" "}
          <button type="button" className={styles.enlace} onClick={() => navigate(`/groups/${grupoId}/edit`)}>
            edítalo
          </button>
          .
        </p>
      ) : (
        <>
          {/* Selector de rango: el % se mide desde el primer punto del rango elegido. */}
          <div className={styles.rangos} role="group" aria-label="Rango del progreso">
            {RANGOS.map((r) => (
              <Chip key={r.valor} label={r.etiqueta} selected={preferencias.rango === r.valor} onClick={() => cambiar({ rango: r.valor })} />
            ))}
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {/* Mientras llega el progreso: la silueta del gráfico y de dos ejercicios. */}
          {!error && !progreso && (
            <ZonaCarga etiqueta={`Cargando el progreso de ${nombre}`} className={styles.esqueleto}>
              <Esqueleto forma="bloque" alto="220px" />
              {[55, 40].map((ancho) => (
                <div key={ancho} className={styles.exerciseRow}>
                  <Esqueleto forma="circulo" ancho="36px" />
                  <Esqueleto ancho={`${ancho}%`} />
                  <Esqueleto ancho="56px" />
                </div>
              ))}
            </ZonaCarga>
          )}

          {progreso && progreso.porcentaje === null && (
            <p className={styles.mensaje}>
              {grupoId === null && preferencias.rango === "TOTAL" && progreso.sesiones === 0
                ? "Aún no has terminado ninguna sesión. Empieza una desde Entrenamiento para ver tu progreso aquí."
                : `No hay suficientes sesiones en ${rangoActual.titulo} para calcular el progreso: cada ejercicio necesita al menos dos.`}
            </p>
          )}

          {progreso && progreso.porcentaje !== null && (
            <>
              <div className={styles.chart}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={serieGrafica} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={idDegradado} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3EF87E" stopOpacity={0.6} />
                        <stop offset="50%" stopColor="#3EF87E" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#3EF87E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1f1f1f" vertical={false} />
                    <XAxis dataKey="etiqueta" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      domain={["dataMin - 2", "dataMax + 2"]}
                      // El índice empieza en 100: 112 significa +12 % desde el inicio del rango.
                      tickFormatter={(v) => formatPorcentaje(v - 100)}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: "8px", color: "#ffffff" }}
                      formatter={(value) => [formatPorcentaje(value - 100), "Progreso"]}
                      labelFormatter={(etiqueta, payload) => payload?.[0]?.payload.fechaCompleta ?? etiqueta}
                      labelStyle={{ color: "#888888" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="indice"
                      stroke="#3EF87E"
                      strokeWidth={2.5}
                      fill={`url(#${idDegradado})`}
                      dot={false}
                      activeDot={{ r: 5, fill: "#3EF87E" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Desplegable: la lista de ejercicios se puede ocultar para dejar solo el gráfico.
                  Va junto a la lista en un mismo bloque, sin separación entre los dos. */}
              <div>
                <button
                  type="button"
                  className={styles.plegar}
                  onClick={() => cambiar({ plegado: !preferencias.plegado })}
                  aria-expanded={!preferencias.plegado}
                >
                  {preferencias.plegado ? "Mostrar" : "Ocultar"} ejercicios ({progreso.ejercicios.length})
                  <IconChevron abierto={!preferencias.plegado} />
                </button>

                {!preferencias.plegado && (
                  <div className={styles.exerciseList}>
                    {progreso.ejercicios.map((ej) => (
                      <div key={ej.exerciseId} className={styles.exerciseRow}>
                        <span className={styles.badge}>{generarIniciales(ej.nombre)}</span>
                        <span className={styles.exerciseName}>{ej.nombre}</span>
                        <div className={`${styles.exercisePercent} ${claseSigno(ej.porcentaje)}`}>
                          <IconTrend value={ej.porcentaje} />
                          <span>{formatPorcentaje(ej.porcentaje)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
