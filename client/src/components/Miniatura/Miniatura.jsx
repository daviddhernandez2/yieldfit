import { trazosDe } from '@compartido/trazosPictograma.js';
import Icono from '@/components/Icono/Icono.jsx';
import styles from '@/components/Miniatura/Miniatura.module.css';

// Miniatura: el marco donde vive el pictograma de un ejercicio o el icono de una rutina (bloque 10,
// tarjeta Miniatura del design system). El pictograma se dibuja como SVG en línea a partir de los
// datos de compartido/pictogramas.js: sin archivos de imagen, y con los colores de los tokens
// (--color-pictograma-*, --color-accent), nunca fijos.
//
// Reglas del design system (regla de dos familias):
//   - tamaños cerrados: 32, 40, 48 y "ampliada" (280 en el móvil, 240 en escritorio);
//   - radio radius-sm siempre (regla concéntrica: tarjeta radius-lg 24 − relleno 16 = 8);
//   - la figura ocupa siempre el 90 %;
//   - un pictograma nunca va suelto, siempre en una Miniatura, y una Miniatura muestra una sola
//     familia: su figura o, sin figura, el estado vacío (el icono "entrenar" del menú, en gris,
//     al 50 %). Nunca un icono encima de una figura.
//
// Solo presenta: QUÉ figura toca lo deciden elegirPictograma y pictogramaDeRutina (compartido/).
//
// Props:
//   - id: id de la figura, o null → estado vacío (rutina sin icono, sesión antigua).
//   - tam: 32, 40, 48 o 'ampliada'.
//   - etiqueta: lo que lee un lector de pantalla. Sin ella es decorativa (aria-hidden): úsalo así
//     cuando el nombre ya está escrito al lado o la envuelve un botón con su aria-label.
//   - discontinua: borde discontinuo, solo en la opción "Sin icono" del selector.
//   - className: ajustes del contenedor (p. ej. el fondo dentro de un diálogo).
//   - marcoRef: ref al marco, para medirlo y animarlo (vista ampliada, useVistaAmpliada).
const TAMANOS = { 32: styles.t32, 40: styles.t40, 48: styles.t48, ampliada: styles.ampliada };

export default function Miniatura({ id, tam = 40, etiqueta, discontinua = false, className = '', marcoRef }) {
  const t = id ? trazosDe(id) : null;
  const clases = [styles.miniatura, TAMANOS[tam] ?? styles.t40, t ? '' : styles.vacia, discontinua ? styles.discontinua : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <span ref={marcoRef} className={clases} {...(t && etiqueta ? {} : { 'aria-hidden': true })}>
      {t ? (
        <svg
          className={styles.figura}
          viewBox="0 0 120 120"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          {...(etiqueta ? { role: 'img', 'aria-label': etiqueta } : { 'aria-hidden': true })}
        >
          {/* Orden de dibujo de los datos: material, torsos, cuerpo, lo que trabaja, rellenos,
              discos (delante del cuerpo) y la cabeza. Las capas vacías no se pintan. */}
          {t.equipo && <path d={t.equipo} className={styles.equipo} strokeWidth="3" />}
          {t.equipoGrueso && <path d={t.equipoGrueso} className={styles.equipo} strokeWidth="5" />}
          {t.cables && <path d={t.cables} className={styles.cable} strokeWidth="1.5" />}
          {t.torsoGris && <path d={t.torsoGris} className={styles.cuerpo} strokeWidth="18" />}
          {t.torsoVerde && <path d={t.torsoVerde} className={styles.trabaja} strokeWidth="18" />}
          {t.cuerpo && <path d={t.cuerpo} className={styles.cuerpo} strokeWidth="8" />}
          {t.trabaja && <path d={t.trabaja} className={styles.trabaja} strokeWidth="8" />}
          {t.relleno && <path d={t.relleno} className={styles.relleno} strokeWidth="2" />}
          {t.discos && <path d={t.discos} className={styles.disco} strokeWidth="2" />}
          <circle cx={t.cabeza[0]} cy={t.cabeza[1]} r="6.5" className={styles.cabeza} />
        </svg>
      ) : (
        <Icono nombre="entrenar" className={styles.iconoVacio} />
      )}
    </span>
  );
}
