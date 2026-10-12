import { compararSueldos } from '../calc/subida.js';
import { eur, pct, numero, entero, pintar, mostrar, marcarInvalido, conectarFormulario, activarCompartir, activarImagen, VACIO } from '../ui.js';

const form = document.getElementById('calculadora');
const res = document.getElementById('resultado');
const $ = (id) => document.getElementById(id);
let ultimo = null;

conectarFormulario(form, (d) => {
  const bruto = numero(d.bruto);
  const cantidad = numero(d.subida);
  const nuevo = d.modo === 'porcentaje' ? bruto * (1 + cantidad / 100) : bruto + cantidad;
  $('sufijo-subida').dataset.sufijo = d.modo === 'porcentaje' ? '%' : '€';
  const valido = bruto >= 1000 && bruto <= 5_000_000 && cantidad > 0 && nuevo <= 5_000_000;
  marcarInvalido(form.elements.bruto, !(bruto >= 1000) && d.bruto !== '');
  marcarInvalido(form.elements.subida, !(cantidad > 0) && d.subida !== '');
  if (!valido) {
    ultimo = null;
    pintar(res, { masMes: VACIO, masAnio: VACIO, llega: VACIO, antes: VACIO, despues: VACIO, nuevoBruto: VACIO, irpfAntes: VACIO, irpfDespues: VACIO, hacienda: VACIO });
    return;
  }

  const r = compararSueldos(bruto, nuevo, {
    pagas: Number(d.pagas),
    situacion: Number(d.situacion),
    hijos: entero(d.hijos, 0, 10),
  });
  ultimo = r;
  const seVa = r.subidaBruta - r.subidaNetaAnual;
  pintar(res, {
    masMes: `+ ${eur(r.subidaNetaMensual)}`,
    pagasTexto: Number(d.pagas) === 14 ? 'más al mes (14 pagas)' : 'más al mes (12 pagas)',
    masAnio: `+ ${eur(r.subidaNetaAnual)}`,
    llega: pct(r.aprovechamiento * 100, 0),
    nuevoBruto: eur(nuevo),
    subidaBruta: `+ ${eur(r.subidaBruta)}`,
    antes: eur(r.antes.netoMensual),
    despues: eur(r.despues.netoMensual),
    irpfAntes: pct(r.antes.irpf.tipo),
    irpfDespues: pct(r.despues.irpf.tipo),
    hacienda: `− ${eur(seVa)}`,
  });
  $('b-neto').style.flexGrow = Math.max(r.subidaNetaAnual, 0);
  $('b-irpf').style.flexGrow = Math.max(seVa, 0);
  mostrar($('nota-tramo'), r.despues.irpf.tipoMarginal > r.antes.irpf.tipoMarginal);
});

activarCompartir($('compartir'), form, () =>
  ultimo ? `Me suben ${eur(ultimo.subidaBruta, { entero: true })} brutos y solo me llegan ${eur(ultimo.subidaNetaMensual)} más al mes. Calcula la tuya:` : 'Calcula cuánto te llega de una subida:');

activarImagen($('imagen'), () => ultimo && {
  titulo: 'Mi subida de sueldo',
  etiqueta: 'Me llegan cada mes',
  cifra: `+ ${eur(ultimo.subidaNetaMensual)}`,
  detalle: `de una subida de ${eur(ultimo.subidaBruta, { entero: true })} brutos al año`,
  filas: [
    ['Neto al mes antes', eur(ultimo.antes.netoMensual)],
    ['Neto al mes después', eur(ultimo.despues.netoMensual)],
    ['Parte de la subida que llega', pct(ultimo.aprovechamiento * 100, 0)],
  ],
});
