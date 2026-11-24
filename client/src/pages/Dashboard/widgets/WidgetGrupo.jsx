import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProgress } from '@/api/progress.js';
import BotonIcono from '@/components/BotonIcono/BotonIcono.jsx';
import GraficaProgreso from '@/components/GraficaProgreso/GraficaProgreso.jsx';
import MenuOpciones from '@/components/MenuOpciones/MenuOpciones.jsx';
import MarcoWidget from '@/pages/Dashboard/widgets/MarcoWidget.jsx';
import Cargando from '@/pages/Dashboard/widgets/Cargando.jsx';
import Variacion from '@/pages/Dashboard/widgets/Variacion.jsx';
import { desdeDeRango } from '@/utils/grupos.js';
import { filasParaAlto } from '@/utils/reticula.js';
import styles from '@/pages/Dashboard/widgets/Widget.module.css';

// Ejercicios que se ven sin desplegar: los que caben en un G bajo la gráfica.
const EJERCICIOS_VISIBLES = 3;

// Widget de un grupo de progreso (bloque 9d), siempre en G. Anatomía (tarjeta Widget):
//   - Cabecera: el nombre del grupo y el lápiz para editarlo.
//   - El % en grande (28 px) y, a la derecha, el rango ("Total ▾"), que se cambia sin entrar en
//     el modo edición (es una forma de mirar) y se guarda en el servidor (onCambiarRango).
//   - Gráfica de alto fijo (72 px), tres ejercicios en filas de 28 px y "+N ejercicios", que
//     despliega el resto: el widget ocupa las filas que necesite (onCambiarFilas) y lo de debajo
//     baja. Desplegar no se guarda.
// Con menos de tres ejercicios, el sitio de las filas que faltan queda libre (decisión de David).
// Props: grupo ({ _id, nombre, todos, exerciseIds }), rango, rangos (del catálogo),
// onCambiarRango(valor), onCambiarFilas(filas o null).
export default function WidgetGrupo({ grupo, rango, rangos, onCambiarRango, onCambiarFilas, className = '' }) {
  const navigate = useNavigate();
  const [progreso, setProgreso] = useState(null);
  const [error, setError] = useState('');
  const [desplegado, setDesplegado] = useState(false);
  const caja = useRef(null);

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

  // Al desplegar, se mide lo que ocupa el contenido entero (la tarjeta es la sección más
  // cercana) y se piden las filas necesarias; al plegar, se vuelve al tamaño G.
  useLayoutEffect(() => {
    if (!abierto) {
      onCambiarFilas(null);
      return;
    }
    const tarjeta = caja.current.closest('section');
    onCambiarFilas(filasParaAlto(tarjeta.scrollHeight, tarjeta.closest('[data-reticula]')));
  }, [abierto, ejercicios.length, onCambiarFilas]);

  const rangoActual = rangos.find((r) => r.valor === rango) ?? rangos.at(-1);
  // En el botón, "1 año"; "todo el historial" no cabe en el móvil: su etiqueta corta, "Total".
  const textoRango = rangoActual.valor === 'TOTAL' ? rangoActual.etiqueta : rangoActual.titulo;
  const conDatos = progreso && progreso.porcentaje !== null;

  const menuRango = (
    <MenuOpciones
      texto={textoRango}
      etiqueta={`Rango de ${grupo.nombre}: ${rangoActual.titulo}`}
      opciones={rangos.map((r) => ({ valor: r.valor, texto: r.titulo }))}
      valor={rangoActual.valor}
      onElegir={onCambiarRango}
      alinear="fin"
    />
  );

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
    cuerpo = <Cargando que={`el progreso de ${grupo.nombre}`} />;
  } else if (!conDatos) {
    cuerpo = (
      <>
        <div className={`${styles.cifra} ${styles.cifraGrupo}`}>
          <span>—</span>
          {menuRango}
        </div>
        <p className={`${styles.mensaje} ${styles.listaGrupo}`}>
          {progreso.sesiones === 0 && rangoActual.valor === 'TOTAL'
            ? 'Aún no hay sesiones.'
            : `Pocas sesiones en ${rangoActual.titulo}: cada ejercicio necesita dos.`}
        </p>
      </>
    );
  } else {
    cuerpo = (
      <>
        <div className={`${styles.cifra} ${styles.cifraGrupo}`}>
          <Variacion valor={progreso.porcentaje} tamano="grande" />
          {menuRango}
        </div>
        <div className={styles.zonaGrafica}>
          <GraficaProgreso serie={progreso.serie} />
        </div>
        <ul className={`${styles.lista} ${styles.listaGrupo}`}>
          {(abierto ? ejercicios : ejercicios.slice(0, EJERCICIOS_VISIBLES)).map((ej) => (
            <li key={ej.exerciseId} className={styles.fila}>
              <span className={styles.nombre}>{ej.nombre}</span>
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
    <MarcoWidget
      etiqueta={grupo.nombre}
      dato={
        <BotonIcono
          variante="sinFondo"
          icono="editar"
          etiqueta={`Editar el grupo ${grupo.nombre}`}
          className={styles.editar}
          onClick={() => navigate(`/groups/${grupo._id}/edit`)}
        />
      }
      className={className}
    >
      <div ref={caja} style={{ display: 'contents' }}>
        {cuerpo}
      </div>
    </MarcoWidget>
  );
}
