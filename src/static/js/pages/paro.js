import { calcularParo } from '../calc/paro.js';
import { eur, numero, entero, pintar, mostrar, marcarInvalido, conectarFormulario, activarCompartir, VACIO } from '../ui.js';

const form = document.getElementById('calculadora');
const res = document.getElementById('resultado');
const $ = (id) => document.getElementById(id);
let ultimo = null;

const textoAjuste = (ajuste) =>
  ajuste === 'maximo' ? ' (tope máximo)' : ajuste === 'minimo' ? ' (cuantía mínima)' : '';

conectarFormulario(form, (d) => {
  const bruto = numero(d.bruto);
  const meses = entero(d.meses, 0, 72);
  const valido = bruto >= 1000 && bruto <= 5_000_000;
  marcarInvalido(form.elements.bruto, !valido && d.bruto !== '');
  $('salida-meses').textContent = `${meses} ${meses === 1 ? 'mes' : 'meses'}`;

  if (!valido) {
    ultimo = null;
    pintar(res, { primeros: VACIO, duracion: VACIO, despues: VACIO, total: VACIO });
    return;
  }

  const r = calcularParo({ brutoAnual: bruto, mesesCotizados: meses, hijos: entero(d.hijos, 0, 2) });
  ultimo = r;
  mostrar($('con-derecho'), r.tieneDerecho);
  mostrar($('sin-derecho'), !r.tieneDerecho);
  if (!r.tieneDerecho) {
    pintar(res, { primeros: 'Sin derecho' });
    return;
  }

  const meses2 = r.meses % 1 === 0 ? r.meses : r.meses.toLocaleString('es-ES', { maximumFractionDigits: 1 });
  pintar(res, {
    primeros: eur(r.primeros180.bruto),
    primerosNeto: eur(r.primeros180.neto),
    duracion: `${meses2} meses (${r.dias} días)`,
    despues: r.desde181 ? eur(r.desde181.bruto) : VACIO,
    despuesNeto: r.desde181 ? eur(r.desde181.neto) : VACIO,
    cotizacion: `− ${eur(r.primeros180.cotizacion)}`,
    base: eur(r.baseReguladora),
    total: eur(r.totalBruto),
    ajustePrimeros: textoAjuste(r.primeros180.ajuste),
    ajusteDespues: r.desde181 ? textoAjuste(r.desde181.ajuste) : '',
    minimo: eur(r.minimo),
    maximo: eur(r.maximo),
  });
  mostrar($('linea-despues'), Boolean(r.desde181));
  mostrar($('nota-tope'), r.primeros180.ajuste === 'maximo');
});

activarCompartir($('compartir'), form, () =>
  ultimo?.tieneDerecho ? `Me quedarían ${eur(ultimo.primeros180.bruto)} al mes de paro durante ${ultimo.meses} meses. Calcula el tuyo:` : 'Calcula cuánto paro te queda:');
