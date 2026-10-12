# AlNeto

Calculadoras de dinero para España con las cifras oficiales de 2026: sueldo neto, subida de sueldo, hipoteca, cuota de autónomos, finiquito, paro y pensiones 2027. Además incluye 59 páginas de «X € brutos: cuánto es neto» y 10 guías. Es una web estática pensada para posicionar en Google y monetizar con AdSense.

**Funciones para crecer:**
- **Imagen para Stories:** cada resultado se convierte en una imagen vertical con tu dominio. En el móvil se comparte directamente.
- **Widget incrustable:** la calculadora de sueldo neto se puede poner en otras webs (`/embed/sueldo-neto/`), lo que te da enlaces entrantes.
- **App instalable que funciona sin conexión** (service worker que siempre pide primero la red).
- **Enlaces con datos:** las calculadoras aceptan parámetros en la URL, como `?bruto=30000`, útiles para los vídeos.

- Sin dependencias: solo Node 20 o superior.
- Todos los cálculos se hacen en el navegador, así que nada de lo que escribe el usuario sale de su dispositivo.
- Los ejemplos de los textos se generan con las mismas funciones que las calculadoras, así que nunca se contradicen.

## Arrancar en local

```bash
npm run dev
```

Abre http://localhost:4004 y regenera la web al guardar cualquier cambio en `src/` o en `site.config.mjs`.

```bash
npm test
```

Ejecuta 22 pruebas del motor de cálculo. Comparan con casos publicados, como el salario mínimo con un 3,06 % de retención.

```bash
npm run build
```

Genera la web final en `dist/`.

## Estructura

| Ruta | Qué es |
|---|---|
| `site.config.mjs` | Nombre, dominio, datos legales e ID de AdSense |
| `src/static/js/calc/params-2026.js` | **Todas las cifras oficiales** (cotizaciones, IRPF, IPREM, IPC…) |
| `src/static/js/calc/*.js` | Motor de cálculo puro (nómina, finiquito, paro, pensiones) |
| `src/static/js/pages/*.js` | Conecta cada formulario con su cálculo |
| `src/pages/**/*.html` | Páginas. Cada una lleva una cabecera `---` con `title`, `description`, `type`, `script`, `updated`… |
| `src/tablas.mjs` | Tablas y datos que se calculan en el build: `{{tabla:nombre}}` |
| `src/generadores/*.mjs` | Páginas creadas desde datos (las 59 de sueldos + su índice) |
| `src/parciales/*.html` | Fragmentos reutilizables: `{{parcial:nombre}}` (la calculadora de sueldo, que comparten la página y el widget) |
| `src/layout.html` / `src/layout-embed.html` | Plantilla común / plantilla mínima del widget (`layout: embed`) |
| `src/static/sw.js` | Service worker (uso sin conexión) |
| `build.mjs` / `serve.mjs` | Generador y servidor de desarrollo |

## Mantener las cifras al día

Todo está en `src/static/js/calc/params-2026.js`. Después de tocar algo, ejecuta `npm test` y cambia el `updated:` de las páginas afectadas: esa fecha se muestra al usuario y se envía a Google en el sitemap.

Fechas que conviene vigilar:

- **Euríbor** (primeros días de cada mes): actualiza `HIPOTECA.euribor` y `euriborMes` con la media oficial del mes anterior (Banco de España).
- **Tipos medios de hipotecas** (INE, cada mes, con unos 3 meses de retraso): `HIPOTECA.tipoMedioFijo`.
- **Páginas de sueldo**: cambia `ACTUALIZADO` en `src/generadores/sueldos.mjs` cuando cambien las cifras de nómina.

- **IPC adelantado** (finales de cada mes): actualiza `PENSIONES.ipc` y la página de pensiones. Quedan octubre (~30 oct) y noviembre (~27 nov). Con el de noviembre la subida de 2027 queda casi cerrada, y es oficial a mediados de diciembre.
- **Enero de 2027**: nueva orden de cotización (base máxima, MEI 2027, solidaridad y tramos de autónomos en `AUTONOMOS`), revalorización oficial y nuevo IPREM si hay Presupuestos.
- **Mayo-junio**: nueva Encuesta de Estructura Salarial del INE (`SALARIOS_INE`).
- **Salario mínimo de 2027**: se aprueba normalmente entre diciembre y febrero.

## Antes de publicar

1. **Dominio propio (obligatorio para AdSense).** AdSense no aprueba subdominios gratuitos como `*.github.io` o `*.pages.dev`. `alneto.es` y `alneto.com` no tenían DNS el 8/10/2026, señal de que podrían estar libres. Si eliges otro, cambia `site.url`.
2. **Datos legales.** Rellena `titular` y `contacto` en `site.config.mjs`. El aviso legal es obligatorio con publicidad (LSSI). Mientras quede algo `PENDIENTE`, el build avisa y la publicación falla a propósito.
3. **Sobre mí.** Personaliza `autor.bio`. Google valora saber quién está detrás de una web de dinero.
4. **Contenido.** Hay 7 calculadoras, 10 guías y 59 páginas de sueldo (83 páginas en el sitemap), suficiente para pedir AdSense. Sigue publicando con el ritmo de `PLAN-CONTENIDO.md`.

## Publicar (gratis)

### Opción recomendada: Cloudflare Pages

Es gratis, sin límite de tráfico (importante si un vídeo se hace viral), permite webs con anuncios y tiene servidores en Madrid.

1. Crea una cuenta en dash.cloudflare.com.
2. Ve a **Workers & Pages → Crear → Pages → Conectar a Git** y elige el repo `Alexi45/AlNeto`.
3. Configuración de build:
   - Framework: *Ninguno*.
   - Comando de build: `npm run build`.
   - Directorio de salida: `dist`.
   - Variable de entorno: `NODE_VERSION` = `22`.
4. Guarda. Cada `git push` a `main` publicará la web sola en unos 30 segundos.
5. En **Dominios personalizados**, añade tu dominio. Si el DNS del dominio lo gestiona Cloudflare, se configura solo y con HTTPS.

Cloudflare marca la variable `CI`, así que el build falla mientras queden datos `PENDIENTE`. Es a propósito: así no se publica el aviso legal a medias.

### Plan B: GitHub Pages

Activa *Settings → Pages → Source: GitHub Actions* y lanza a mano el workflow **Publicar en GitHub Pages** (pestaña Actions). El build genera el archivo `CNAME` con tu dominio. Su límite orientativo es de 100 GB de tráfico al mes.

### Después de publicar

1. **Google Search Console**: verifica el dominio y envía `https://tu-dominio/sitemap.xml`.
2. **Bing Webmaster Tools**: importa la web desde Search Console (también alimenta a otros buscadores).
3. **Cloudflare Web Analytics** (gratis y sin cookies): actívalo para ver las visitas sin necesitar más avisos de consentimiento.
4. **Email con tu dominio**: con Cloudflare Email Routing (gratis), `contacto@tudominio` puede reenviarse a tu Gmail.

## AdSense

1. Solicítalo en adsense.google.com con tu dominio.
2. Pon tu ID en `site.config.mjs` → `adsense.client: 'ca-pub-…'`. El build añade el script a todas las páginas y genera `ads.txt`.
3. En AdSense, ve a **Privacidad y mensajes** y crea el mensaje de consentimiento RGPD para Europa. Es obligatorio en España y es la plataforma certificada que mencionan la política de privacidad y la de cookies. El enlace «Configurar cookies» del pie ya lo abre.
4. En **Anuncios automáticos**, desactiva los anuncios anclados en la parte inferior del móvil o muévelos arriba: abajo está la barra fija con el resultado de la calculadora.
5. Nunca pidas a nadie que haga clic en los anuncios ni hagas clic en los tuyos.

Los ingresos de AdSense se declaran a Hacienda. Si no estás dado de alta como autónomo, consúltalo con un gestor.
