import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProgress } from '@/api/progress.js';
import BotonIcono from '@/components/BotonIcono/BotonIcono.jsx';
import Esqueleto, { ZonaCarga } from '@/components/Esqueleto/Esqueleto.jsx';
import GraficaProgreso from '@/components/GraficaProgreso/GraficaProgreso.jsx';
import MenuOpciones from '@/components/MenuOpciones/MenuOpciones.jsx';
import Variacion from '@/pages/Dashboard/widgets/Variacion.jsx';
import { desdeDeRango } from '@/utils/grupos.js';
import { filasParaAlto } from '@/utils/reticula.js';
import styles from '@/pages/Dashboard/widgets/Widget.module.css';

// Ejercicios que se ven sin desplegar: los que caben en un widget G (dos filas) bajo la gráfica.
const EJERCICIOS_VISIBLES = 3;

// Widget de un grupo de progreso (bloque 9d; antes GrupoProgreso, bloque 9). Siempre tamaño G y
// siempre con el diseño de antes (decisión de David): gráfica y lista de ejercicios. Se ven tres;
// "+N ejercicios" despliega el resto y el widget ocupa las filas que necesite (onCambiarFilas):
// lo de debajo baja, nada queda tapado. Desplegar es una forma de mirar: no se guarda.
//
// El rango se cambia desde la etiqueta ("1 año ▾") sin entrar en el modo edición. Lo guarda el
// Dashboard en el servidor (onCambiarRango).
//
// Props: grupo ({ _id, nombre, todos, exerciseIds }), rango (valor), rangos (del catálogo),
// onCambiarRango(valor), onCambiarFilas(filas o null para volver a su tamaño).
export default function WidgetGrupo({ grupo, rango, rangos, onCambiarRango, onCambiarFilas, className = '' }) {
  const navigate = useNavigate();
  const [progreso, setProgreso] = useState(null);
  const [error, setError] = useState('');
  const [desplegado, setDesplegado] = useState(false);
  const tarjeta = useRef(null);

  // Un grupo normal sin ejercicios (se borraron todos): no se pide nada, se avisa. "Todos" no
  // tiene lista: cuenta con todos.
  const vacio = !grupo.todos && grupo.exerciseIds.length === 0;

  useEffect(() => {
    if (vacio) return;
    let montado = true;
    setError('');
    setProgreso(null);
    getProgress({ desde: desdeDeRango(rango), grupo: grupo._id })
      .then((res) => montado && setProgreso(res.data.progreso))
      .catch((err) => montado && setError(err.response?.data?.message || 'No se ha podido cargar.'));
    return () => {
      montado = false;
    };
  }, [rango, grupo._id, vacio]);

  const ejercicios = progreso?.ejercicios ?? [];
  const ocultos = Math.max(0, ejercicios.length - EJERCICIOS_VISIBLES);
  const abierto = desplegado && ocultos > 0;

  // Al desplegar, se mide lo que ocupa el contenido entero y se piden las filas necesarias; al
  // plegar (o si cambia el rango y ya no sobra nada), se vuelve al tamaño G.
  useLayoutEffect(() => {
    if (!abierto) {
      onCambiarFilas(null);
      return;
    }
    const el = tarjeta.current;
    onCambiarFilas(filasParaAlto(el.scrollHeight, el.closest('[data-reticula]')));
  }, [abierto, ejercicios.length, onCambiarFilas]);

  const rangoActual = rangos.find((r) => r.valor === rango) ?? rangos.at(-1);
  // En el botón, "1 año"; pero "todo el historial" no cabe junto al nombre y el % en el móvil:
  // para ese, su etiqueta corta ("Total"). El menú muestra siempre los nombres completos.
  const textoRango = rangoActual.valor === 'TOTAL' ? rangoActual.etiqueta : rangoActual.titulo;
  const conDatos = progreso && progreso.porcentaje !== null;

  let cuerpo;
  if (vacio) {
    cuerpo = (
      <p className={styles.mensaje}>
        Sin ejercicios:{' '}
        <button type="button" className={styles.enlace} onClick={() => navigate(`/groups/${grupo._id}/edit`)}>
          edítalo
        </button>
        .
      </p>
    );
  } else if (error) {
    cuerpo = <p className={styles.error}>{error}</p>;
  } else if (!progreso) {
    cuerpo = (
      <ZonaCarga etiqueta={`Cargando el progreso de ${grupo.nombre}`} className={styles.esqueleto}>
        <Esqueleto forma="bloque" alto="100%" />
      </ZonaCarga>
    );
  } else if (!conDatos) {
    cuerpo = (
      <p className={styles.mensaje}>
        {progreso.sesiones === 0 && rangoActual.valor === 'TOTAL'
          ? 'Aún no hay sesiones.'
          : `Pocas sesiones en ${rangoActual.titulo}: cada ejercicio necesita dos.`}
      </p>
    );
  } else {
    cuerpo = (
      <>
        <div className={styles.zonaGrafica}>
          <GraficaProgreso serie={progreso.serie} conEjes />
        </div>
        <ul className={styles.ejercicios}>
          {(abierto ? ejercicios : ejercicios.slice(0, EJERCICIOS_VISIBLES)).map((ej) => (
            <li key={ej.exerciseId} className={styles.ejercicio}>
              <span className={styles.nombreEjercicio}>{ej.nombre}</span>
              <Variacion valor={ej.porcentaje} />
            </li>
          ))}
        </ul>
        {ocultos > 0 && (
          <button type="button" className={styles.desplegar} onClick={() => setDesplegado((d) => !d)} aria-expanded={abierto}>
            {abierto ? 'Ver menos' : `+${ocultos} ejercicios`}
            <svg className={styles.flechaDesplegar} viewBox="0 0 12 12" aria-hidden="true">
              <path d={abierto ? 'M3 7.5 6 4.5 9 7.5' : 'M3 4.5 6 7.5 9 4.5'} />
            </svg>
          </button>
        )}
      </>
    );
  }

  return (
    <section ref={tarjeta} className={`${styles.widget} ${styles.grupo} glassCard ${className}`} aria-label={grupo.nombre}>
      <div className={styles.cabecera}>
        <h2 className={styles.nombreGrupo} title={grupo.nombre}>
          {grupo.nombre}
        </h2>
        <BotonIcono
          variante="sinFondo"
          icono="editar"
          etiqueta={`Editar el grupo ${grupo.nombre}`}
          className={styles.editar}
          onClick={() => navigate(`/groups/${grupo._id}/edit`)}
        />
        <MenuOpciones
          texto={textoRango}
          etiqueta={`Rango de ${grupo.nombre}: ${rangoActual.titulo}`}
          opciones={rangos.map((r) => ({ valor: r.valor, texto: r.titulo }))}
          valor={rangoActual.valor}
          onElegir={onCambiarRango}
          alinear="fin"
        />
        {conDatos && <Variacion valor={progreso.porcentaje} />}
      </div>
      {cuerpo}
    </section>
  );
}
