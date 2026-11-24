import { useEffect, useState } from 'react';
import { getProgress } from '@/api/progress.js';
import Metrica from '@/components/Metrica/Metrica.jsx';
import Esqueleto, { ZonaCarga } from '@/components/Esqueleto/Esqueleto.jsx';
import { formatConSigno } from '@/utils/formato.js';
import styles from '@/pages/Dashboard/Dashboard.module.css';

// Fila de resumen del Dashboard (bloque 9c, DECISIONS 0047): dos métricas de TODO el
// historial, con datos que el servidor ya calcula para el grupo "Todos" (GET /api/progress sin
// fechas). No hay cálculo nuevo: solo se presentan.
//   - Progreso total: el % de "Todos" desde el principio, con su línea como sparkline.
//   - Sesiones en total: cuántas sesiones entran en ese cálculo.
// Siempre el historial completo, sin depender del rango elegido en la tarjeta "Todos".
// Si la petición falla no se enseña nada: las tarjetas de abajo ya muestran su propio error.
export default function ResumenProgreso() {
  const [progreso, setProgreso] = useState(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let montado = true;
    getProgress()
      .then((res) => montado && setProgreso(res.data.progreso))
      .catch(() => montado && setFallo(true));
    return () => {
      montado = false;
    };
  }, []);

  if (fallo) return null;

  if (!progreso) {
    return (
      <ZonaCarga etiqueta="Cargando el resumen" className={styles.resumen}>
        <Esqueleto forma="bloque" alto="140px" />
        <Esqueleto forma="bloque" alto="140px" />
      </ZonaCarga>
    );
  }

  // Sin sesiones suficientes para comparar, el servidor devuelve porcentaje null.
  const hayPorcentaje = progreso.porcentaje !== null;

  return (
    <section className={styles.resumen} aria-label="Resumen de tu progreso">
      <Metrica
        etiqueta="Progreso total"
        valor={hayPorcentaje ? formatConSigno(progreso.porcentaje) : '—'}
        unidad={hayPorcentaje ? '%' : undefined}
        serie={progreso.serie.map((punto) => punto.indice)}
      />
      <Metrica etiqueta="Sesiones en total" valor={String(progreso.sesiones)} />
    </section>
  );
}
