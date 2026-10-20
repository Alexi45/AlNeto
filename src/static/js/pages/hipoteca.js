import { calcularHipoteca } from '../calc/hipoteca.js';
import { HIPOTECA } from '../calc/params-2026.js';
import { eur, pct, numero, pintar, mostrar, marcarInvalido, conectarFormulario, activarCompartir, activarImagen, VACIO } from '../ui.js';
import { graficoColumnas, activarGraficos } from '../graficos.js';

const ICONOS = {
  bien: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10" cy="10" r="8"/><path d="M6.5 10.3l2.3 2.3 4.7-4.9"/></svg>',
  aviso: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2.5l8 14H2z"/><path d="M10 8v3.5M10 14.2v.1"/></svg>',
  critico: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10" cy="10" r="8"/><path d="M7 7l6 6M13 7l-6 6"/></svg>',
};
const TEXTOS = {
  bien: 'Asumible: por debajo del 30 % que recomiendan los bancos.',
  aviso: 'Al límite: entre el 30 % y el 35 %. Algunos bancos podrían no concederla.',
  critico: 'Difícil: más del 35 %. La mayoría de bancos no la concederían.',
};

const pintarMedidor = (esfuerzo) => {
  const medidor = $('medidor-esfuerzo');
  mostrar(medidor, esfuerzo != null);
  if (esfuerzo == null) return;
  const estado = esfuerzo <= 0.3 ? 'bien' : esfuerzo <= HIPOTECA.esfuerzoMaximo ? 'aviso' : 'critico';
  medidor.dataset.estado = estado;
  $('medidor-relleno').style.width = `${Math.min(esfuerzo / 0.5, 1) * 100}%`;
  $('medidor-estado').innerHTML = ICONOS[estado];
  $('medidor-estado').append(TEXTOS[estado]);
};

const pintarGrafico = (r) => {
  const anios = r.tabla.map((f) => f.anio);
  $('grafico-anual').innerHTML = graficoColumnas({
    id: 'grafico-hipoteca',
    titulo: 'Lo que pagas cada año: capital e intereses',
    subtitulo: `Cuota de ${eur(r.cuota)} al mes. Al principio casi todo son intereses.`,
    categorias: anios.map((a) => `Año ${a}`),
    etiquetasCorta: anios.map((a) => `Año ${a}`),
    series: [
      { nombre: 'Capital que devuelves', clase: 'serie-1', valores: r.tabla.map((f) => f.amortizado) },
      { nombre: 'Intereses', clase: 'serie-2', valores: r.tabla.map((f) => f.intereses) },
    ],
    extras: [{ nombre: 'deuda pendiente', valores: r.tabla.map((f) => f.pendiente) }],
    formatoY: (t) => eur(t, { entero: true }),
    formatoValor: (v) => eur(v, { entero: true }),
    cadaX: r.tabla.length > 30 ? 10 : 5,
  });
  activarGraficos($('grafico-anual'));
};

const form = document.getElementById('calculadora');
const res = document.getElementById('resultado');
const $ = (id) => document.getElementById(id);
let ultimo = null;

const fila = (celdas) => {
  const tr = document.createElement('tr');
  celdas.forEach((texto, i) => {
    const td = document.createElement('td');
    td.textContent = texto;
    if (i) td.className = 'n';
    tr.append(td);
  });
  return tr;
};

conectarFormulario(form, (d) => {
  const precio = numero(d.precio);
  const ahorro = numero(d.ahorro || '0');
  const anios = Math.min(Math.max(parseInt(d.anios, 10) || 25, 5), 40);
  const tipoFijo = numero(d.tipo) / 100;
  const diferencial = numero(d.diferencial) / 100;
  const ingresos = numero(d.ingresos || '0');
  $('salida-anios').textContent = `${anios} años`;
  mostrar($('campo-tipo'), d.modalidad === 'fija');
  mostrar($('campo-diferencial'), d.modalidad === 'variable');

  const valido = precio >= 10000 && precio <= 10_000_000 && ahorro >= 0 && ahorro < precio
    && (d.modalidad === 'variable' ? diferencial >= 0 && diferencial < 0.1 : tipoFijo > 0 && tipoFijo < 0.2);
  marcarInvalido(form.elements.precio, !(precio >= 10000) && d.precio !== '');
  marcarInvalido(form.elements.ahorro, !(ahorro >= 0 && ahorro < precio));
  if (!valido) {
    ultimo = null;
    pintar(res, { cuota: VACIO, capital: VACIO, intereses: VACIO, total: VACIO });
    return;
  }

  const r = calcularHipoteca({ precio, ahorro, anios, modalidad: d.modalidad, tipoFijo, diferencial, ingresosNetos: ingresos > 0 ? ingresos : 0 });
  ultimo = { ...r, anios };
  pintar(res, {
    cuota: eur(r.cuota),
    detalle: `durante ${anios} años · TIN ${pct(r.tin * 100)}`,
    capital: eur(r.capital),
    financiacion: pct(r.financiacion * 100, 0),
    intereses: eur(r.intereses),
    total: eur(r.totalPagado),
    gastos: eur(r.gastos, { entero: true }),
    ahorroNecesario: eur(r.ahorroNecesario, { entero: true }),
    esfuerzo: r.esfuerzo != null ? pct(r.esfuerzo * 100, 0) : VACIO,
    capitalMaximo: r.capitalMaximo != null ? eur(r.capitalMaximo, { entero: true }) : VACIO,
  });

  mostrar($('linea-maximo'), r.capitalMaximo != null);
  pintarMedidor(r.esfuerzo);
  pintarGrafico(r);
  mostrar($('nota-financiacion'), r.financiacion > HIPOTECA.financiacionHabitual + 0.0001);
  mostrar($('bloque-escenarios'), Boolean(r.escenarios));
  if (r.escenarios) {
    $('escenarios').replaceChildren(...r.escenarios.map((e, i) =>
      fila([`${['Si baja 1 punto', 'Con el Euríbor actual', 'Si sube 1 punto'][i]} (${pct(e.euribor * 100, 2)})`, eur(e.cuota)])));
  }
  $('amortizacion').replaceChildren(...r.tabla.map((f) => fila([`Año ${f.anio}`, eur(f.amortizado), eur(f.intereses), eur(f.pendiente)])));
});

activarCompartir($('compartir'), form, () =>
  ultimo ? `Mi hipoteca saldría a ${eur(ultimo.cuota)} al mes. Calcula la tuya:` : 'Calcula la cuota de tu hipoteca:');

activarImagen($('imagen'), () => ultimo && {
  titulo: 'Mi hipoteca',
  etiqueta: 'Cuota mensual',
  cifra: eur(ultimo.cuota),
  detalle: `${eur(ultimo.capital, { entero: true })} a ${ultimo.anios} años al ${pct(ultimo.tin * 100)}`,
  filas: [
    ['Intereses totales', eur(ultimo.intereses, { entero: true })],
    ['Total a pagar', eur(ultimo.totalPagado, { entero: true })],
  ],
});
