// Buscador de la web (⌘K / Ctrl+K / «/»). El índice es un JSON local y la búsqueda se hace
// en el navegador: lo que escribes no sale de tu dispositivo.
import { prepararPrellenado } from './ui.js';

const dialogo = document.getElementById('buscador');
const entrada = document.getElementById('buscador-entrada');
const lista = document.getElementById('buscador-resultados');
let indice = null;
let resultados = [];
let seleccion = 0;

const normalizar = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const fmt = (n) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' }).format(n);
const ORDEN = { Calcular: -1, Calculadora: 0, Guía: 1, Inicio: 2, Página: 3, Sueldo: 4 };

const cargar = async () => {
  if (indice) return indice;
  try { indice = await (await fetch('/buscar.json')).json(); } catch { indice = []; }
  return indice;
};

// «30000», «30.000», «30 000», «30k» o «30 mil» → 30000
const leerCifra = (q) => {
  const m = normalizar(q).match(/(\d{1,3}(?:[.\s]\d{3})+|\d+(?:,\d+)?)\s*(k|mil)?\b/);
  if (!m) return null;
  let n = Number(m[1].replace(/[.\s]/g, '').replace(',', '.'));
  if (m[2]) n *= 1000;
  return n >= 600 && n <= 5_000_000 ? Math.round(n) : null;
};

function buscar(q) {
  const salida = [];
  const cifra = leerCifra(q);
  if (cifra) {
    const anual = cifra < 10000 ? cifra * 14 : cifra;
    if (cifra < 10000) salida.push({ g: 'Calcular', t: `Neto de ${fmt(cifra)} € brutos al mes`, d: `En 14 pagas (${fmt(anual)} € al año)`, u: '/calculadora-sueldo-neto/', bruto: anual });
    else salida.push({ g: 'Calcular', t: `Neto de ${fmt(cifra)} € brutos al año`, d: 'Abre la calculadora con esa cifra', u: '/calculadora-sueldo-neto/', bruto: cifra });
    const sueldos = indice.filter((e) => e.g === 'Sueldo' && /\d+-euros/.test(e.u))
      .map((e) => ({ e, v: Number(e.u.match(/(\d+)-euros/)[1]) }))
      .sort((a, b) => Math.abs(a.v - anual) - Math.abs(b.v - anual));
    if (sueldos[0]) salida.push(sueldos[0].e);
  }

  const tokens = normalizar(q).split(/\s+/).filter((t) => t && !/^\d/.test(t));
  if (!tokens.length && !cifra) {
    return indice.filter((e) => e.g === 'Calculadora').slice(0, 8);
  }
  const incluirSueldos = tokens.includes('sueldo') || tokens.includes('brutos');
  const encontrados = tokens.length ? indice
    .filter((e) => incluirSueldos || e.g !== 'Sueldo')
    .map((e) => {
      const titulo = normalizar(e.t);
      const todo = `${titulo} ${normalizar(e.d)} ${normalizar(e.g)}`;
      if (!tokens.every((t) => todo.includes(t))) return null;
      const puntos = tokens.reduce((s, t) => s + (titulo.includes(t) ? 3 : 1), 0) - (ORDEN[e.g] ?? 3) * 0.2;
      return { e, puntos };
    })
    .filter(Boolean)
    .sort((a, b) => b.puntos - a.puntos)
    .map((x) => x.e) : [];
  return [...salida, ...encontrados.filter((e) => !salida.includes(e))].slice(0, 8);
}

function pintar() {
  lista.replaceChildren();
  if (!resultados.length) {
    const li = document.createElement('li');
    li.className = 'buscador-vacio';
    li.textContent = 'No hay resultados. Prueba con «hipoteca», «paro» o un sueldo como «25000».';
    lista.append(li);
    entrada.removeAttribute('aria-activedescendant');
    return;
  }
  resultados.forEach((r, i) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = r.u;
    a.id = `resultado-${i}`;
    a.setAttribute('role', 'option');
    a.setAttribute('aria-selected', String(i === seleccion));
    const grupo = document.createElement('span');
    grupo.className = 'buscador-grupo';
    grupo.textContent = r.g;
    const texto = document.createElement('span');
    const titulo = document.createElement('span');
    titulo.className = 'buscador-titulo';
    titulo.textContent = r.t;
    const desc = document.createElement('span');
    desc.className = 'buscador-desc';
    desc.textContent = r.d;
    texto.append(titulo, desc);
    a.append(grupo, texto);
    a.addEventListener('click', () => preparar(r));
    li.append(a);
    lista.append(li);
  });
  entrada.setAttribute('aria-activedescendant', `resultado-${seleccion}`);
  document.getElementById(`resultado-${seleccion}`)?.scrollIntoView({ block: 'nearest' });
}

// La cifra va a la calculadora por sessionStorage, no por la URL
const preparar = (r) => { if (r.bruto) prepararPrellenado(r.u, { bruto: String(r.bruto), pagas: '14' }); };

// Si se escribe antes de que llegue el índice, se espera a él (nunca se busca sobre null)
const actualizar = async () => {
  await cargar();
  resultados = buscar(entrada.value);
  seleccion = 0;
  pintar();
};

async function abrir() {
  if (dialogo.open) return;
  dialogo.showModal();
  entrada.value = '';
  entrada.focus();
  await actualizar();
}

entrada.addEventListener('input', actualizar);
entrada.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (!resultados.length) return;
    seleccion = (seleccion + (e.key === 'ArrowDown' ? 1 : -1) + resultados.length) % resultados.length;
    pintar();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const r = resultados[seleccion];
    if (r) { preparar(r); location.href = r.u; }
  }
});
dialogo.addEventListener('click', (e) => { if (e.target === dialogo) dialogo.close(); });
document.querySelectorAll('[data-abrir-buscador]').forEach((b) => b.addEventListener('click', abrir));
document.addEventListener('keydown', (e) => {
  const escribiendo = /^(input|textarea|select)$/i.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable;
  if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !escribiendo)) {
    e.preventDefault();
    abrir();
  }
});
