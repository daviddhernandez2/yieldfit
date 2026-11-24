// Formato de cifras en español (coma decimal), compartido por las tarjetas de progreso y las
// métricas del Dashboard (bloque 9c). Funciones puras: prueba en formato.test.js.

// Número con un decimal y signo + si es positivo: 3.14 → "+3,1"; -2 → "-2"; 0 → "0".
export const formatConSigno = (n) => {
  const redondeado = Number(n.toFixed(1));
  const signo = redondeado > 0 ? '+' : '';
  return `${signo}${redondeado.toString().replace('.', ',')}`;
};

// Porcentaje con signo: 3.14 → "+3,1%".
export const formatPorcentaje = (n) => `${formatConSigno(n)}%`;
