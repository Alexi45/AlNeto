// Genera la web estática en dist/ a partir de src/. Sin dependencias.
//   node build.mjs
import { readFile, writeFile, mkdir, rm, cp, readdir, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const FINAL = path.join(ROOT, 'dist');
// Se genera en una carpeta temporal y solo sustituye a dist/ si todo ha ido bien.
const OUT = path.join(ROOT, '.dist-tmp');

const leerFrontMatter = (raw) => {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const linea of m[1].split('\n')) {
    const i = linea.indexOf(':');
    if (i > 0) meta[linea.slice(0, i).trim()] = linea.slice(i + 1).trim();
  }
  return { meta, body: raw.slice(m[0].length) };
};

const listarPaginas = async (dir, base = '') => {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const rel = path.join(base, e.name);
    if (e.isDirectory()) out.push(...(await listarPaginas(path.join(dir, e.name), rel)));
    else if (e.name.endsWith('.html')) out.push(rel);
  }
  return out;
};

const listarArchivos = async (dir) => {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, e.name);
    out.push(...(e.isDirectory() ? await listarArchivos(ruta) : [ruta]));
  }
  return out.sort();
};

// 'index.html' -> '/', 'guias/index.html' -> '/guias/', 'paro.html' -> '/paro/'
const urlDe = (rel) => {
  const sin = rel.replace(/\\/g, '/').replace(/\.html$/, '');
  if (sin === '404') return '/404.html';
  const ruta = sin.replace(/(^|\/)index$/, '');
  return ruta ? `/${ruta}/` : '/';
};

const destinoDe = (url) => (url.endsWith('.html') ? path.join(OUT, url) : path.join(OUT, url, 'index.html'));

const fechaHumana = (iso) =>
  new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${iso}T00:00:00Z`));

const escapar = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const valor = (obj, ruta) => ruta.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

const slug = (texto) =>
  texto.replace(/<[^>]+>/g, '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);

// Da un id a cada <h2> del artículo principal y devuelve la lista para el índice lateral.
const indexarArticulo = (html) => {
  const entradas = [];
  const usados = new Set();
  const resultado = html.replace(/<article class="prosa">([\s\S]*?)<\/article>/, (_, interior) =>
    `<article class="prosa">${interior.replace(/<h2>([\s\S]*?)<\/h2>/g, (__, texto) => {
      let id = slug(texto);
      while (usados.has(id)) id += '-2';
      usados.add(id);
      entradas.push({ id, texto: texto.replace(/<[^>]+>/g, '') });
      return `<h2 id="${id}">${texto}</h2>`;
    })}</article>`);
  return { html: resultado, entradas };
};

const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 8);

export async function build({ silencioso = false } = {}) {
  // Import con marca de tiempo para que el servidor de desarrollo coja los cambios.
  const v = `?t=${Date.now()}`;
  const config = (await import(pathToFileURL(path.join(ROOT, 'site.config.mjs')).href + v)).default;
  const { tablas } = await import(pathToFileURL(path.join(SRC, 'tablas.mjs')).href + v);

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await cp(path.join(SRC, 'static'), OUT, { recursive: true });

  const layout = await readFile(path.join(SRC, 'layout.html'), 'utf8');
  const css = await readFile(path.join(SRC, 'static/css/style.css'), 'utf8');
  const versionCss = hash(css);
  const js = await listarArchivos(path.join(SRC, 'static/js'));
  const versionJs = hash((await Promise.all(js.map((f) => readFile(f, 'utf8')))).join(''));
  const base = config.site.url.replace(/\/$/, '');
  const iniciales = config.autor.nombre.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const adsense = config.adsense.client
    ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.adsense.client}" crossorigin="anonymous"></script>`
    : '';

  const avisos = new Set();
  const sitemap = [];
  const paginas = await listarPaginas(path.join(SRC, 'pages'));

  for (const rel of paginas) {
    const raw = await readFile(path.join(SRC, 'pages', rel), 'utf8');
    const { meta, body } = leerFrontMatter(raw);
    for (const k of ['title', 'description']) {
      if (meta[k]) meta[k] = meta[k].replace(/\{\{([\w.]+)\}\}/g, (todo, c) => valor(config, c) ?? todo);
    }
    const url = urlDe(rel);
    const canonical = base + url;
    const actualizado = meta.updated || new Date().toISOString().slice(0, 10);
    const tipo = meta.type || 'pagina';

    const ld = [];
    // `parent: Guías|/guias/` añade un nivel intermedio a las migas de pan
    const niveles = [{ name: 'Inicio', item: base + '/' }];
    if (meta.parent) {
      const [nombre, ruta] = meta.parent.split('|');
      niveles.push({ name: nombre, item: base + ruta });
    }
    if (meta.breadcrumb) niveles.push({ name: meta.breadcrumb, item: canonical });
    const migas = meta.breadcrumb
      ? {
          '@type': 'BreadcrumbList',
          itemListElement: niveles.map((n, i) => ({ '@type': 'ListItem', position: i + 1, ...n })),
        }
      : null;
    if (tipo === 'home') ld.push({ '@type': 'WebSite', name: config.site.name, url: base + '/', inLanguage: 'es-ES' });
    if (tipo === 'calculadora') {
      ld.push({
        '@type': 'WebApplication',
        name: meta.title,
        description: meta.description,
        url: canonical,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Cualquiera',
        inLanguage: 'es-ES',
        dateModified: actualizado,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      });
    }
    if (tipo === 'articulo') {
      ld.push({
        '@type': 'Article',
        headline: meta.title,
        description: meta.description,
        dateModified: actualizado,
        datePublished: meta.published || actualizado,
        author: { '@type': 'Person', name: config.autor.nombre, url: base + '/sobre-mi/' },
        publisher: { '@type': 'Organization', name: config.site.name },
        mainEntityOfPage: canonical,
      });
    }
    if (migas) ld.push(migas);
    const jsonld = ld.length
      ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': ld })}</script>`
      : '';

    const vars = {
      ...config,
      title: meta.title,
      description: meta.description,
      canonical,
      actualizado: fechaHumana(actualizado),
      actualizadoISO: actualizado,
      year: new Date().getFullYear(),
      robots: meta.noindex === 'true' ? 'noindex, follow' : 'index, follow, max-image-preview:large',
      ogType: tipo === 'articulo' ? 'article' : 'website',
      css: `/css/style.css?v=${versionCss}`,
      scripts: meta.script ? `<script type="module" src="/js/pages/${meta.script}.js?v=${versionJs}"></script>` : '',
      adsense,
      jsonld,
      toc: '%%INDICE%%',
      autoria: `<div class="autoria"><div class="autoria-avatar" aria-hidden="true">${iniciales}</div><div>`
        + `<p class="autoria-nombre">${tipo === 'articulo' ? 'Escrito' : 'Revisado'} por <a href="/sobre-mi/">${config.autor.nombre}</a></p>`
        + `<p class="autoria-meta">Actualizado el ${fechaHumana(actualizado)} · Cifras contrastadas con la normativa oficial</p></div></div>`,
    };

    const sustituir = (texto) =>
      texto
        .replace(/\{\{tabla:([\w-]+)\}\}/g, (_, nombre) => {
          if (!tablas[nombre]) throw new Error(`Tabla desconocida "${nombre}" en ${rel}`);
          return tablas[nombre]();
        })
        .replace(/\{\{([\w.]+)\}\}/g, (todo, clave) => {
          const v = valor(vars, clave);
          if (v === undefined) throw new Error(`Variable sin definir {{${clave}}} en ${rel}`);
          if (String(v).startsWith('PENDIENTE')) avisos.add(`${clave}: ${v}`);
          return v;
        });

    const { html: cuerpo, entradas } = indexarArticulo(sustituir(body));
    const llamada = tipo === 'calculadora'
      ? '<div class="indice-cta"><p>¿Quieres probar con otros datos?</p><a class="boton boton-primario boton-pequeno" href="#calculadora">Volver a la calculadora</a></div>'
      : '<div class="indice-cta"><p>Haz tus cuentas con las cifras de 2026.</p><a class="boton boton-primario boton-pequeno" href="/#calculadoras">Ver las calculadoras</a></div>';
    const indice = entradas.length
      ? `<nav aria-label="En esta página"><p class="indice-titulo">En esta página</p><ol>${entradas
        .map((e) => `<li><a href="#${e.id}">${e.texto}</a></li>`).join('')}</ol></nav>${llamada}`
      : '';
    let html = sustituir(layout.replace('{{content}}', '%%CONTENIDO%%'))
      .replace('%%CONTENIDO%%', () => cuerpo.replace('%%INDICE%%', () => indice));
    // Marca el enlace de la página actual en la navegación
    html = html.replace(new RegExp(`(<a class="nav-link" href="${url}")`, 'g'), '$1 aria-current="page"');

    const destino = destinoDe(url);
    await mkdir(path.dirname(destino), { recursive: true });
    await writeFile(destino, html);

    if (meta.noindex !== 'true' && url !== '/404.html') sitemap.push({ loc: base + url, lastmod: actualizado, prioridad: tipo });
  }

  const orden = { home: 0, calculadora: 1, articulo: 2 };
  sitemap.sort((a, b) => (orden[a.prioridad] ?? 3) - (orden[b.prioridad] ?? 3));
  await writeFile(
    path.join(OUT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap
      .map((p) => `  <url><loc>${escapar(p.loc)}</loc><lastmod>${p.lastmod}</lastmod></url>`)
      .join('\n')}\n</urlset>\n`,
  );
  const host = new URL(base).hostname;
  if (!host.endsWith('github.io')) await writeFile(path.join(OUT, 'CNAME'), host + '\n');
  await writeFile(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
  if (config.adsense.client) {
    const pub = config.adsense.client.replace(/^ca-/, '');
    await writeFile(path.join(OUT, 'ads.txt'), `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`);
  }

  await rm(FINAL, { recursive: true, force: true });
  await rename(OUT, FINAL);

  if (!silencioso) {
    console.log(`✔ ${paginas.length} páginas generadas en dist/`);
    if (!config.adsense.client) console.log('· AdSense sin configurar (adsense.client en site.config.mjs)');
    if (avisos.size) {
      console.log('\n⚠ Datos PENDIENTES en site.config.mjs (rellénalos antes de publicar):');
      for (const a of avisos) console.log('  - ' + a);
    }
  }
  return { paginas: paginas.length, avisos: [...avisos] };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  build()
    .then(({ avisos }) => {
      // En la publicación automática (CI) no se permite salir con el aviso legal a medias.
      if (process.env.CI && avisos.length) {
        console.error('\n✖ Publicación cancelada: rellena los datos PENDIENTES de site.config.mjs.');
        process.exit(1);
      }
    })
    .catch((e) => {
      console.error('✖', e.message);
      process.exit(1);
    });
}
