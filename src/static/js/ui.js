const formatoEur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', useGrouping: 'always' });
const formatoEurEntero = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' });

export const eur = (n, { entero = false } = {}) => (entero ? formatoEurEntero : formatoEur).format(n);

export const pct = (n, decimales = 2) =>
  `${n.toLocaleString('es-ES', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })} %`;

export const VACIO = '—';

// Acepta "30000", "30.000", "30.000,50", "1500.5" o "30 000 €".
export const numero = (texto) => {
  let t = String(texto ?? '').replace(/[\s€%]/g, '');
  if (!t) return NaN;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
};

export const entero = (texto, min, max) => {
  const n = parseInt(texto, 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : min;
};

// Escribe cada valor en los elementos [data-out]. Las cifras grandes (.cifra) hacen un
// pequeño destello al cambiar para que se note que el resultado se ha actualizado.
export const pintar = (raiz, valores) => {
  for (const [clave, valor] of Object.entries(valores)) {
    raiz.querySelectorAll(`[data-out="${clave}"]`).forEach((el) => {
      if (el.textContent === String(valor)) return;
      el.textContent = valor;
      if (el.classList.contains('cifra') || el.classList.contains('mini-cifra')) {
        el.classList.remove('destello');
        void el.offsetWidth;
        el.classList.add('destello');
      }
    });
  }
};

// Datos que una página deja preparados para la calculadora a la que enlaza, sin pasar
// por la URL (la URL la ven los scripts de terceros, como el de anuncios).
const CLAVE_PRELLENADO = 'alneto:prellenado';

export function prepararPrellenado(ruta, datos) {
  try { sessionStorage.setItem(CLAVE_PRELLENADO, JSON.stringify({ ruta, datos })); } catch { /* sin almacenamiento: se abre vacía */ }
}

const tomarPrellenado = () => {
  try {
    const guardado = JSON.parse(sessionStorage.getItem(CLAVE_PRELLENADO) || 'null');
    sessionStorage.removeItem(CLAVE_PRELLENADO);
    return guardado?.ruta === location.pathname ? guardado.datos : null;
  } catch {
    return null;
  }
};

export const mostrar = (el, visible) => el?.classList.toggle('oculto', !visible);

export const marcarInvalido = (input, invalido) => input.setAttribute('aria-invalid', String(invalido));

const leer = (form) => {
  const datos = {};
  for (const el of form.elements) {
    if (!el.name || ((el.type === 'radio' || el.type === 'checkbox') && !el.checked)) continue;
    datos[el.name] = el.value;
  }
  return datos;
};

// Rellena el formulario con los parámetros de la URL (para enlaces compartidos desde
// redes: /calculadora-sueldo-neto/?bruto=30000) y recalcula en cada cambio. Los datos NO
// se escriben en la URL mientras se escribe: solo van en el enlace al pulsar «Compartir».
export function conectarFormulario(form, calcular) {
  const entradas = [...new URLSearchParams(location.search), ...Object.entries(tomarPrellenado() || {})];
  for (const [clave, valor] of entradas) {
    const campo = form.elements[clave];
    if (campo) campo.value = valor;
  }
  const ejecutar = () => calcular(leer(form));
  form.addEventListener('input', ejecutar);
  form.addEventListener('change', ejecutar);
  form.addEventListener('submit', (e) => e.preventDefault());
  ejecutar();
  activarResumenMovil();
}

export function activarCompartir(boton, form, texto) {
  if (!boton) return;
  const original = boton.textContent;
  boton.addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}?${new URLSearchParams(leer(form))}`;
    try {
      if (navigator.share) return await navigator.share({ title: document.title, text: texto(), url });
      await navigator.clipboard.writeText(url);
      boton.textContent = '¡Enlace copiado!';
    } catch (e) {
      if (e?.name === 'AbortError') return;
      boton.textContent = 'No se pudo copiar el enlace';
    }
    setTimeout(() => { boton.textContent = original; }, 2200);
  });
}

// En móvil el resultado queda debajo del formulario: mientras el usuario está en el
// formulario y no ve el resultado, se muestra una barra fija con la cifra principal.
export function activarResumenMovil() {
  const barra = document.querySelector('.resumen-movil');
  const form = document.getElementById('calculadora');
  const principal = document.querySelector('.resultado-principal');
  if (!barra || !form || !principal || !('IntersectionObserver' in window)) return;
  let formVisible = false;
  let resultadoVisible = false;
  const actualizar = () => barra.classList.toggle('escondido', !formVisible || resultadoVisible);
  new IntersectionObserver(([e]) => { formVisible = e.isIntersecting; actualizar(); }).observe(form);
  new IntersectionObserver(([e]) => { resultadoVisible = e.isIntersecting; actualizar(); }, { threshold: 0.6 }).observe(principal);
}
