import styles from '@/components/MarcaPR/MarcaPR.module.css';

// Marca de récord personal (bloque 4b, DECISIONS 0051): píldora "PR" en Geist Mono, verde sobre
// verde suave. Está en el design system (artefacto) con las mismas medidas.
//
// Solo presenta: quién es récord lo decide el servidor (esPR, tienePR).
//
// Props:
//   - tamano: "sm" (por defecto; filas, títulos, avisos) o "xs" (celdas del calendario).
//   - etiqueta: lo que oye un lector de pantalla y sale al pasar el ratón. "PR" a secas se
//     leería "pe erre"; por defecto, "Récord personal".
export default function MarcaPR({ tamano = 'sm', etiqueta = 'Récord personal' }) {
  return (
    <span className={`${styles.marca} ${styles[tamano]}`} role="img" aria-label={etiqueta} title={etiqueta}>
      PR
    </span>
  );
}
