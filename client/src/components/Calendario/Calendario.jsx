import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTrainedDays } from "@/api/sessions.js";
import Chip from "@/components/Chip/Chip.jsx";
import Button from "@/components/Button/Button.jsx";
import PanelDia from "@/components/Calendario/PanelDia.jsx";
import { formatDuracion, formatHora } from "@/utils/formato.js";
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
  resumenDelMes,
  semanaDelAnio,
} from "@/utils/calendario.js";
import styles from "@/components/Calendario/Calendario.module.css";
import BotonIcono from "@/components/BotonIcono/BotonIcono.jsx";

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Ancho del propio calendario a partir del cual va en dos columnas (mes + panel del día).
// Es el ancho del componente, no de la pantalla: en escritorio la barra lateral ocupa 260 px,
// y a 1024 px de pantalla no quedan ni 700 para el calendario (las celdas no cabrían). Con
// 860 px las dos columnas aparecen desde unos 1220 px de pantalla (bloque 8b).
const ANCHO_DOS_COLUMNAS = 860;
// Píldoras de sesión que caben en una celda de escritorio; el resto, "+N".
const PILDORAS_POR_DIA = 2;

// Mide el ancho de un elemento y lo actualiza al cambiar (girar la tableta, redimensionar).
// Con ResizeObserver, no con el ancho de la pantalla: funciona igual dentro de Capacitor.
// Se mide la caja EXTERIOR (borderBoxSize), no el contenido: la forma ancha tiene más relleno,
// y si se midiera el contenido, al pasar a ancha el ancho bajaría, volvería a estrecha, y así
// sin parar. El ancho exterior lo decide la página, no el calendario.
const useAncho = (ref) => {
  const [ancho, setAncho] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return undefined;
    const observador = new ResizeObserver(([entrada]) =>
      setAncho(entrada.borderBoxSize?.[0]?.inlineSize ?? entrada.target.getBoundingClientRect().width),
    );
    observador.observe(ref.current);
    return () => observador.disconnect();
  }, [ref]);
  return ancho;
};

const IconChevron = ({ direccion }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {direccion === "izquierda" && <polyline points="15 18 9 12 15 6" />}
    {direccion === "derecha" && <polyline points="9 18 15 12 9 6" />}
  </svg>
);

// Calendario de días entrenados (bloque 8, DECISIONS.md 0033), arriba del Historial.
// Dos vistas: mes (rejilla de lunes a domingo) y año (mapa tipo GitHub, una columna por
// semana). Las dos leen del mismo dato: los días de un año natural, pedidos una vez por año
// (GET /api/sessions/days).
//
// Dos formas, según el ancho que tenga (bloque 8b):
//   - Estrecha (móvil, tableta, escritorio pequeño): como siempre. Tocar un día entrenado:
//     con una sesión, abre su detalle; con varias, las lista encima (con hora y duración).
//   - Ancha (escritorio): dos columnas. A la izquierda, el mes con celdas altas y el nombre
//     de las sesiones; a la derecha, el panel del día seleccionado (PanelDia). Tocar
//     cualquier día lo selecciona.
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
  // Escritorio: día que enseña el panel. Empieza en hoy.
  const [seleccionado, setSeleccionado] = useState(claveHoy);
  const mapaAnualRef = useRef(null);
  const calendarioRef = useRef(null);
  const ancho = useAncho(calendarioRef);
  const ancha = ancho >= ANCHO_DOS_COLUMNAS;

  const dias = porAnio[mes.anio];
  // Mes anterior al que se ve, para comparar en el panel. En enero es diciembre del año
  // anterior, que puede no estar pedido todavía.
  const mesAnterior = moverMes(mes, -1);

  // Años que hacen falta: el que se ve y, en la forma ancha, el del mes anterior. Cada año se
  // pide una sola vez y se guarda (porAnio).
  const aniosNecesarios = ancha && mesAnterior.anio !== mes.anio ? [mes.anio, mesAnterior.anio] : [mes.anio];
  const clavePeticion = aniosNecesarios.join(",");

  useEffect(() => {
    const pendientes = clavePeticion.split(",").map(Number).filter((anio) => !porAnio[anio]);
    if (pendientes.length === 0) return undefined;
    let montado = true;
    setError("");
    for (const anio of pendientes) {
      getTrainedDays(rangoDelAnio(anio))
        .then((res) => {
          if (!montado) return;
          const mapa = Object.fromEntries(res.data.dias.map((d) => [d.dia, d.sesiones]));
          setPorAnio((actual) => ({ ...actual, [anio]: mapa }));
        })
        .catch(() => montado && setError("No se han podido cargar los días entrenados."));
    }
    return () => {
      montado = false;
    };
    // porAnio no va en las dependencias: solo importa cuando cambian los años necesarios.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clavePeticion]);

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

  // Escritorio: vuelve al mes actual (vista de mes) y selecciona hoy.
  const irAHoy = () => {
    setVista("mes");
    setMes({ anio: hoy.getFullYear(), mes: hoy.getMonth() });
    setSeleccionado(claveHoy);
  };

  const tocarDia = (dia) => {
    if (ancha) {
      setSeleccionado(dia);
      return;
    }
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

  // Celda del mes en la forma ancha: alta, con el número arriba y las sesiones en píldoras.
  // Todos los días se pueden seleccionar (también los de descanso), para verlos en el panel.
  const celdaEscritorio = (celda) => {
    const sesiones = dias?.[celda.dia] ?? [];
    const sobran = sesiones.length - PILDORAS_POR_DIA;
    const clases = [styles.celda, celda.dia === seleccionado && styles.celdaSeleccionada].filter(Boolean).join(" ");
    return (
      <button
        key={celda.dia}
        type="button"
        className={clases}
        onClick={() => tocarDia(celda.dia)}
        aria-pressed={celda.dia === seleccionado}
        aria-label={`${celda.dia}${sesiones.length ? `: ${sesiones.map((s) => s.nombre).join(", ")}` : ""}`}
      >
        <span className={`${styles.numero} ${celda.dia === claveHoy ? styles.numeroHoy : ""} ${sesiones.length ? styles.numeroEntrenado : ""}`}>
          {celda.numero}
        </span>
        {sesiones.slice(0, PILDORAS_POR_DIA).map((s) => (
          <span key={s._id} className={styles.pildora}>
            {s.nombre}
          </span>
        ))}
        {sobran > 0 && <span className={styles.mas}>+{sobran}</span>}
      </button>
    );
  };

  // Datos del panel y de la cabecera ancha.
  const fechaSeleccionada = new Date(`${seleccionado}T00:00:00`);
  const nombreMes = (anio, m) => new Date(anio, m, 1).toLocaleDateString("es-ES", { month: "long" });
  const resumenMes = {
    nombre: nombreMes(mes.anio, mes.mes),
    actual: resumenDelMes(dias, mes.anio, mes.mes),
    anteriorNombre: nombreMes(mesAnterior.anio, mesAnterior.mes),
    anterior: resumenDelMes(porAnio[mesAnterior.anio], mesAnterior.anio, mesAnterior.mes) ?? undefined,
  };

  // Las dos vistas se pintan siempre, una encima de otra en el mismo hueco, y se oculta la
  // que no toca: así la tarjeta mide siempre lo que la más alta y no "salta" al cambiar de
  // vista. Por lo mismo, el mes tiene siempre 6 filas (aunque algunos meses ocupen 5).
  const semanasDelMes = rejillaDelMes(mes.anio, mes.mes);
  while (semanasDelMes.length < 6) semanasDelMes.push(Array(7).fill(null));
  const semanasDelAnio = rejillaDelAnio(mes.anio);

  // Cabecera de la forma ancha: el mes en grande, debajo la semana del día seleccionado y las
  // sesiones del periodo; a la derecha Mes / Año y ‹ Hoy ›.
  const cabeceraAncha = () => (
    <div className={styles.cabeceraAncha}>
      <div>
        <h2 className={styles.mesGrande}>
          {vista === "mes" ? `${nombreMes(mes.anio, mes.mes)} ${mes.anio}` : mes.anio}
        </h2>
        <p className={styles.resumen}>
          Semana {semanaDelAnio(fechaSeleccionada)} ·{" "}
          {totalSesiones === null ? "…" : contar(totalSesiones, "sesión", "sesiones")}{" "}
          {vista === "mes" ? `en ${nombreMes(mes.anio, mes.mes)}` : `en ${mes.anio}`}
        </p>
      </div>
      <div className={styles.controles}>
        <div className={styles.selector} role="group" aria-label="Vista del calendario">
          <Chip label="Mes" selected={vista === "mes"} onClick={() => cambiarVista("mes")} />
          <Chip label="Año" selected={vista === "anio"} onClick={() => cambiarVista("anio")} />
        </div>
        <div className={styles.navegacionAncha}>
          <BotonIcono
            icono="atras"
            etiqueta={vista === "mes" ? "Mes anterior" : "Año anterior"}
            onClick={() => mover(-1)}
          />
          <Button variant="ghost" size="sm" onClick={irAHoy}>
            Hoy
          </Button>
          <BotonIcono
            icono="adelante"
            etiqueta={vista === "mes" ? "Mes siguiente" : "Año siguiente"}
            onClick={() => mover(1)}
            disabled={enElPresente}
          />
        </div>
      </div>
    </div>
  );

  // Cabecera de la forma estrecha (como siempre): título y dato a la izquierda, Mes / Año a
  // la derecha, y debajo ‹ periodo ›.
  const cabeceraEstrecha = () => (
    <>
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
    </>
  );

  return (
    <section ref={calendarioRef} className={`${styles.calendario} ${ancha ? styles.ancha : ""} glassCard`}>
      <div className={styles.columnaMes}>
        {ancha ? cabeceraAncha() : cabeceraEstrecha()}

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.vistas}>
          {/* inert: la vista oculta no se puede tocar ni recibe el foco del teclado. */}
          <div className={`${styles.vista} ${vista === "mes" ? "" : styles.oculta}`} inert={vista !== "mes"}>
            <div className={`${styles.rejillaMes} ${ancha ? styles.rejillaAncha : styles.anchoMes}`}>
              {DIAS_SEMANA.map((d) => (
                <span key={d} className={styles.diaSemana} aria-hidden="true">
                  {d}
                </span>
              ))}
              {semanasDelMes
                .flat()
                // Los huecos miden como los días: una fila entera de huecos (los meses de 5
                // semanas, rellenados a 6) mide lo mismo que una de días.
                .map((celda, i) =>
                  celda ? (
                    ancha ? celdaEscritorio(celda) : celdaDia(celda, styles.dia, true)
                  ) : (
                    <span key={`hueco-${i}`} className={ancha ? styles.huecoAncho : styles.huecoMes} />
                  ),
                )}
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
            <div className={styles.capaDia}>
              <div className={styles.capaDiaCabecera}>
                <span>{diaAbierto.split("-").reverse().join("/")}</span>
                <BotonIcono variante="sinFondo" icono="cerrar" etiqueta="Cerrar" onClick={() => setDiaAbierto(null)} />
              </div>
              <ul className={styles.listaDia}>
                {dias[diaAbierto].map((s) => (
                  <li key={s._id}>
                    <button type="button" className={styles.sesionDia} onClick={() => navigate(`/history/${s._id}`)}>
                      <span className={styles.sesionDiaTexto}>
                        {s.nombre}
                        {/* Hora y duración (bloque 8b). Si el servidor aún no las manda, no se ven. */}
                        {s.fecha && (
                          <span className={styles.sesionDiaDato}>
                            {formatHora(s.fecha)}
                            {s.duracionSegundos !== undefined && ` · ${formatDuracion(s.duracionSegundos)}`}
                          </span>
                        )}
                      </span>
                      <IconChevron direccion="derecha" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {ancha && (
        <PanelDia
          dia={seleccionado}
          sesiones={porAnio[fechaSeleccionada.getFullYear()]?.[seleccionado]}
          esFuturo={seleccionado > claveHoy}
          mes={resumenMes}
          onAbrir={(id) => navigate(`/history/${id}`)}
        />
      )}
    </section>
  );
}
