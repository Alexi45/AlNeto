import { calcularFiniquito } from '../calc/finiquito.js';
import { eur, numero, pintar, mostrar, marcarInvalido, conectarFormulario, activarCompartir, VACIO } from '../ui.js';

const form = document.getElementById('calculadora');
const res = document.getElementById('resultado');
const $ = (id) => document.getElementById(id);
const dias = (n) => `${n.toLocaleString('es-ES', { maximumFractionDigits: 2 })} ${Math.abs(n) === 1 ? 'día' : 'días'}`;

const antiguedad = (meses) => {
  const a = Math.floor(meses / 12);
  const m = meses % 12;
  const partes = [];
  if (a) partes.push(`${a} ${a === 1 ? 'año' : 'años'}`);
  if (m || !a) partes.push(`${m} ${m === 1 ? 'mes' : 'meses'}`);
  return partes.join(' y ');
};

// Fechas por defecto: hoy como baja y hace tres años como inicio.
const hoy = new Date();
const iso = (f) => f.toISOString().slice(0, 10);
if (!form.elements.fechaBaja.value) form.elements.fechaBaja.value = iso(hoy);
if (!form.elements.fechaInicio.value) form.elements.fechaInicio.value = iso(new Date(Date.UTC(hoy.getFullYear() - 3, hoy.getMonth(), 1)));

let ultimo = null;

conectarFormulario(form, (d) => {
  const bruto = numero(d.bruto);
  const vacAnuales = numero(d.vacaciones);
  const disfrutadas = numero(d.disfrutadas || '0');
  const fechasOk = /^\d{4}-\d{2}-\d{2}$/.test(d.fechaInicio) && /^\d{4}-\d{2}-\d{2}$/.test(d.fechaBaja) && d.fechaBaja >= d.fechaInicio;
  const valido = bruto >= 1000 && bruto <= 5_000_000 && vacAnuales >= 0 && vacAnuales <= 60 && disfrutadas >= 0 && fechasOk;

  marcarInvalido(form.elements.bruto, !(bruto >= 1000) && d.bruto !== '');
  marcarInvalido(form.elements.fechaBaja, !fechasOk);
  mostrar($('campo-devengo'), d.pagas === '14');
  mostrar($('error-fechas'), !fechasOk);

  if (!valido) {
    ultimo = null;
    pintar(res, { total: VACIO, totalFiniquito: VACIO, indemnizacion: VACIO, salario: VACIO, vacaciones: VACIO, extras: VACIO });
    return;
  }

  const r = calcularFiniquito({
    brutoAnual: bruto,
    pagas: Number(d.pagas),
    devengo: d.devengo,
    fechaInicio: d.fechaInicio,
    fechaBaja: d.fechaBaja,
    vacacionesAnuales: vacAnuales,
    vacacionesDisfrutadas: disfrutadas,
    motivo: d.motivo,
  });
  ultimo = r;

  pintar(res, {
    total: eur(r.total),
    totalFiniquito: eur(r.totalFiniquito),
    indemnizacion: eur(r.indemnizacion.importe),
    salario: eur(r.salarioPendiente.importe),
    salarioDias: dias(r.salarioPendiente.dias),
    vacaciones: eur(r.vacaciones.importe),
    vacacionesDias: `${dias(r.vacaciones.pendientes)} pendientes de ${dias(r.vacaciones.generadas)} generados`,
    extras: eur(r.totalExtras),
    motivo: r.indemnizacion.motivo,
    antiguedad: antiguedad(r.indemnizacion.meses),
    indemDias: dias(r.indemnizacion.dias),
    salarioDia: eur(r.salarioDia),
  });

  $('lista-extras').replaceChildren(...r.pagasExtra.map((p) => {
    const li = document.createElement('li');
    li.className = 'sub';
    li.innerHTML = `<span></span><span></span>`;
    li.children[0].textContent = `${p.nombre} (${dias(p.dias)})`;
    li.children[1].textContent = eur(p.importe);
    return li;
  }));

  mostrar($('linea-extras'), r.pagasExtra.length > 0);
  mostrar($('bloque-indemnizacion'), r.indemnizacion.importe > 0);
  mostrar($('nota-sin-indemnizacion'), r.indemnizacion.importe === 0);
  mostrar($('nota-tope'), r.indemnizacion.tope);
  mostrar($('nota-vacaciones-negativas'), r.vacaciones.pendientes < 0);
  mostrar($('nota-voluntaria'), d.motivo === 'voluntaria');
});

activarCompartir($('compartir'), form, () => (ultimo ? `Mi finiquito sale en ${eur(ultimo.total)}. Calcula el tuyo:` : 'Calcula tu finiquito:'));
