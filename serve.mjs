// Servidor de desarrollo: genera dist/, lo sirve y lo regenera al guardar cambios.
//   node serve.mjs            (puerto 4004, o PORT=xxxx)
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Se importa de nuevo en cada cambio para que también se apliquen los cambios de build.mjs.
const build = async (opciones) => (await import(`./build.mjs?t=${Date.now()}`)).build(opciones);

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 4004;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

const existe = async (f) => (await stat(f).catch(() => null))?.isFile();

await build();

let pendiente = null;
const reconstruir = () => {
  clearTimeout(pendiente);
  pendiente = setTimeout(() => build({ silencioso: true }).then(
    () => console.log('↻ regenerado', new Date().toLocaleTimeString('es-ES')),
    (e) => console.error('✖', e.message),
  ), 120);
};
watch(path.join(ROOT, 'src'), { recursive: true }, reconstruir);
watch(path.join(ROOT, 'site.config.mjs'), reconstruir);
watch(path.join(ROOT, 'build.mjs'), reconstruir);

http.createServer(async (req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let archivo = path.normalize(path.join(DIST, ruta));
  if (!archivo.startsWith(DIST)) return res.writeHead(403).end();
  if (ruta.endsWith('/')) archivo = path.join(archivo, 'index.html');
  else if (!path.extname(archivo) && (await existe(path.join(archivo, 'index.html')))) {
    return res.writeHead(301, { Location: ruta + '/' }).end();
  }

  if (await existe(archivo)) {
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    return res.end(await readFile(archivo));
  }
  res.writeHead(404, { 'Content-Type': TIPOS['.html'] });
  res.end(await readFile(path.join(DIST, '404.html')).catch(() => 'No encontrado'));
}).listen(PORT, () => console.log(`→ http://localhost:${PORT}`));
