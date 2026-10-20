// Registro de los datos oficiales que usan las calculadoras: valor (leído de params-2026.js
// para que nunca se desincronice), fuente y fecha. Alimenta el panel de la portada y la
// página de metodología.
import { SS, SMI, PARO, PENSIONES, HIPOTECA, AUTONOMOS, IRPF, SALARIOS_INE } from './static/js/calc/params-2026.js';

const fmt = (n, d = 2) => new Intl.NumberFormat('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }).format(n);
const pctSinCeros = (n) => `${fmt(n * 100, Number.isInteger(Math.round(n * 1e4) / 100) ? 0 : 2).replace(/,?0+$/, '')} %`;

export const ENLACES = {
  ordenCotizacion: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-7296',
  lirpf: 'https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764',
  rirpf: 'https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820',
  et: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430',
  lgss: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724',
  ley21_2021: 'https://www.boe.es/buscar/act.php?id=BOE-A-2021-21652',
  bde: 'https://www.bde.es/',
  ine: 'https://www.ine.es/',
  sepe: 'https://www.sepe.es/',
  aeat: 'https://sede.agenciatributaria.gob.es/',
};

export const DATOS = [
  { id: 'smi', dato: 'Salario mínimo 2026', valor: `${fmt(SMI.mensual14, 0)} € al mes`, detalle: `${fmt(SMI.anual, 0)} € al año en 14 pagas`, fuente: 'Real Decreto 126/2026', fecha: '2026-02-19', portada: true },
  { id: 'base-max', dato: 'Base máxima de cotización', valor: `${fmt(SS.baseMaxMensual)} € al mes`, detalle: 'Tope de lo que se cotiza a la Seguridad Social', fuente: 'Orden PJC/297/2026', enlace: ENLACES.ordenCotizacion, fecha: '2026-03-31', portada: true },
  { id: 'cotizacion', dato: 'Cotización del trabajador', valor: '6,50 %', detalle: 'Contrato indefinido (6,55 % temporal), MEI incluido', fuente: 'Orden PJC/297/2026', enlace: ENLACES.ordenCotizacion, fecha: '2026-03-31' },
  { id: 'mei', dato: 'MEI 2026', valor: pctSinCeros(SS.trabajador.mei * 6), detalle: `De ellos, ${fmt(SS.trabajador.mei * 100)} % a cargo del trabajador`, fuente: 'Orden PJC/297/2026', enlace: ENLACES.ordenCotizacion, fecha: '2026-03-31' },
  { id: 'limite-retencion', dato: 'Sueldo sin retención de IRPF', valor: `${fmt(IRPF.limiteExcluyente[3][0], 0)} €`, detalle: 'Soltero/a sin hijos, un solo pagador', fuente: 'Real Decreto 142/2024 (Reglamento del IRPF, art. 81)', enlace: ENLACES.rirpf, fecha: '2024' },
  { id: 'deduccion-smi', dato: 'Deducción para sueldos bajos', valor: `${fmt(IRPF.deduccionSMI.maximo)} €`, detalle: `Hasta ${fmt(IRPF.deduccionSMI.limite)} € de rendimientos del trabajo`, fuente: 'Real Decreto-ley 5/2026', fecha: '2026-02-19' },
  { id: 'iprem', dato: 'IPREM 2026', valor: `${fmt(PARO.iprem, 0)} € al mes`, detalle: 'Referencia de los mínimos y máximos del paro', fuente: 'SEPE (sin cambios desde 2023)', enlace: ENLACES.sepe, fecha: '2026-01-01' },
  { id: 'paro-max', dato: 'Paro máximo sin hijos', valor: `${fmt(PARO.iprem * 7 / 6 * PARO.maximo.sinHijos, 0)} € al mes`, detalle: '175 % del IPREM con pagas extra', fuente: 'SEPE', enlace: ENLACES.sepe, fecha: '2026-01-01', portada: true },
  { id: 'euribor', dato: 'Euríbor a 12 meses', valor: `${fmt(HIPOTECA.euribor * 100, 3)} %`, detalle: `Media oficial de ${HIPOTECA.euriborMes}`, fuente: 'Banco de España', enlace: ENLACES.bde, fecha: '2026-10-01', portada: true },
  { id: 'tipo-fijo', dato: 'Tipo medio de las hipotecas fijas', valor: `${fmt(HIPOTECA.tipoMedioFijo * 100)} %`, detalle: `Hipotecas firmadas en ${HIPOTECA.mesTiposMedios}`, fuente: 'INE, Estadística de Hipotecas', enlace: ENLACES.ine, fecha: '2026-08-26' },
  { id: 'ipc', dato: 'IPC adelantado de septiembre', valor: `${fmt(PENSIONES.ipc.ultimoDato * 100, 1)} %`, detalle: `Media de dic. 2025 a sept. 2026: ${fmt(PENSIONES.ipc.mediaProvisional * 100)} %`, fuente: 'INE', enlace: ENLACES.ine, fecha: '2026-09-30', portada: true },
  { id: 'pensiones-2027', dato: 'Subida prevista de las pensiones 2027', valor: `${fmt(PENSIONES.estimacion2027 * 100, 1)} %`, detalle: 'Estimación con el IPC publicado y la previsión de Funcas', fuente: 'Cálculo de AlNeto (Ley 21/2021)', enlace: ENLACES.ley21_2021, fecha: '2026-10-08' },
  { id: 'pension-max', dato: 'Pensión máxima 2026', valor: `${fmt(PENSIONES.maxima2026)} € al mes`, detalle: 'En 14 pagas', fuente: 'Real Decreto 39/2026', fecha: '2026-01-21', portada: true },
  { id: 'autonomos-min', dato: 'Cuota mínima de autónomos', valor: `${fmt(AUTONOMOS.tramos[0].min * AUTONOMOS.tipo)} € al mes`, detalle: 'Tramo 1, con el MEI incluido', fuente: 'Orden PJC/297/2026', enlace: ENLACES.ordenCotizacion, fecha: '2026-03-31' },
  { id: 'salario-mediano', dato: 'Salario mediano', valor: `${fmt(SALARIOS_INE.mediana, 0)} € al año`, detalle: `Datos de ${SALARIOS_INE.anio}`, fuente: 'INE, Encuesta Anual de Estructura Salarial', enlace: ENLACES.ine, fecha: '2026-05' },
];

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
// '2024' → '2024' · '2026-05' → 'mayo de 2026' · '2026-02-19' → '19 de febrero de 2026'
export const fechaLarga = (f) => {
  const [a, m, d] = f.split('-');
  if (!m) return a;
  if (!d) return `${MESES[m - 1]} de ${a}`;
  return `${Number(d)} de ${MESES[m - 1]} de ${a}`;
};
