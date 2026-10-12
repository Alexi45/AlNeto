import { calcularHipoteca } from '../calc/hipoteca.js';
import { HIPOTECA } from '../calc/params-2026.js';
import { eur, pct, numero, pintar, mostrar, marcarInvalido, conectarFormulario, activarCompartir, activarImagen, VACIO } from '../ui.js';

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

  mostrar($('linea-esfuerzo'), r.esfuerzo != null);
  mostrar($('linea-maximo'), r.capitalMaximo != null);
  mostrar($('nota-esfuerzo'), r.esfuerzo != null && r.esfuerzo > HIPOTECA.esfuerzoMaximo);
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
