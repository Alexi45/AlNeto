import { calcularNomina } from '../calc/nomina.js';
import { eur, pct, numero, pintar, marcarInvalido, prepararPrellenado, VACIO } from '../ui.js';

const form = document.getElementById('mini');
const enlace = document.getElementById('mini-enlace');

const actualizar = () => {
  const bruto = numero(form.elements.bruto.value);
  const valido = bruto >= 1000 && bruto <= 5_000_000;
  marcarInvalido(form.elements.bruto, !valido && form.elements.bruto.value !== '');
  if (!valido) return pintar(form, { neto: VACIO, irpf: VACIO, ss: VACIO, anual: VACIO });

  const r = calcularNomina({ brutoAnual: bruto, pagas: Number(form.elements.pagas.value) });
  pintar(form, {
    neto: eur(r.netoMensual),
    irpf: pct(r.irpf.tipo),
    ss: eur(r.ss.mensual),
    anual: eur(r.netoAnual, { entero: true }),
  });
};

form.addEventListener('input', actualizar);
form.addEventListener('submit', (e) => e.preventDefault());
enlace.addEventListener('click', () => {
  prepararPrellenado(enlace.pathname, { bruto: form.elements.bruto.value, pagas: form.elements.pagas.value });
});
actualizar();
