// Convierte el filtro de fechas de un formulario (días "AAAA-MM-DD" de un <input type="date">)
// en los instantes que espera el servidor, en la zona horaria del dispositivo:
//   - desde: el inicio de ese día (incluido);
//   - hasta: el inicio del día SIGUIENTE (excluido), para que el último día cuente entero.
// Se calcula aquí y no en el servidor porque el servidor no sabe en qué zona está el usuario
// (está en Frankfurt y guarda en UTC). Días vacíos → undefined (sin límite).
//
// new Date('AAAA-MM-DDT00:00:00') sin zona se interpreta en la hora local, y setDate suma un
// día de calendario: funciona igual los días de cambio de hora.
export const limitesDias = (desde, hasta) => {
  const inicio = (dia) => new Date(`${dia}T00:00:00`);
  let fin;
  if (hasta) {
    fin = inicio(hasta);
    fin.setDate(fin.getDate() + 1);
  }
  return {
    desde: desde ? inicio(desde).toISOString() : undefined,
    hasta: fin ? fin.toISOString() : undefined,
  };
};
