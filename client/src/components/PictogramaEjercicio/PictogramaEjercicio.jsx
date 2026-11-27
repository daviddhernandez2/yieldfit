import { createPortal } from 'react-dom';
import { elegirPictograma } from '@compartido/trazosPictograma.js';
import Pictograma from '@/components/Pictograma/Pictograma.jsx';
import BotonIcono from '@/components/BotonIcono/BotonIcono.jsx';
import { useVistaAmpliada } from '@/hooks/useVistaAmpliada.js';
import { etiquetaDe } from '@/hooks/useOpcionesEjercicio.js';
import styles from '@/components/PictogramaEjercicio/PictogramaEjercicio.module.css';

// Pictograma de un ejercicio en una fila (bloque 10): la lista y el buscador de ejercicios (40) y
// la sesión activa (48). Es un botón: al tocarlo, la figura crece hasta el centro de la pantalla
// con el nombre, el grupo y el tipo (vista ampliada), y al cerrar vuelve a su sitio. La animación
// vive en useVistaAmpliada; aquí solo se pinta.
//
// Va DELANTE del botón de la fila, como hermano, nunca dentro: un botón no puede ir dentro de
// otro. Tocar la fila sigue haciendo lo de siempre (abrir, elegir, desplegar).
//
// La zona táctil mide 48 × 48 aunque el marco sea de 40 (design system).
//
// El diálogo va en un portal a <body>: así no hereda estilos de la fila (el verde de una fila
// elegida, el tamaño de letra) y la lista no cambia por tenerlo dentro.
//
// Props: nombre, presetId, grupoMuscular y tipo del ejercicio; opciones (las del servidor, para
// escribir "Máquinas" con tilde; si no han llegado, el valor guardado); tam: 40 o 48.
export default function PictogramaEjercicio({ nombre, presetId, grupoMuscular, tipo, opciones, tam = 40 }) {
  const id = elegirPictograma({ presetId, grupoMuscular });
  const vista = useVistaAmpliada();
  const texto = (lista, valor) => (valor && opciones ? etiquetaDe(lista(opciones), valor) : valor);
  const grupo = texto((o) => o.gruposMusculares, grupoMuscular);
  const tipoTexto = texto((o) => o.tipos, tipo);

  return (
    <>
      <button
        ref={vista.origen}
        type="button"
        className={styles.zona}
        onClick={vista.abrir}
        aria-label={`Ver «${nombre}» en grande`}
        aria-haspopup="dialog"
      >
        <Pictograma id={id} tam={tam} />
      </button>

      {vista.abierta &&
        createPortal(
          // Escape lanza "cancel": se cancela el cierre brusco y se cierra con animación. Un toque
          // fuera de la tarjeta llega al propio <dialog>, que ocupa toda la pantalla.
          <dialog
            ref={vista.dialogo}
            className={styles.dialogo}
            aria-labelledby="vista-pictograma-nombre"
            onCancel={(e) => {
              e.preventDefault();
              vista.cerrar();
            }}
            onClick={(e) => {
              if (e.target === vista.dialogo.current) vista.cerrar();
            }}
          >
            <div ref={vista.tarjeta} className={styles.tarjeta}>
              <BotonIcono icono="cerrar" etiqueta="Cerrar" variante="sinFondo" className={styles.cerrar} onClick={vista.cerrar} />
              <Pictograma id={id} tam="var(--tam-ampliado)" etiqueta={nombre} className={styles.marcoGrande} marcoRef={vista.marcoGrande} />
              <h2 id="vista-pictograma-nombre" className={styles.nombre}>{nombre}</h2>
              {(grupo || tipoTexto) && (
                <p className={styles.chips}>
                  {grupo && <span className={styles.chip}>{grupo}</span>}
                  {/* Como en NombreEjercicio: si el tipo dice lo mismo que el grupo, una vez. */}
                  {tipoTexto && tipoTexto !== grupo && <span className={styles.chip}>{tipoTexto}</span>}
                </p>
              )}
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
