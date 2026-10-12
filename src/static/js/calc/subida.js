import { calcularNomina } from './nomina.js';
import { redondear } from './util.js';

// Cuánto de una subida de sueldo bruta llega de verdad a tu cuenta.
export function compararSueldos(brutoActual, brutoNuevo, opciones = {}) {
  const antes = calcularNomina({ ...opciones, brutoAnual: brutoActual });
  const despues = calcularNomina({ ...opciones, brutoAnual: brutoNuevo });
  const subidaBruta = brutoNuevo - brutoActual;
  const subidaNeta = despues.netoAnual - antes.netoAnual;
  return {
    antes,
    despues,
    subidaBruta: redondear(subidaBruta),
    subidaNetaAnual: redondear(subidaNeta),
    subidaNetaMensual: redondear(despues.netoMensual - antes.netoMensual),
    // Parte de cada euro de subida que llega al bolsillo (el resto se va en IRPF y cotizaciones)
    aprovechamiento: subidaBruta > 0 ? subidaNeta / subidaBruta : 0,
  };
}
