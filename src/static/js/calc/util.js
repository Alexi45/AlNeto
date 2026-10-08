export const redondear = (n, decimales = 2) => {
  const f = 10 ** decimales;
  return Math.round((n + Number.EPSILON) * f) / f;
};

export const limitar = (n, min, max) => Math.min(Math.max(n, min), max);

// Fechas como 'AAAA-MM-DD' interpretadas en UTC para que la zona horaria no mueva días.
export const fecha = (iso) => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d));
};

const DIA = 86400000;

export const diasEntre = (desde, hasta) => Math.round((hasta - desde) / DIA) + 1; // ambos incluidos

export const sumarDias = (f, n) => new Date(f.getTime() + n * DIA);

export const diasDelAnio = (anio) => ((anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0 ? 366 : 365);

export const esUltimoDiaDelMes = (f) => sumarDias(f, 1).getUTCDate() === 1;

// Meses entre dos fechas (ambas incluidas) contando la fracción de mes como mes entero,
// que es como prorratean los tribunales la antigüedad en las indemnizaciones.
export const mesesRedondeadosArriba = (desde, hasta) => {
  if (hasta < desde) return 0;
  const fin = sumarDias(hasta, 1);
  let meses = (fin.getUTCFullYear() - desde.getUTCFullYear()) * 12 + (fin.getUTCMonth() - desde.getUTCMonth());
  if (fin.getUTCDate() < desde.getUTCDate()) meses -= 1;
  const ultimoDia = new Date(Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth() + meses + 1, 0)).getUTCDate();
  const tras = new Date(Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth() + meses, Math.min(desde.getUTCDate(), ultimoDia)));
  return tras < fin ? meses + 1 : meses;
};
