import { useId, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatPorcentaje } from '@/utils/formato.js';
import styles from '@/components/GraficaProgreso/GraficaProgreso.module.css';

// Línea del progreso de un grupo (índice base 100, bloque 4): la del grupo de progreso, sacada
// de GrupoProgreso en el bloque 9d para que la usen los widgets del Dashboard. Ocupa todo el
// alto de su contenedor (que tiene que tener alto), así encaja en las filas fijas de la retícula.
//
// Props:
//   - serie: [{ fecha, indice }] tal como la devuelve GET /api/progress.
//   - conEjes: muestra el eje de fechas (en los widgets grandes). Sin él, solo la línea y el
//     tooltip, para los medianos.

// Con más de un año, mes y año ("abr 2017"); con menos, día y mes ("11 oct").
const UN_ANIO_MS = 365 * 24 * 60 * 60 * 1000;
const FORMATO_CORTO = { day: 'numeric', month: 'short' };
const FORMATO_LARGO = { month: 'short', year: 'numeric' };
const FORMATO_COMPLETO = { day: 'numeric', month: 'short', year: 'numeric' };

export default function GraficaProgreso({ serie, conEjes = false }) {
  // Id único del degradado SVG: con varias gráficas en la página no pueden repetirse.
  const idDegradado = `degradado-${useId().replace(/:/g, '')}`;

  const datos = useMemo(() => {
    const abarca = serie.length > 1 ? new Date(serie.at(-1).fecha) - new Date(serie[0].fecha) : 0;
    const formato = abarca > UN_ANIO_MS ? FORMATO_LARGO : FORMATO_CORTO;
    return serie.map((punto) => {
      const fecha = new Date(punto.fecha);
      return {
        indice: punto.indice,
        etiqueta: fecha.toLocaleDateString('es-ES', formato),
        fechaCompleta: fecha.toLocaleDateString('es-ES', FORMATO_COMPLETO),
      };
    });
  }, [serie]);

  return (
    <div className={styles.grafica}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={idDegradado} x1="0" y1="0" x2="0" y2="1">
              {/* Área del color de la línea, del 22 % al 0 % (design system, bloque 9c). */}
              <stop offset="0%" stopColor="var(--chart-gain)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--chart-gain)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="etiqueta" hide={!conEjes} stroke="var(--chart-neutral)" fontSize={11} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
          <Tooltip
            // Colores y superficies desde los tokens (bloque 9c): Recharts acepta variables CSS.
            contentStyle={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text)',
            }}
            formatter={(value) => [formatPorcentaje(value - 100), 'Progreso']}
            labelFormatter={(etiqueta, payload) => payload?.[0]?.payload.fechaCompleta ?? etiqueta}
            labelStyle={{ color: 'var(--color-text-muted)' }}
          />
          <Area
            type="monotone"
            dataKey="indice"
            stroke="var(--chart-gain)"
            strokeWidth={1.5}
            fill={`url(#${idDegradado})`}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--chart-gain)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
