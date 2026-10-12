import { calcularAutonomo } from '../calc/autonomos.js';
import { eur, numero, pintar, mostrar, marcarInvalido, conectarFormulario, activarCompartir, activarImagen, VACIO } from '../ui.js';

const form = document.getElementById('calculadora');
const res = document.getElementById('resultado');
const $ = (id) => document.getElementById(id);
let ultimo = null;

conectarFormulario(form, (d) => {
  const ingresos = numero(d.ingresos);
  const gastos = numero(d.gastos || '0');
  const valido = ingresos >= 0 && ingresos <= 10_000_000 && gastos >= 0 && Number.isFinite(ingresos);
  marcarInvalido(form.elements.ingresos, !(ingresos >= 0) && d.ingresos !== '');
  marcarInvalido(form.elements.gastos, !(gastos >= 0));
  if (!valido) {
    ultimo = null;
    pintar(res, { cuota: VACIO, rendimiento: VACIO, tramo: VACIO, anual: VACIO });
    return;
  }

  const societario = d.forma === 'societario';
  const r = calcularAutonomo({ rendimientoAnual: ingresos - gastos, societario, primerAnio: d.primer === 'si' });
  ultimo = r;
  pintar(res, {
    cuota: eur(r.cuota),
    detalle: r.tarifaPlana ? 'al mes con la tarifa plana (80 € + MEI)' : `al mes · tramo ${r.tramo} de 15`,
    rendimiento: eur(ingresos - gastos),
    computable: eur(r.rendimientoComputableMensual),
    deduccion: societario ? '3 %' : '7 %',
    tramo: String(r.tramo),
    base: eur(r.baseMinima),
    cuotaMinima: eur(r.cuotaMinima),
    cuotaMaxima: eur(r.cuotaMaxima),
    anual: eur(r.cuotaAnual),
  });
  mostrar($('nota-tarifa'), r.tarifaPlana);
  mostrar($('nota-societario'), societario);
  mostrar($('nota-tarifa-societario'), societario && d.primer === 'si');
});

activarCompartir($('compartir'), form, () =>
  ultimo ? `Mi cuota de autónomo en 2026 sale en ${eur(ultimo.cuota)} al mes. Calcula la tuya:` : 'Calcula tu cuota de autónomo:');

activarImagen($('imagen'), () => ultimo && {
  titulo: 'Mi cuota de autónomo 2026',
  etiqueta: 'Pago a la Seguridad Social',
  cifra: eur(ultimo.cuota),
  detalle: ultimo.tarifaPlana ? 'al mes con la tarifa plana' : `al mes · tramo ${ultimo.tramo} de 15`,
  filas: [
    ['Al año', eur(ultimo.cuotaAnual)],
    ['Rendimiento que cuenta al mes', eur(ultimo.rendimientoComputableMensual)],
  ],
});
