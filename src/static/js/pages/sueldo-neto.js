import { calcularNomina } from '../calc/nomina.js';
import { eur, pct, numero, entero, pintar, mostrar, marcarInvalido, conectarFormulario, activarCompartir, VACIO } from '../ui.js';

const form = document.getElementById('calculadora');
const res = document.getElementById('resultado');
const $ = (id) => document.getElementById(id);
let ultimo = null;

conectarFormulario(form, (d) => {
  const bruto = numero(d.bruto);
  const valido = bruto >= 1000 && bruto <= 5_000_000;
  marcarInvalido(form.elements.bruto, !valido && d.bruto !== '');
  mostrar(res, true);
  if (!valido) {
    ultimo = null;
    pintar(res, { netoMensual: VACIO, netoAnual: VACIO, irpfTipo: VACIO, irpfAnual: VACIO, ssAnual: VACIO, ssTipo: VACIO, pagaExtra: VACIO, brutoPaga: VACIO, irpfPaga: VACIO, ssPaga: VACIO });
    return;
  }

  const hijos = entero(d.hijos, 0, 10);
  const menores3 = Math.min(entero(d.menores3, 0, 10), hijos);
  const r = calcularNomina({
    brutoAnual: bruto,
    pagas: Number(d.pagas),
    contrato: d.contrato,
    situacion: Number(d.situacion),
    hijos,
    hijosMenores3: menores3,
    edad: d.edad,
  });
  ultimo = r;

  pintar(res, {
    netoMensual: eur(r.netoMensual),
    pagasTexto: r.pagas === 14 ? 'al mes en 14 pagas' : 'al mes en 12 pagas',
    netoAnual: eur(r.netoAnual),
    pagaExtra: r.netoPagaExtra ? eur(r.netoPagaExtra) : VACIO,
    brutoPaga: eur(r.brutoPaga),
    irpfPaga: `− ${eur(r.brutoPaga * r.irpf.tipo / 100)}`,
    ssPaga: `− ${eur(r.ss.mensual)}`,
    irpfTipo: pct(r.irpf.tipo),
    irpfAnual: eur(r.irpf.anual),
    ssAnual: eur(r.ss.anual),
    ssTipo: pct(r.ss.tipo * 100),
    limite: eur(r.irpf.limiteExcluyente, { entero: true }),
    deduccion: eur(Math.min(r.deduccionRenta, r.irpf.anual)),
  });

  mostrar($('linea-extra'), r.pagas === 14);
  mostrar($('detalle-extra'), r.pagas === 14);
  $('b-neto').style.flexGrow = r.netoAnual;
  $('b-irpf').style.flexGrow = r.irpf.anual;
  $('b-ss').style.flexGrow = r.ss.anual;

  mostrar($('nota-exento'), r.irpf.motivo === 'exento');
  mostrar($('nota-temporal'), r.irpf.motivo === 'minimo-temporal');
  // Solo se recupera lo que se ha retenido: sin retención, la deducción no devuelve nada.
  mostrar($('nota-deduccion'), r.deduccionRenta > 0 && r.irpf.anual > 0);
  mostrar($('nota-tope'), r.ss.topeAlcanzado);
  mostrar($('nota-smi'), r.pordebajoSMI);
  mostrar($('campo-menores3'), hijos > 0);
});

activarCompartir($('compartir'), form, () =>
  ultimo ? `Con ${eur(ultimo.brutoAnual, { entero: true })} brutos al año cobro ${eur(ultimo.netoMensual)} netos al mes. Calcula el tuyo:` : 'Calcula tu sueldo neto:');
