import { useEffect, useId, useRef, useState } from 'react';
import styles from '@/components/MenuOpciones/MenuOpciones.module.css';

// Menú pequeño para elegir una opción de una lista corta (bloque 9d): un botón con el valor
// actual ("1 año ▾") que abre debajo la lista. Lo usa el rango de los grupos del Dashboard,
// que se puede cambiar sin entrar en el modo edición (es una forma de mirar).
//
// Se cierra al elegir, al tocar fuera y con Escape (el foco vuelve al botón). Patrón de
// "disclosure": botón con aria-expanded y una lista de botones; la opción actual lleva
// aria-current y una marca ✓.
//
// Props:
//   - texto: lo que se ve en el botón (el valor actual, p. ej. "1 año").
//   - etiqueta: texto accesible del botón (p. ej. "Rango de Empuje: 1 año").
//   - opciones: [{ valor, texto }]. valor: el actual. onElegir(valor).
//   - alinear: "inicio" (por defecto) o "fin": hacia qué lado se abre la lista.
export default function MenuOpciones({ texto, etiqueta, opciones, valor, onElegir, alinear = 'inicio' }) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef(null);
  const boton = useRef(null);
  const idLista = useId();

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => {
      if (!raiz.current?.contains(e.target)) setAbierto(false);
    };
    const tecla = (e) => {
      if (e.key === 'Escape') {
        setAbierto(false);
        boton.current?.focus();
      }
    };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  const elegir = (v) => {
    setAbierto(false);
    boton.current?.focus();
    if (v !== valor) onElegir(v);
  };

  return (
    // data-abierto: el widget que lo contiene se pone por encima de los demás mientras está
    // abierto (si no, la lista quedaría debajo del widget siguiente).
    <div className={styles.menu} ref={raiz} data-menu-abierto={abierto || undefined}>
      <button
        ref={boton}
        type="button"
        className={styles.boton}
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        aria-controls={idLista}
        aria-label={etiqueta}
      >
        {texto}
        <svg className={styles.flecha} viewBox="0 0 12 12" aria-hidden="true">
          <path d="M3 4.5 6 7.5 9 4.5" />
        </svg>
      </button>
      {abierto && (
        <ul id={idLista} className={`${styles.lista} ${alinear === 'fin' ? styles.fin : ''}`}>
          {opciones.map((o) => (
            <li key={o.valor}>
              <button
                type="button"
                className={styles.opcion}
                onClick={() => elegir(o.valor)}
                aria-current={o.valor === valor ? 'true' : undefined}
              >
                <span>{o.texto}</span>
                {o.valor === valor && (
                  <svg className={styles.marca} viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M2.5 6.5 5 9l4.5-6" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
