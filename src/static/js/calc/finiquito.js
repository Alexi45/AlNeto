import {
  redondear, fecha, diasEntre, diasDelAnio, esUltimoDiaDelMes, mesesRedondeadosArriba, sumarDias,
} from './util.js';

export const MOTIVOS = {
  voluntaria: { nombre: 'Baja voluntaria', diasPorAnio: 0 },
  'fin-temporal': { nombre: 'Fin de contrato temporal', diasPorAnio: 12 },
  objetivo: { nombre: 'Despido objetivo o ERE', diasPorAnio: 20, topeDias: 360 },
  improcedente: { nombre: 'Despido improcedente', diasPorAnio: 33, topeDias: 720 },
  disciplinario: { nombre: 'Despido disciplinario procedente', diasPorAnio: 0 },
};

const REFORMA_2012 = fecha('2012-02-12');

const posterior = (a, b) => (a > b ? a : b);

// Parte devengada de una paga extra entre `inicioDevengo` y la fecha de baja.
const devengado = (importePaga, inicioDevengo, finDevengo, inicioContrato, baja) => {
  const desde = posterior(inicioDevengo, inicioContrato);
  if (desde > baja) return { dias: 0, importe: 0 };
  const dias = diasEntre(desde, baja);
  const diasPeriodo = diasEntre(inicioDevengo, finDevengo);
  return { dias, importe: importePaga * dias / diasPeriodo };
};

export const pagasExtraPendientes = ({ brutoAnual, devengo, inicio, baja }) => {
  const paga = brutoAnual / 14;
  const anio = baja.getUTCFullYear();
  const primerSemestre = baja.getUTCMonth() < 6;
  const f = (m, d, a = anio) => new Date(Date.UTC(a, m - 1, d));
  const lineas = [];

  if (devengo === 'semestral') {
    if (primerSemestre) lineas.push({ nombre: 'Paga de verano', ...devengado(paga, f(1, 1), f(6, 30), inicio, baja) });
    else lineas.push({ nombre: 'Paga de Navidad', ...devengado(paga, f(7, 1), f(12, 31), inicio, baja) });
  } else {
    const inicioVerano = primerSemestre ? f(7, 1, anio - 1) : f(7, 1);
    const finVerano = primerSemestre ? f(6, 30) : f(6, 30, anio + 1);
    lineas.push({ nombre: 'Paga de verano', ...devengado(paga, inicioVerano, finVerano, inicio, baja) });
    lineas.push({ nombre: 'Paga de Navidad', ...devengado(paga, f(1, 1), f(12, 31), inicio, baja) });
  }
  return lineas.map((l) => ({ ...l, importe: redondear(l.importe) }));
};

export const indemnizacion = ({ motivo, inicio, baja, salarioDia }) => {
  const m = MOTIVOS[motivo];
  const mesesTotales = mesesRedondeadosArriba(inicio, baja);
  if (!m || m.diasPorAnio === 0) return { dias: 0, importe: 0, meses: mesesTotales, tope: false };

  let dias;
  let tope = false;
  if (motivo === 'improcedente' && inicio < REFORMA_2012) {
    // Contratos anteriores al 12/02/2012: 45 días por año hasta esa fecha y 33 después.
    const finTramoAntiguo = baja < REFORMA_2012 ? baja : sumarDias(REFORMA_2012, -1);
    const diasAntes = 45 * mesesRedondeadosArriba(inicio, finTramoAntiguo) / 12;
    const diasDespues = baja >= REFORMA_2012 ? 33 * mesesRedondeadosArriba(REFORMA_2012, baja) / 12 : 0;
    if (diasAntes > 720) {
      dias = Math.min(diasAntes, 1260);
      tope = diasAntes > 1260 || diasDespues > 0;
    } else {
      dias = Math.min(diasAntes + diasDespues, 720);
      tope = diasAntes + diasDespues > 720;
    }
  } else {
    dias = m.diasPorAnio * mesesTotales / 12;
    if (m.topeDias && dias > m.topeDias) {
      dias = m.topeDias;
      tope = true;
    }
  }
  return { dias: redondear(dias), importe: redondear(dias * salarioDia), meses: mesesTotales, tope };
};

export function calcularFiniquito({
  brutoAnual,
  pagas = 14,
  devengo = 'semestral',
  fechaInicio,
  fechaBaja,
  vacacionesAnuales = 30,
  vacacionesDisfrutadas = 0,
  motivo = 'voluntaria',
}) {
  const inicio = fecha(fechaInicio);
  const baja = fecha(fechaBaja);
  if (baja < inicio) throw new Error('La fecha de baja no puede ser anterior a la de inicio.');

  const salarioDia = brutoAnual / 365;
  const salarioMes = brutoAnual / pagas;
  const anio = baja.getUTCFullYear();
  const inicioMes = new Date(Date.UTC(anio, baja.getUTCMonth(), 1));

  // Días del mes de la baja aún sin cobrar (mes comercial de 30 días).
  let diasMes;
  if (inicio > inicioMes) diasMes = Math.min(diasEntre(inicio, baja), 30);
  else diasMes = esUltimoDiaDelMes(baja) ? 30 : Math.min(baja.getUTCDate(), 30);
  const salarioPendiente = redondear(salarioMes / 30 * diasMes);

  const inicioAnio = new Date(Date.UTC(anio, 0, 1));
  const diasTrabajadosAnio = diasEntre(posterior(inicioAnio, inicio), baja);
  const vacacionesGeneradas = redondear(vacacionesAnuales * diasTrabajadosAnio / diasDelAnio(anio));
  const vacacionesPendientes = redondear(vacacionesGeneradas - vacacionesDisfrutadas);
  const importeVacaciones = redondear(vacacionesPendientes * salarioDia);

  const extras = pagas === 14 ? pagasExtraPendientes({ brutoAnual, devengo, inicio, baja }) : [];
  const totalExtras = redondear(extras.reduce((s, l) => s + l.importe, 0));

  const totalFiniquito = redondear(salarioPendiente + importeVacaciones + totalExtras);
  const indem = indemnizacion({ motivo, inicio, baja, salarioDia });

  return {
    salarioDia: redondear(salarioDia),
    salarioPendiente: { dias: diasMes, importe: salarioPendiente },
    vacaciones: { generadas: vacacionesGeneradas, pendientes: vacacionesPendientes, importe: importeVacaciones },
    pagasExtra: extras,
    totalExtras,
    totalFiniquito,
    indemnizacion: { ...indem, motivo: MOTIVOS[motivo].nombre },
    total: redondear(totalFiniquito + indem.importe),
  };
}
