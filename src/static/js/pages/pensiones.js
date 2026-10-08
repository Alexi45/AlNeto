import { calcularPension, subidaPrevista } from '../calc/pensiones.js';
import { eur, pct, numero, pintar, mostrar, marcarInvalido, conectarFormulario, activarCompartir, VACIO } from '../ui.js';

const form = document.getElementById('calculadora');
const res = document.getElementById('resultado');
const $ = (id) => document.getElementById(id);
let ultimo = null;

conectarFormulario(form, (d) => {
  const pension = numero(d.pension);
  const ipc = numero(d.ipc) / 100;
  const subida = subidaPrevista(ipc);
  $('salida-ipc').textContent = pct(ipc * 100, 1);
  pintar(res, { subida: pct(subida * 100, 1) });

  const valido = pension >= 100 && pension <= 10000;
  marcarInvalido(form.elements.pension, !valido && d.pension !== '');
  if (!valido) {
    ultimo = null;
    pintar(res, { nueva: VACIO, porPaga: VACIO, anual: VACIO, anualNueva: VACIO });
    return;
  }

  const r = calcularPension({ pensionMensual: pension, pagas: Number(d.pagas), subida });
  ultimo = r;
  pintar(res, {
    nueva: eur(r.nueva),
    pagasTexto: r.pagas === 14 ? 'al mes en 14 pagas' : 'al mes en 12 pagas',
    porPaga: `+ ${eur(r.subidaPorPaga)}`,
    anual: `+ ${eur(r.subidaAnual)}`,
    anualNueva: eur(r.anualNueva),
    maxima: eur(r.maxima2027),
  });
  mostrar($('nota-maxima'), r.enMaxima);
  mostrar($('nota-por-encima'), r.porEncimaDeMaxima);
});

activarCompartir($('compartir'), form, () =>
  ultimo ? `Con la subida prevista, mi pensión pasaría a ${eur(ultimo.nueva)} en 2027. Calcula la tuya:` : 'Calcula tu pensión de 2027:');
