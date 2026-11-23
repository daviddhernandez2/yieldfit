// Cálculo del 1RM estimado (una repetición máxima). Es la ÚNICA copia de la fórmula:
// la usan sessionController.create (al guardar una sesión), el seed y el script de
// migración. Antes vivía en el cliente (utils/performance.js) y se recalculaba sobre
// todo el historial cada vez que se abría el Dashboard (DECISIONS.md, 0026).

// Fórmula de Epley: 1RM ≈ peso × (1 + reps / 30). Es la estándar en apps de fuerza.
// Pierde precisión por encima de ~12 repeticiones; en el rango típico (3-12) es fiable.
export const calcularUnaRM = (peso, reps) => {
  const pesoNum = Number(peso) || 0;
  const repsNum = Number(reps) || 0;
  if (pesoNum <= 0 || repsNum <= 0) return 0;
  return pesoNum * (1 + repsNum / 30);
};

// El mejor 1RM estimado de un conjunto de series (la "mejor serie" del ejercicio en
// esa sesión). Redondeado a 2 decimales: más precisión no aporta nada y ocupa más.
export const mejor1RMDeSets = (sets = []) => {
  let mejor = 0;
  for (const set of sets) {
    mejor = Math.max(mejor, calcularUnaRM(set.peso, set.reps));
  }
  return Math.round(mejor * 100) / 100;
};

// Valor de `mejor1RM` para un ejercicio de sesión. null en los de tiempo/distancia
// (cardio): no tienen 1RM, y null deja claro que "no aplica", no que sea 0 kg.
export const mejor1RMDeEjercicio = ({ trackingSnapshot, sets }) =>
  trackingSnapshot === '1RM' ? mejor1RMDeSets(sets) : null;
