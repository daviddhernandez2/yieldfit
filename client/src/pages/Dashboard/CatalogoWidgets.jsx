import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { listExercises } from '@/api/exercises.js';
import { listWorkouts } from '@/api/workouts.js';
import BotonIcono from '@/components/BotonIcono/BotonIcono.jsx';
import ExercisePicker from '@/components/ExercisePicker/ExercisePicker.jsx';
import useOpcionesEjercicio from '@/hooks/useOpcionesEjercicio.js';
import styles from '@/pages/Dashboard/CatalogoWidgets.module.css';

const IconFlecha = () => (
  <svg className={styles.flecha} viewBox="0 0 24 24" aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

// Qué se pide en el segundo paso, según lo que necesita el widget.
const PASO = {
  exercise: 'Elige el ejercicio. Solo los de fuerza: el cardio no tiene 1RM.',
  workout: 'Elige la rutina.',
  chart: 'Elige el grupo.',
};

// "Añadir widget" del modo edición del Dashboard (bloque 9d, tarjeta "Editar dashboard"): en el
// móvil, una hoja desde abajo; en escritorio, una ventana centrada (lo decide el CSS).
//   1. El catálogo: cada widget con su descripción y sus tamaños. Los de un solo dato que ya
//      están (Racha, Progreso total…) salen al final como "Ya está".
//   2. Si el widget apunta a algo, elegirlo: un ejercicio de fuerza (el buscador de siempre),
//      una rutina o un grupo (los que aún no están, y "Crear grupo nuevo").
// Va en un portal, encima de todo: la barra lateral y las tarjetas crean sus propias capas.
// Props: catalogo (del servidor), yaPuestos (Set de tipos), gruposPuestos (Set de ids), grupos
// (Map id → grupo), onElegir(def, referencia), onCerrar().
export default function CatalogoWidgets({ catalogo, yaPuestos, gruposPuestos, grupos, onElegir, onCerrar }) {
  const navigate = useNavigate();
  const { opciones } = useOpcionesEjercicio();
  const [def, setDef] = useState(null); // widget elegido que necesita una referencia
  const [ejercicios, setEjercicios] = useState(null);
  const [rutinas, setRutinas] = useState(null);
  const [error, setError] = useState('');
  const titulo = useRef(null);

  // Al abrir y al cambiar de paso, el foco va al título: el lector de pantalla anuncia dónde está.
  useEffect(() => {
    titulo.current?.focus();
  }, [def]);

  // Escape cierra (o vuelve al catálogo desde el segundo paso).
  useEffect(() => {
    const alPulsar = (e) => {
      if (e.key !== 'Escape') return;
      if (def) setDef(null);
      else onCerrar();
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [def, onCerrar]);

  // Lo del segundo paso se pide solo cuando hace falta.
  useEffect(() => {
    if (!def) return;
    let montado = true;
    setError('');
    if (def.necesita === 'exercise' && !ejercicios) {
      listExercises()
        .then((res) => montado && setEjercicios(res.data.exercises.filter((ex) => ex.tracking === '1RM')))
        .catch(() => montado && setError('No se han podido cargar tus ejercicios.'));
    }
    if (def.necesita === 'workout' && !rutinas) {
      listWorkouts()
        .then((res) => montado && setRutinas(res.data.workouts))
        .catch(() => montado && setError('No se han podido cargar tus rutinas.'));
    }
    return () => {
      montado = false;
    };
  }, [def, ejercicios, rutinas]);

  const elegir = (d) => {
    if (d.necesita) setDef(d);
    else onElegir(d, null);
  };

  const disponibles = catalogo.filter((d) => d.disponible);
  const libres = disponibles.filter((d) => !yaPuestos.has(d.tipo));
  const puestos = disponibles.filter((d) => yaPuestos.has(d.tipo));
  const gruposLibres = [...grupos.values()].filter((g) => !gruposPuestos.has(g._id));

  let cuerpo;
  if (!def) {
    cuerpo = (
      <ul className={styles.lista}>
        {libres.map((d) => (
          <li key={d.tipo}>
            <button type="button" className={styles.item} onClick={() => elegir(d)}>
              <span className={styles.texto}>
                <span className={styles.nombre}>{d.nombre}</span>
                <span className={styles.descripcion}>{d.descripcion}</span>
              </span>
              <span className={styles.chips} aria-label={`Tamaños: ${d.tamanos.join(', ')}`}>
                {d.tamanos.map((t) => (
                  <span key={t} className={styles.chip} aria-hidden="true">
                    {t}
                  </span>
                ))}
              </span>
              {d.necesita && <IconFlecha />}
            </button>
          </li>
        ))}
        {puestos.map((d) => (
          <li key={d.tipo} className={`${styles.item} ${styles.puesto}`}>
            <span className={styles.texto}>
              <span className={styles.nombre}>{d.nombre}</span>
              <span className={styles.descripcion}>{d.descripcion}</span>
            </span>
            <span className={styles.yaEsta}>Ya está</span>
          </li>
        ))}
      </ul>
    );
  } else if (error) {
    cuerpo = <p className={styles.error}>{error}</p>;
  } else if (def.necesita === 'exercise') {
    cuerpo =
      ejercicios && opciones ? (
        <ExercisePicker ejercicios={ejercicios} opciones={opciones} onElegir={(id) => onElegir(def, id)} />
      ) : (
        <p className={styles.mensaje}>Cargando…</p>
      );
  } else if (def.necesita === 'workout') {
    if (!rutinas) cuerpo = <p className={styles.mensaje}>Cargando…</p>;
    else if (rutinas.length === 0) cuerpo = <p className={styles.mensaje}>Aún no tienes rutinas. Crea una en Entrenar.</p>;
    else {
      cuerpo = (
        <ul className={styles.lista}>
          {rutinas.map((r) => (
            <li key={r._id}>
              <button type="button" className={styles.item} onClick={() => onElegir(def, r._id)}>
                <span className={styles.texto}>
                  <span className={styles.nombre}>{r.nombre}</span>
                  <span className={styles.descripcion}>
                    {r.ejercicios.length} {r.ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      );
    }
  } else {
    cuerpo = (
      <ul className={styles.lista}>
        {gruposLibres.map((g) => (
          <li key={g._id}>
            <button type="button" className={styles.item} onClick={() => onElegir(def, g._id)}>
              <span className={styles.texto}>
                <span className={styles.nombre}>{g.nombre}</span>
              </span>
            </button>
          </li>
        ))}
        <li>
          {/* Crear un grupo lleva a su formulario; al guardarlo, el servidor ya lo añade al final
              del dashboard. Si hay cambios sin guardar aquí, el aviso de salir pregunta antes. */}
          <button type="button" className={`${styles.item} ${styles.crear}`} onClick={() => navigate('/groups/new')}>
            + Crear grupo nuevo
          </button>
        </li>
      </ul>
    );
  }

  return createPortal(
    <div className={styles.velo} onClick={onCerrar}>
      <div
        className={styles.hoja}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-catalogo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.cabecera}>
          {def && <BotonIcono icono="atras" etiqueta="Volver al catálogo" variante="sinFondo" onClick={() => setDef(null)} />}
          <h2 id="titulo-catalogo" className={styles.titulo} tabIndex={-1} ref={titulo}>
            {def ? def.nombre : 'Añadir widget'}
          </h2>
          <BotonIcono icono="cerrar" etiqueta="Cerrar" variante="sinFondo" onClick={onCerrar} />
        </div>
        <p className={styles.paso}>
          {def ? PASO[def.necesita] : 'Los de un solo dato que ya tienes salen al final: van una sola vez.'}
        </p>
        <div className={styles.cuerpo}>{cuerpo}</div>
      </div>
    </div>,
    document.body
  );
}
