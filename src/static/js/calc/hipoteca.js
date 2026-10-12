import { HIPOTECA } from './params-2026.js';
import { redondear } from './util.js';

// Cuota del sistema francés (cuota constante), el que usan casi todas las hipotecas.
export const cuotaFrancesa = (capital, tipoAnual, anios) => {
  const n = anios * 12;
  const r = tipoAnual / 12;
  if (capital <= 0) return 0;
  return r === 0 ? capital / n : (capital * r) / (1 - (1 + r) ** -n);
};

// Capital que se puede devolver con una cuota dada (la operación inversa).
export const capitalParaCuota = (cuota, tipoAnual, anios) => {
  const n = anios * 12;
  const r = tipoAnual / 12;
  return r === 0 ? cuota * n : (cuota * (1 - (1 + r) ** -n)) / r;
};

export const tablaAmortizacion = (capital, tipoAnual, anios) => {
  const cuota = cuotaFrancesa(capital, tipoAnual, anios);
  const r = tipoAnual / 12;
  let pendiente = capital;
  const filas = [];
  for (let anio = 1; anio <= anios; anio++) {
    let intereses = 0;
    let amortizado = 0;
    for (let m = 0; m < 12; m++) {
      const i = pendiente * r;
      intereses += i;
      amortizado += cuota - i;
      pendiente -= cuota - i;
    }
    filas.push({ anio, intereses: redondear(intereses), amortizado: redondear(amortizado), pendiente: redondear(Math.max(pendiente, 0)) });
  }
  return filas;
};

export function calcularHipoteca({ precio, ahorro, anios, modalidad = 'fija', tipoFijo = HIPOTECA.tipoMedioFijo, diferencial = 0.0075, ingresosNetos = 0 }) {
  const capital = Math.max(precio - ahorro, 0);
  const tin = modalidad === 'variable' ? HIPOTECA.euribor + diferencial : tipoFijo;
  const cuota = cuotaFrancesa(capital, tin, anios);
  const totalPagado = cuota * anios * 12;
  const gastos = precio * HIPOTECA.gastosCompra;

  return {
    capital: redondear(capital),
    tin,
    cuota: redondear(cuota),
    intereses: redondear(totalPagado - capital),
    totalPagado: redondear(totalPagado),
    financiacion: precio > 0 ? capital / precio : 0,
    gastos: redondear(gastos),
    ahorroNecesario: redondear(precio * (1 - HIPOTECA.financiacionHabitual) + gastos),
    esfuerzo: ingresosNetos > 0 ? cuota / ingresosNetos : null,
    capitalMaximo: ingresosNetos > 0 ? redondear(capitalParaCuota(ingresosNetos * HIPOTECA.esfuerzoMaximo, tin, anios)) : null,
    escenarios: modalidad === 'variable'
      ? [-0.01, 0, 0.01].map((d) => ({
          euribor: HIPOTECA.euribor + d,
          cuota: redondear(cuotaFrancesa(capital, Math.max(HIPOTECA.euribor + d, 0) + diferencial, anios)),
        }))
      : null,
    tabla: tablaAmortizacion(capital, tin, anios),
  };
}
