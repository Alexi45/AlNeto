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

// ---------- Imagen para Stories ----------
// Dibuja el resultado en una imagen vertical 1080×1920 con la marca y el dominio, y la
// comparte (móvil) o la descarga (ordenador). Todo ocurre en el navegador.
const FUENTE = '-apple-system, system-ui, "Segoe UI", Roboto, sans-serif';

const ajustarTexto = (ctx, texto, anchoMax, tamMax, peso) => {
  let tam = tamMax;
  do { ctx.font = `${peso} ${tam}px ${FUENTE}`; tam -= 4; } while (ctx.measureText(texto).width > anchoMax && tam > 40);
};

const lineas = (ctx, texto, anchoMax) => {
  const palabras = texto.split(' ');
  const salida = [];
  let actual = '';
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (ctx.measureText(prueba).width > anchoMax && actual) { salida.push(actual); actual = p; } else actual = prueba;
  }
  if (actual) salida.push(actual);
  return salida;
};

export async function crearImagen({ titulo, etiqueta, cifra, detalle, filas = [] }) {
  const W = 1080, H = 1920, M = 90;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  const dominio = (document.body.dataset.dominio || location.host).replace(/^https?:\/\//, '');

  const fondo = x.createLinearGradient(0, 0, W, H);
  fondo.addColorStop(0, '#0a5a3e'); fondo.addColorStop(1, '#03170f');
  x.fillStyle = fondo; x.fillRect(0, 0, W, H);
  const brillo = x.createRadialGradient(W * 0.9, 0, 0, W * 0.9, 0, 900);
  brillo.addColorStop(0, 'rgba(78,224,166,0.35)'); brillo.addColorStop(1, 'rgba(78,224,166,0)');
  x.fillStyle = brillo; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(255,255,255,0.045)'; x.lineWidth = 2;
  for (let i = 0; i <= W; i += 60) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
  for (let j = 0; j <= H; j += 60) { x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke(); }

  // Marca
  x.fillStyle = '#ffffff'; x.beginPath(); x.roundRect(M, 130, 96, 96, 26); x.fill();
  x.strokeStyle = '#0a7c55'; x.lineWidth = 10; x.lineCap = 'round'; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(M + 27, 182); x.lineTo(M + 40, 195); x.lineTo(M + 69, 162); x.stroke();
  x.textBaseline = 'middle'; x.fillStyle = '#ffffff'; x.font = `500 60px ${FUENTE}`;
  x.fillText('Al', M + 122, 180);
  const wAl = x.measureText('Al').width;
  x.fillStyle = '#7fe7bb'; x.font = `800 60px ${FUENTE}`; x.fillText('Neto', M + 122 + wAl, 180);

  // Resultado
  x.textBaseline = 'alphabetic';
  x.fillStyle = '#7fe7bb'; x.font = `700 40px ${FUENTE}`;
  x.fillText(titulo.toUpperCase(), M, 470);
  x.fillStyle = 'rgba(255,255,255,0.8)'; x.font = `500 50px ${FUENTE}`;
  x.fillText(etiqueta, M, 590);
  x.fillStyle = '#ffffff';
  ajustarTexto(x, cifra, W - 2 * M, 190, 800);
  x.fillText(cifra, M, 780);
  x.fillStyle = 'rgba(255,255,255,0.85)'; x.font = `500 46px ${FUENTE}`;
  lineas(x, detalle, W - 2 * M).slice(0, 2).forEach((l, i) => x.fillText(l, M, 870 + i * 60));

  // Tarjeta de desglose
  if (filas.length) {
    const top = 1010, alto = 110 * filas.length + 50;
    x.fillStyle = '#ffffff'; x.beginPath(); x.roundRect(M - 10, top, W - 2 * M + 20, alto, 40); x.fill();
    filas.forEach(([k, v], i) => {
      const y = top + 95 + i * 110;
      x.fillStyle = '#475752'; x.font = `500 42px ${FUENTE}`; x.textAlign = 'left';
      x.fillText(k, M + 40, y);
      x.fillStyle = '#0f1a17'; x.font = `800 46px ${FUENTE}`; x.textAlign = 'right';
      x.fillText(v, W - M - 40, y);
      x.textAlign = 'left';
      if (i < filas.length - 1) { x.fillStyle = '#e2e7e9'; x.fillRect(M + 40, y + 42, W - 2 * M - 80, 2); }
    });
  }

  // Llamada a la acción
  x.fillStyle = 'rgba(255,255,255,0.8)'; x.font = `500 46px ${FUENTE}`;
  x.fillText('Calcula el tuyo gratis en', M, 1640);
  x.fillStyle = '#7fe7bb'; x.font = `800 84px ${FUENTE}`;
  x.fillText(dominio, M, 1740);
  x.fillStyle = 'rgba(255,255,255,0.5)'; x.font = `500 32px ${FUENTE}`;
  x.fillText('Estimación con la normativa española de 2026', M, 1820);

  return new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92));
}

export function activarImagen(boton, datos) {
  if (!boton || !HTMLCanvasElement.prototype.toBlob) return;
  const original = boton.textContent;
  boton.addEventListener('click', async () => {
    const d = datos();
    if (!d) return;
    boton.disabled = true;
    boton.textContent = 'Creando imagen…';
    try {
      const blob = await crearImagen(d);
      const archivo = new File([blob], 'mi-resultado-alneto.jpg', { type: 'image/jpeg' });
      if (navigator.canShare?.({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: d.titulo });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = archivo.name;
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }
    } catch (e) {
      if (e?.name !== 'AbortError') console.error(e);
    } finally {
      boton.disabled = false;
      boton.textContent = original;
    }
  });
}
