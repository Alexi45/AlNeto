// Gráficos SVG sin dependencias.
// - graficoLinea / graficoColumnas devuelven el HTML del gráfico como texto, así sirven
//   igual en el build (páginas estáticas) que en el navegador (calculadoras).
// - activarGraficos los redibuja al ancho real en píxeles (barras de 24 px como máximo,
//   texto a 12 px en cualquier pantalla) y añade cursor, tooltip y navegación con teclado.
// Especificación: línea de 2 px con relleno al 10 %, marcador de r = 5 con anillo de 2 px
// del color de la superficie, columnas con 2 px de separación y extremo redondeado de 4 px,
// rejilla de 1 px continua y textos siempre en colores de texto, nunca en el de la serie.

const M = { izq: 60, der: 16, arr: 22, abj: 34 };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = (n) => Math.round(n * 10) / 10;

// Divisiones «limpias» para el eje (1, 2, 2,5 o 5 × 10^n)
export const divisiones = (min, max, objetivo = 4) => {
  const bruto = (max - min) / objetivo || 1;
  const pot = 10 ** Math.floor(Math.log10(bruto));
  const paso = [1, 2, 2.5, 5, 10].map((f) => f * pot).find((p) => p >= bruto) ?? 10 * pot;
  const inicio = Math.floor(min / paso) * paso;
  const fin = Math.ceil(max / paso) * paso;
  const ticks = [];
  for (let v = inicio; v <= fin + paso / 1000; v += paso) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
};

const marco = ({ id, titulo, subtitulo, leyenda = '', svg, datos, tipo, nota = '' }) => `<figure class="viz" id="${esc(id)}" data-viz="${tipo}" tabindex="0" aria-describedby="${esc(id)}-desc">
  <figcaption class="viz-cabecera"><span class="viz-titulo">${esc(titulo)}</span>${subtitulo ? `<span class="viz-subtitulo">${esc(subtitulo)}</span>` : ''}</figcaption>
  ${leyenda}
  <div class="viz-lienzo">${svg}<div class="viz-tooltip" role="status" hidden></div></div>
  <p class="sr-only" id="${esc(id)}-desc">${esc(nota || subtitulo || titulo)} Usa las flechas izquierda y derecha para recorrer los valores.</p>
  ${nota ? `<p class="viz-nota">${esc(nota)}</p>` : ''}
  <script type="application/json" class="viz-datos">${JSON.stringify(datos).replace(/</g, '\\u003c')}</script>
</figure>`;

const ejes = ({ ancho, alto, ticksY, escY, textoY, ticksX }) => {
  const rejilla = ticksY.map((t) => `<line x1="${M.izq}" x2="${ancho - M.der}" y1="${r1(escY(t))}" y2="${r1(escY(t))}"/>`).join('');
  const etiquetasY = ticksY.map((t) => `<text x="${M.izq - 8}" y="${r1(escY(t) + 4)}" text-anchor="end">${esc(textoY[t])}</text>`).join('');
  const etiquetasX = ticksX.map(({ x, texto }) => `<text x="${r1(x)}" y="${alto - 10}" text-anchor="middle">${esc(texto)}</text>`).join('');
  return `<g class="viz-rejilla">${rejilla}</g><g class="viz-texto-eje">${etiquetasY}${etiquetasX}</g>`;
};

/**
 * Línea de una serie con un punto destacado (énfasis).
 * puntos: [{ x, y, tx, ty }] con tx/ty ya formateados para el tooltip.
 */
export function graficoLinea(opciones) {
  const { id, titulo, subtitulo, nota, puntos, destacado, etiquetaDestacado, yMin, yMax, nTicksY = 4, ticksX } = opciones;
  const ancho = opciones.ancho ?? 720;
  const alto = opciones.alto ?? 300;
  const ticksY = divisiones(yMin ?? Math.min(...puntos.map((p) => p.y)), yMax ?? Math.max(...puntos.map((p) => p.y)), nTicksY);
  const textoY = opciones.textoY ?? Object.fromEntries(ticksY.map((t) => [t, opciones.formatoY(t)]));
  const textoX = opciones.textoX ?? Object.fromEntries(ticksX.map((x) => [x, opciones.formatoX(x)]));

  const xs = puntos.map((p) => p.x);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = ticksY[0];
  const y1 = ticksY.at(-1);
  const escX = (x) => M.izq + ((x - x0) / (x1 - x0)) * (ancho - M.izq - M.der);
  const escY = (y) => alto - M.abj - ((y - y0) / (y1 - y0)) * (alto - M.arr - M.abj);

  const camino = puntos.map((p, i) => `${i ? 'L' : 'M'}${r1(escX(p.x))},${r1(escY(p.y))}`).join('');
  const area = `${camino}L${r1(escX(x1))},${r1(escY(y0))}L${r1(escX(x0))},${r1(escY(y0))}Z`;

  // En pantallas estrechas se muestran menos marcas en el eje X para que no se pisen
  const xsVisibles = ancho < 480 ? ticksX.filter((_, i) => i % 2 === 0) : ticksX;

  let marca = '';
  if (destacado) {
    const cx = escX(destacado.x);
    const cy = escY(destacado.y);
    const alDerecha = cx < ancho * 0.6;
    marca = `<g class="viz-destacado"><line x1="${r1(cx)}" x2="${r1(cx)}" y1="${r1(cy + 7)}" y2="${r1(escY(y0))}"/>`
      + `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="5"/>`
      + `<text x="${r1(cx + (alDerecha ? 10 : -10))}" y="${r1(cy - 12)}" text-anchor="${alDerecha ? 'start' : 'end'}">${esc(etiquetaDestacado)}</text></g>`;
  }

  const svg = `<svg viewBox="0 0 ${ancho} ${alto}" width="${ancho}" height="${alto}" role="img" aria-label="${esc(titulo)}">
    ${ejes({ ancho, alto, ticksY, escY, textoY, ticksX: xsVisibles.map((x) => ({ x: escX(x), texto: textoX[x] })) })}
    <line class="viz-base" x1="${M.izq}" x2="${ancho - M.der}" y1="${r1(escY(y0))}" y2="${r1(escY(y0))}"/>
    <path class="viz-area serie-1" d="${area}"/>
    <path class="viz-linea serie-1" d="${camino}"/>
    ${marca}
    <line class="viz-cursor" x1="0" x2="0" y1="${M.arr}" y2="${alto - M.abj}" visibility="hidden"/>
    <circle class="viz-punto serie-1" r="5" visibility="hidden"/>
    <rect class="viz-captura" x="${M.izq}" y="0" width="${ancho - M.izq - M.der}" height="${alto}"/>
  </svg>`;

  const datos = {
    tipo: 'linea',
    ancho,
    puntos: puntos.map((p) => ({ px: r1(escX(p.x)), py: r1(escY(p.y)), titulo: p.tx, filas: [[p.ty, '', 'serie-1']] })),
    inicial: destacado ? puntos.findIndex((p) => p.x === destacado.x) : puntos.length - 1,
    // Lo necesario para redibujar al ancho real sin volver a calcular nada
    args: { id, titulo, subtitulo, nota, puntos, destacado, etiquetaDestacado, yMin, yMax, nTicksY, ticksX, textoY, textoX },
  };
  return marco({ id, titulo, subtitulo, svg, datos, tipo: 'linea', nota });
}

/**
 * Columnas apiladas (parte de un todo a lo largo del tiempo).
 * series: [{ nombre, clase: 'serie-1', valores: [] }] de abajo arriba.
 * extras: [{ nombre, valores: [] }] datos que solo salen en el tooltip.
 */
export function graficoColumnas(opciones) {
  const { id, titulo, subtitulo, nota, categorias, etiquetasCorta } = opciones;
  const ancho = opciones.ancho ?? 720;
  const alto = opciones.alto ?? 300;
  const texto = (v) => (opciones.formatoValor ? opciones.formatoValor(v) : String(v));
  const series = opciones.series.map((se) => ({ ...se, textos: se.textos ?? se.valores.map(texto) }));
  const extras = (opciones.extras ?? []).map((ex) => ({ ...ex, textos: ex.textos ?? ex.valores.map(texto) }));

  const n = categorias.length;
  const totales = categorias.map((_, i) => series.reduce((s, se) => s + se.valores[i], 0));
  const ticksY = divisiones(0, Math.max(...totales), 4);
  const textoY = opciones.textoY ?? Object.fromEntries(ticksY.map((t) => [t, opciones.formatoY(t)]));
  const yMax = ticksY.at(-1);
  const anchoPlot = ancho - M.izq - M.der;
  const banda = anchoPlot / n;
  const GAP = 2;
  const grueso = Math.max(Math.min(24, banda - GAP), 2);
  const escY = (v) => alto - M.abj - (v / yMax) * (alto - M.arr - M.abj);
  const base = escY(0);

  const columnas = categorias.map((_, i) => {
    const x = M.izq + banda * i + (banda - grueso) / 2;
    let acumulado = 0;
    const visibles = series.filter((se) => se.valores[i] > 0);
    const piezas = series.map((se) => {
      const v = se.valores[i];
      if (v <= 0) return '';
      const yAbajo = escY(acumulado);
      acumulado += v;
      const yArriba = escY(acumulado);
      const esUltima = se === visibles.at(-1);
      // 2 px de superficie entre segmentos: el de abajo cede 1 px y el de arriba otro
      const abajo = se === visibles[0] ? yAbajo : yAbajo - GAP / 2;
      const arriba = esUltima ? yArriba : yArriba + GAP / 2;
      const h = Math.max(abajo - arriba, 0.5);
      if (!esUltima) return `<rect class="${se.clase}" x="${r1(x)}" y="${r1(arriba)}" width="${r1(grueso)}" height="${r1(h)}"/>`;
      const rr = Math.min(4, grueso / 2, h);
      return `<path class="${se.clase}" d="M${r1(x)},${r1(abajo)}V${r1(arriba + rr)}Q${r1(x)},${r1(arriba)} ${r1(x + rr)},${r1(arriba)}H${r1(x + grueso - rr)}Q${r1(x + grueso)},${r1(arriba)} ${r1(x + grueso)},${r1(arriba + rr)}V${r1(abajo)}Z"/>`;
    }).join('');
    return `<g class="viz-columna">${piezas}</g>`;
  }).join('');

  const cadaX = opciones.cadaX ?? 5;
  const paso = ancho < 520 && n > 12 ? Math.max(cadaX, 10) : cadaX;
  const ticksX = categorias.map((_, i) => i).filter((i) => i === 0 || (i + 1) % paso === 0)
    .map((i) => ({ x: M.izq + banda * i + banda / 2, texto: etiquetasCorta[i] }));
  const leyenda = `<ul class="viz-leyenda">${[...series].reverse().map((se) => `<li><span class="viz-muestra ${se.clase}"></span>${esc(se.nombre)}</li>`).join('')}</ul>`;

  const svg = `<svg viewBox="0 0 ${ancho} ${alto}" width="${ancho}" height="${alto}" role="img" aria-label="${esc(titulo)}">
    ${ejes({ ancho, alto, ticksY, escY, textoY, ticksX })}
    <rect class="viz-resalte" x="0" y="${M.arr}" width="${r1(banda)}" height="${r1(base - M.arr)}" visibility="hidden"/>
    ${columnas}
    <line class="viz-base" x1="${M.izq}" x2="${ancho - M.der}" y1="${r1(base)}" y2="${r1(base)}"/>
    <rect class="viz-captura" x="${M.izq}" y="0" width="${r1(anchoPlot)}" height="${alto}"/>
  </svg>`;

  const datos = {
    tipo: 'columnas',
    ancho,
    puntos: categorias.map((c, i) => ({
      px: r1(M.izq + banda * i + banda / 2),
      x0: r1(M.izq + banda * i),
      titulo: c,
      filas: [
        ...[...series].reverse().map((se) => [se.textos[i], se.nombre, se.clase]),
        ...extras.map((ex) => [ex.textos[i], ex.nombre, '']),
      ],
    })),
    inicial: 0,
    args: { id, titulo, subtitulo, nota, categorias, etiquetasCorta, series, extras, textoY, cadaX },
  };
  return marco({ id, titulo, subtitulo, leyenda, svg, datos, tipo: 'columnas', nota });
}

// ---------- Interacción (solo navegador) ----------
const leerDatos = (fig) => JSON.parse(fig.querySelector('.viz-datos').textContent);

// Redibuja el gráfico al ancho real del contenedor (si ha cambiado) y devuelve el nuevo nodo.
const ajustarAncho = (fig) => {
  const datos = leerDatos(fig);
  const ancho = Math.round(fig.querySelector('.viz-lienzo').clientWidth);
  if (!datos.args || !ancho || Math.abs(ancho - datos.ancho) < 6) return fig;
  const alto = Math.round(Math.min(Math.max(ancho * 0.42, 230), 320));
  const crear = datos.tipo === 'linea' ? graficoLinea : graficoColumnas;
  const plantilla = document.createElement('template');
  plantilla.innerHTML = crear({ ...datos.args, ancho, alto });
  const nueva = plantilla.content.firstElementChild;
  fig.replaceWith(nueva);
  return nueva;
};

const conectar = (fig) => {
  const datos = leerDatos(fig);
  const svg = fig.querySelector('svg');
  const tooltip = fig.querySelector('.viz-tooltip');
  const cursor = svg.querySelector('.viz-cursor');
  const punto = svg.querySelector('.viz-punto');
  const resalte = svg.querySelector('.viz-resalte');
  const ver = (el, si) => el?.setAttribute('visibility', si ? 'visible' : 'hidden');
  let actual = null;

  const mostrarEn = (i) => {
    const p = datos.puntos[i];
    if (!p) return;
    actual = i;
    if (cursor) { cursor.setAttribute('x1', p.px); cursor.setAttribute('x2', p.px); ver(cursor, true); }
    if (punto) { punto.setAttribute('cx', p.px); punto.setAttribute('cy', p.py); ver(punto, true); }
    if (resalte) { resalte.setAttribute('x', p.x0); ver(resalte, true); }

    // Contenido con textContent: nunca HTML construido a partir de datos
    tooltip.replaceChildren();
    const t = document.createElement('p');
    t.className = 'viz-tt-titulo';
    t.textContent = p.titulo;
    tooltip.append(t);
    for (const [valor, nombre, clase] of p.filas) {
      const fila = document.createElement('p');
      fila.className = 'viz-tt-fila';
      const clave = document.createElement('span');
      clave.className = `viz-tt-clave ${clase || 'sin-clave'}`;
      const v = document.createElement('strong');
      v.textContent = valor;
      fila.append(clave, v);
      if (nombre) fila.append(document.createTextNode(` ${nombre}`));
      tooltip.append(fila);
    }
    tooltip.hidden = false;
    const anchoTt = tooltip.offsetWidth;
    const izquierda = p.px + 14 + anchoTt > datos.ancho ? p.px - 14 - anchoTt : p.px + 14;
    tooltip.style.left = `${Math.max(0, izquierda)}px`;
    tooltip.style.top = `${p.py != null ? Math.max(0, p.py - tooltip.offsetHeight - 12) : 8}px`;
  };

  const ocultar = () => {
    actual = null;
    tooltip.hidden = true;
    ver(cursor, false);
    ver(punto, false);
    ver(resalte, false);
  };

  const indiceEn = (clientX) => {
    const x = clientX - svg.getBoundingClientRect().left;
    let mejor = 0;
    datos.puntos.forEach((p, i) => { if (Math.abs(p.px - x) < Math.abs(datos.puntos[mejor].px - x)) mejor = i; });
    return mejor;
  };

  svg.addEventListener('pointermove', (e) => mostrarEn(indiceEn(e.clientX)));
  svg.addEventListener('pointerdown', (e) => mostrarEn(indiceEn(e.clientX)));
  svg.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') ocultar(); });
  fig.addEventListener('focus', () => mostrarEn(actual ?? datos.inicial));
  fig.addEventListener('blur', ocultar);
  fig.addEventListener('keydown', (e) => {
    const ultimo = datos.puntos.length - 1;
    const base = actual ?? datos.inicial;
    const destino = { ArrowRight: base + 1, ArrowLeft: base - 1, Home: 0, End: ultimo }[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    mostrarEn(Math.min(Math.max(destino, 0), ultimo));
  });
};

let escuchandoResize = false;

export function activarGraficos(raiz = document) {
  raiz.querySelectorAll('figure.viz').forEach((fig) => conectar(ajustarAncho(fig)));
  if (escuchandoResize) return;
  escuchandoResize = true;
  let espera;
  addEventListener('resize', () => {
    clearTimeout(espera);
    espera = setTimeout(() => document.querySelectorAll('figure.viz').forEach((fig) => {
      const nueva = ajustarAncho(fig);
      if (nueva !== fig) conectar(nueva);
    }), 150);
  });
}
