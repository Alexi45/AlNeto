import { AUTONOMOS, SS } from './params-2026.js';
import { redondear } from './util.js';

export const tramoAutonomo = (rendimientoMensual) => {
  const i = AUTONOMOS.tramos.findIndex((t) => (t.exclusivo ? rendimientoMensual < t.hasta : rendimientoMensual <= t.hasta));
  return { numero: i + 1, ...AUTONOMOS.tramos[i] };
};

// Cuota mensual de autónomos por ingresos reales. `rendimientoAnual` = ingresos − gastos
// deducibles, SIN restar la propia cuota de autónomos (la ley la vuelve a sumar).
export function calcularAutonomo({ rendimientoAnual, societario = false, primerAnio = false }) {
  const deduccion = societario ? AUTONOMOS.deduccionGastosGenericos.societario : AUTONOMOS.deduccionGastosGenericos.personaFisica;
  const computable = Math.max(rendimientoAnual, 0) * (1 - deduccion);
  const mensual = computable / 12;
  const tramo = tramoAutonomo(mensual);

  let baseMinima = tramo.min;
  if (societario) baseMinima = Math.max(baseMinima, AUTONOMOS.baseMinimaSocietario);
  const baseMaxima = Math.min(tramo.max, SS.baseMaxMensual);

  const cuotaMinima = redondear(baseMinima * AUTONOMOS.tipo);
  const tarifaPlana = primerAnio && !societario;
  // La cuota reducida de 80 € lleva además el MEI; lo estimamos sobre la base mínima general.
  const cuotaTarifaPlana = redondear(AUTONOMOS.tarifaPlana + AUTONOMOS.tramos[4].min * AUTONOMOS.mei);

  return {
    rendimientoComputableMensual: redondear(mensual),
    tramo: tramo.numero,
    baseMinima: redondear(baseMinima),
    baseMaxima: redondear(baseMaxima),
    cuotaMinima,
    cuotaMaxima: redondear(baseMaxima * AUTONOMOS.tipo),
    cuota: tarifaPlana ? cuotaTarifaPlana : cuotaMinima,
    tarifaPlana,
    cuotaAnual: redondear((tarifaPlana ? cuotaTarifaPlana : cuotaMinima) * 12),
  };
}
