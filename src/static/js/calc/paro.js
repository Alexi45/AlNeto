import { PARO, SS } from './params-2026.js';
import { redondear, limitar } from './util.js';

const IPREM_CON_PAGAS = PARO.iprem * 7 / 6;

export const topesParo = (hijos) => ({
  minimo: redondear(IPREM_CON_PAGAS * (hijos > 0 ? PARO.minimo.conHijos : PARO.minimo.sinHijos)),
  maximo: redondear(IPREM_CON_PAGAS * (hijos === 0 ? PARO.maximo.sinHijos : hijos === 1 ? PARO.maximo.unHijo : PARO.maximo.dosOMas)),
});

export const diasDePrestacion = (diasCotizados) => {
  let dias = 0;
  for (const [cotizados, prestacion] of PARO.duracion) if (diasCotizados >= cotizados) dias = prestacion;
  return dias;
};

export function calcularParo({ brutoAnual, mesesCotizados, hijos = 0 }) {
  // Base reguladora: media de las bases de cotización de los últimos 180 días,
  // que incluyen la prorrata de pagas extra y tienen el mismo tope que la nómina.
  const baseReguladora = redondear(Math.min(brutoAnual / 12, SS.baseMaxMensual));
  const diasCotizados = Math.min(mesesCotizados, 72) * 30;
  const dias = diasDePrestacion(diasCotizados);
  const { minimo, maximo } = topesParo(hijos);

  const tramo = (porcentaje) => {
    const teorico = baseReguladora * porcentaje;
    const importe = redondear(limitar(teorico, minimo, maximo));
    const cotizacion = redondear(baseReguladora * PARO.cotizacionTrabajador);
    return {
      bruto: importe,
      cotizacion,
      neto: redondear(importe - cotizacion),
      ajuste: teorico > maximo ? 'maximo' : teorico < minimo ? 'minimo' : null,
    };
  };

  const primeros = tramo(PARO.porcentajes.hasta180);
  const despues = tramo(PARO.porcentajes.desde181);
  const diasPrimerTramo = Math.min(dias, 180);
  const diasSegundoTramo = Math.max(dias - 180, 0);

  return {
    tieneDerecho: dias > 0,
    diasCotizados,
    dias,
    meses: dias / 30,
    baseReguladora,
    minimo,
    maximo,
    primeros180: primeros,
    desde181: diasSegundoTramo > 0 ? despues : null,
    totalBruto: redondear(primeros.bruto * diasPrimerTramo / 30 + despues.bruto * diasSegundoTramo / 30),
  };
}
