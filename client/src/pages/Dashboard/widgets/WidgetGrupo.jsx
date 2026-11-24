import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProgress } from '@/api/progress.js';
import BotonIcono from '@/components/BotonIcono/BotonIcono.jsx';
import Esqueleto, { ZonaCarga } from '@/components/Esqueleto/Esqueleto.jsx';
import GraficaProgreso from '@/components/GraficaProgreso/GraficaProgreso.jsx';
import MenuOpciones from '@/components/MenuOpciones/MenuOpciones.jsx';
import Variacion from '@/pages/Dashboard/widgets/Variacion.jsx';
import { desdeDeRango } from '@/utils/grupos.js';
import styles from '@/pages/Dashboard/widgets/Widget.module.css';

// Ejercicios que caben en la lista de un widget G (bloque 9d): con el alto de dos filas, la
// cabecera y la gráfica, caben tres; si hay más, "+N ejercicios".
const EJERCICIOS_EN_G = 3;

// Widget de un grupo de progreso (bloque 9d; antes GrupoProgreso, bloque 9). Pide su progreso
// con su rango; el cálculo es el mismo para todos los grupos (servidor, utils/progreso.js).
//   - P: nombre, % y rango.
//   - M: + la línea del progreso.
//   - G: + el eje de fechas y los ejercicios que caben.
// El rango se cambia desde la etiqueta ("1 año ▾") sin entrar en el modo edición: es una forma
// de mirar. Lo guarda el Dashboard en el servidor (onCambiarRango).
//
// Props: tamano, grupo ({ _id, nombre, todos, exerciseIds }), rango (valor), rangos (del
// catálogo), onCambiarRango(valor).
export default function WidgetGrupo({ tamano, grupo, rango, rangos, onCambiarRango, className = '' }) {
  const navigate = useNavigate();
  const [progreso, setProgreso] = useState(null);
  const [error, setError] = useState('');

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

  const rangoActual = rangos.find((r) => r.valor === rango) ?? rangos.at(-1);
  // En el botón, "1 año"; pero "todo el historial" no cabe junto al nombre y el % en el móvil:
  // para ese, su etiqueta corta ("Total"). El menú muestra siempre los nombres completos.
  const textoRango = rangoActual.valor === 'TOTAL' ? rangoActual.etiqueta : rangoActual.titulo;
  const menuRango = (
    <MenuOpciones
      texto={textoRango}
      etiqueta={`Rango de ${grupo.nombre}: ${rangoActual.titulo}`}
      opciones={rangos.map((r) => ({ valor: r.valor, texto: r.titulo }))}
      valor={rangoActual.valor}
      onElegir={onCambiarRango}
      alinear={tamano === 'P' ? 'inicio' : 'fin'}
    />
  );
  const conDatos = progreso && progreso.porcentaje !== null;

  // Contenido según el estado: vacío, error, cargando, sin datos suficientes o con datos.
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
  }

  if (tamano === 'P') {
    return (
      <section className={`${styles.widget} glassCard ${className}`} aria-label={grupo.nombre}>
        <h2 className={styles.nombreGrupoP} title={grupo.nombre}>
          {grupo.nombre}
        </h2>
        {conDatos ? (
          <div className={styles.valor}>
            <Variacion valor={progreso.porcentaje} tamano="grande" />
          </div>
        ) : (
          <div className={styles.valor}>{cuerpo}</div>
        )}
        <div className={styles.pieGrupoP}>{menuRango}</div>
      </section>
    );
  }

  const ejercicios = progreso?.ejercicios ?? [];
  return (
    <section className={`${styles.widget} glassCard ${className}`} aria-label={grupo.nombre}>
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
        {menuRango}
        {conDatos && <Variacion valor={progreso.porcentaje} />}
      </div>
      {conDatos ? (
        <>
          <GraficaProgreso serie={progreso.serie} conEjes={tamano === 'G'} />
          {tamano === 'G' && ejercicios.length > 0 && (
            <ul className={styles.ejercicios}>
              {ejercicios.slice(0, EJERCICIOS_EN_G).map((ej) => (
                <li key={ej.exerciseId} className={styles.ejercicio}>
                  <span className={styles.nombreEjercicio}>{ej.nombre}</span>
                  <Variacion valor={ej.porcentaje} />
                </li>
              ))}
              {ejercicios.length > EJERCICIOS_EN_G && (
                <li className={styles.mas}>+{ejercicios.length - EJERCICIOS_EN_G} ejercicios</li>
              )}
            </ul>
          )}
        </>
      ) : (
        cuerpo
      )}
    </section>
  );
}
