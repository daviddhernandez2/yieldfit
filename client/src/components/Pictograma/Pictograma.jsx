import { trazosDe } from '@compartido/trazosPictograma.js';
import styles from '@/components/Pictograma/Pictograma.module.css';

// Figura de un ejercicio o icono de rutina (bloque 10, tarjeta Pictograma del design system).
// Se dibuja como SVG en línea a partir de los datos de compartido/pictogramas.js: sin archivos de
// imagen, y con los colores de los tokens (--color-pictograma-*, --color-accent), nunca fijos.
//
// Solo presenta: QUÉ figura toca (preset, grupo o nada) lo decide elegirPictograma, en
// compartido/trazosPictograma.js. Con id null pinta el marco vacío del mismo tamaño, para que una
// lista no se desalinee (sesión antigua sin datos, rutina sin icono).
//
// Props:
//   - id: id de la figura (o null).
//   - tam: lado del marco en px (32, 40, 48, 64 o 240 en el diseño). La figura ocupa el 90 %.
//   - etiqueta: lo que lee un lector de pantalla (el nombre del ejercicio). Sin etiqueta, la
//     figura es decorativa (aria-hidden): úsalo así cuando el nombre ya está escrito al lado o
//     cuando la envuelve un botón con su propio aria-label.
//   - className: para ajustes del contenedor (p. ej. el marco de la vista ampliada).
export default function Pictograma({ id, tam = 40, etiqueta, className = '' }) {
  const t = id ? trazosDe(id) : null;
  // Radios concéntricos del diseño: xs en el más pequeño, md en el grande, sm en el resto.
  const radio = tam <= 32 ? styles.radioXs : tam >= 120 ? styles.radioMd : styles.radioSm;
  const accesible = etiqueta ? { role: 'img', 'aria-label': etiqueta } : { 'aria-hidden': true };

  return (
    <span className={`${styles.marco} ${radio} ${className}`} style={{ '--tam': `${tam}px` }} {...(t ? {} : { 'aria-hidden': true })}>
      {t && (
        <svg className={styles.figura} viewBox="0 0 120 120" fill="none" strokeLinecap="round" strokeLinejoin="round" {...accesible}>
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
      )}
    </span>
  );
}
