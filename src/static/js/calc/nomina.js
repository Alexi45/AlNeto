import { SS, IRPF, SMI } from './params-2026.js';
import { redondear } from './util.js';

const cuotaEscala = (base) => {
  let cuota = 0;
  let desde = 0;
  for (const { hasta, tipo } of IRPF.escala) {
    if (base <= desde) break;
    cuota += (Math.min(base, hasta) - desde) * tipo;
    desde = hasta;
  }
  return cuota;
};

export const reduccionRendimientosTrabajo = (rendimientoNeto) => {
  const { maximo, tramo1, tramo2, tramo3, base2 } = IRPF.reduccionTrabajo;
  if (rendimientoNeto <= tramo1) return maximo;
  if (rendimientoNeto <= tramo2) return maximo - 1.75 * (rendimientoNeto - tramo1);
  if (rendimientoNeto <= tramo3) return base2 - 1.14 * (rendimientoNeto - tramo2);
  return 0;
};

export const cotizacionMensual = (brutoMensualProrrateado, contrato = 'indefinido') => {
  const t = SS.trabajador;
  const tipo = t.contingenciasComunes + t.formacion + t.mei
    + (contrato === 'temporal' ? t.desempleoTemporal : t.desempleoIndefinido);
  const base = Math.min(brutoMensualProrrateado, SS.baseMaxMensual);
  const solidaridad = SS.solidaridad.reduce((acc, { desde, hasta, tipo: ts }) =>
    acc + Math.max(0, Math.min(brutoMensualProrrateado, hasta) - desde) * ts, 0);
  return { ordinaria: redondear(base * tipo), solidaridad: redondear(solidaridad), tipo, base };
};

export const minimoPersonalFamiliar = ({ edad = 'menos65', hijos = 0, hijosMenores3 = 0, hijosPorEntero = false }) => {
  let personal = IRPF.minimoContribuyente;
  if (edad !== 'menos65') personal += IRPF.incrementoMayor65;
  if (edad === '75omas') personal += IRPF.incrementoMayor75;

  let descendientes = 0;
  for (let i = 0; i < hijos; i++) descendientes += IRPF.minimoDescendientes[Math.min(i, 3)];
  descendientes += Math.min(hijosMenores3, hijos) * IRPF.incrementoMenor3;
  if (!hijosPorEntero) descendientes /= 2;

  return personal + descendientes;
};

export const limiteExcluyente = (situacion, hijos) => {
  const fila = IRPF.limiteExcluyente[situacion] ?? IRPF.limiteExcluyente[3];
  return fila[Math.min(hijos, 2)] ?? IRPF.limiteExcluyente[3][Math.min(hijos, 2)];
};

// Tipo de retención según el algoritmo de la AEAT (simplificado: sin discapacidad,
// ascendientes, movilidad geográfica ni pensiones compensatorias).
export const tipoRetencion = ({ brutoAnual, cotizacionAnual, contrato, situacion, hijos, hijosMenores3, edad }) => {
  const R = brutoAnual;
  const limite = limiteExcluyente(situacion, hijos);
  if (R <= limite) return { tipo: 0, motivo: 'exento', limite };

  const rendimientoNeto = R - cotizacionAnual;
  const reduccion = Math.max(0, reduccionRendimientosTrabajo(rendimientoNeto));
  const base = Math.max(0, R - cotizacionAnual - IRPF.otrosGastos - reduccion);
  // Monoparentales y quien tiene al cónyuge a cargo aplican el mínimo por hijos completo.
  const hijosPorEntero = situacion === 1 || situacion === 2;
  const minimo = minimoPersonalFamiliar({ edad, hijos, hijosMenores3, hijosPorEntero });

  let cuota = Math.max(0, cuotaEscala(base) - cuotaEscala(minimo));
  if (R <= IRPF.limite43.hastaRetribucion) cuota = Math.min(cuota, IRPF.limite43.porcentaje * (R - limite));

  let tipo = redondear((cuota / R) * 100);
  let motivo = 'general';
  if (contrato === 'temporal' && tipo < IRPF.tipoMinimoTemporal * 100) {
    tipo = IRPF.tipoMinimoTemporal * 100;
    motivo = 'minimo-temporal';
  }
  return { tipo, motivo, limite, base: redondear(base), reduccion: redondear(reduccion), minimo };
};

export const deduccionSMI = (brutoAnual) => {
  const { maximo, desde, pendiente, limite } = IRPF.deduccionSMI;
  if (brutoAnual >= limite) return 0;
  return redondear(Math.max(0, Math.min(maximo, maximo - pendiente * (brutoAnual - desde))));
};

export function calcularNomina({
  brutoAnual,
  pagas = 14,
  contrato = 'indefinido',
  situacion = 3,
  hijos = 0,
  hijosMenores3 = 0,
  edad = 'menos65',
}) {
  if (situacion === 1 && hijos === 0) situacion = 3;
  const cot = cotizacionMensual(brutoAnual / 12, contrato);
  const ssMensual = redondear(cot.ordinaria + cot.solidaridad);
  const ssAnual = redondear(ssMensual * 12);

  const ret = tipoRetencion({ brutoAnual, cotizacionAnual: ssAnual, contrato, situacion, hijos, hijosMenores3, edad });
  const irpfAnual = redondear(brutoAnual * ret.tipo / 100);
  const netoAnual = redondear(brutoAnual - ssAnual - irpfAnual);

  // La Seguridad Social se cotiza en 12 meses con las pagas prorrateadas: las pagas extra
  // solo llevan retención de IRPF.
  const brutoPaga = brutoAnual / pagas;
  const netoMensual = redondear(brutoPaga - ssMensual - brutoPaga * ret.tipo / 100);
  const netoPagaExtra = pagas === 14 ? redondear(brutoPaga * (1 - ret.tipo / 100)) : null;

  return {
    brutoAnual,
    pagas,
    brutoPaga: redondear(brutoPaga),
    netoMensual,
    netoPagaExtra,
    netoAnual,
    irpf: { tipo: ret.tipo, anual: irpfAnual, motivo: ret.motivo, limiteExcluyente: ret.limite },
    ss: {
      mensual: ssMensual,
      anual: ssAnual,
      tipo: cot.tipo,
      solidaridadMensual: cot.solidaridad,
      topeAlcanzado: brutoAnual / 12 > cot.base,
    },
    deduccionRenta: deduccionSMI(brutoAnual),
    pordebajoSMI: brutoAnual < SMI.anual,
  };
}
