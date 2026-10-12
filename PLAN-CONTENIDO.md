# Plan de contenido y tráfico

## 1. Guías

**Ya publicadas (10):** salario mínimo, despido objetivo o improcedente, retenciones IRPF 2026, paga extra de Navidad, cuánto se cobra de paro, dos pagadores, baja voluntaria, vacaciones no disfrutadas, cuánto me presta el banco y 12 o 14 pagas.

**Siguientes** (una o dos por semana; copia el formato de cualquier guía de `src/pages/guias/`):

| Guía | Calculadora |
|---|---|
| Cómo pedir el paro paso a paso | Paro |
| Capitalizar el paro para hacerte autónomo | Paro y autónomos |
| Subsidio por desempleo 2026 | Paro |
| Tarifa plana de autónomos 2026 | Autónomos |
| Hipoteca fija o variable en 2026 | Hipoteca |
| Gastos de comprar una casa por comunidad autónoma (ITP) | Hipoteca |
| Cuándo se cobra la pensión de enero de 2027 | Pensiones |
| Pensiones mínimas 2026 y complemento a mínimos | Pensiones |
| Fin de contrato temporal: indemnización y paro | Finiquito y paro |
| Retribución flexible: cómo cobrar más sin pagar más IRPF | Sueldo neto |

## Enlaces entrantes con el widget

La calculadora de sueldo neto se puede incrustar en otras webs, y el código incluye un enlace a la tuya. Escribe a blogs de empleo, academias de oposiciones, gestorías y webs de recursos humanos ofreciéndoles el widget gratis. Cada web que lo ponga es un enlace que ayuda a posicionar.

## 2. Vídeos para TikTok, Reels y Shorts

Formato que funciona: **gancho en 2 segundos → la cifra en pantalla (grabando la calculadora en el móvil) → «calculadora gratis en el enlace del perfil»**. Entre 20 y 40 segundos.

Los enlaces pueden llevar los datos ya puestos, así quien entra ve el mismo resultado del vídeo:

| Vídeo | Enlace |
|---|---|
| «Cobras 1.800 € brutos al mes. Esto es lo que te llega de verdad» | `/calculadora-sueldo-neto/?bruto=25200&pagas=14` |
| «El salario mínimo sube a 1.221 €… pero no te llegan 1.221 €» | `/calculadora-sueldo-neto/?bruto=17094` |
| «¿Te retienen IRPF cobrando el mínimo? Hacienda te lo devuelve, pero solo si…» | `/guias/salario-minimo-2026-neto/` |
| «Te despiden tras 5 años con 24.000 €: objetivo vs improcedente» | `/calculadora-finiquito/?motivo=improcedente&bruto=24000&fechaInicio=2021-10-01` |
| «Lo que casi nadie revisa del finiquito: las vacaciones» | `/calculadora-finiquito/?motivo=voluntaria` |
| «Paro: aunque ganes 3.000 €, no cobras más de 1.225 €» | `/calculadora-paro/?bruto=36000&meses=72` |
| «¿Cuánto paro te queda con 1 año trabajado?» | `/calculadora-paro/?meses=12` |
| «Pensiones 2027: la inflación de septiembre lo cambia todo» | `/subida-pensiones-2027/` |
| «Tu pensión de 1.000 € en enero de 2027» | `/subida-pensiones-2027/?pension=1000` |
| «Mismo sueldo, distinto neto: soltero vs con 2 hijos» | `/calculadora-sueldo-neto/?bruto=30000&hijos=2` |
| «Me suben 2.000 € y solo me llegan 92 € al mes» | `/calculadora-subida-sueldo/?bruto=30000&subida=2000` |
| «El Euríbor sube: así cambia tu hipoteca» | `/calculadora-hipoteca/?modalidad=variable` |
| «Cuánto paga un autónomo que factura 3.000 € al mes» | `/calculadora-cuota-autonomos/?ingresos=36000&gastos=6000` |
| «24.000 € brutos: lo que de verdad te llega» | `/sueldo-neto/24000-euros-brutos/` |

**Truco:** pulsa «Imagen para Stories» en cualquier calculadora. Tendrás la imagen del resultado lista para el vídeo o la historia, y lleva tu dominio.

Nombres de los parámetros: `bruto`, `pagas`, `contrato` (indefinido/temporal), `situacion` (1/2/3), `hijos`, `menores3`, `edad` · finiquito: `motivo`, `fechaInicio`, `fechaBaja`, `vacaciones`, `disfrutadas`, `devengo` · paro: `meses`, `hijos` · pensiones: `pension`, `pagas`, `ipc` · subida: `bruto`, `modo` (euros/porcentaje), `subida` · hipoteca: `precio`, `ahorro`, `anios`, `modalidad` (fija/variable), `tipo`, `diferencial`, `ingresos` · autónomos: `ingresos`, `gastos`, `forma` (persona/societario), `primer` (si/no).

**En cada red:**
- **TikTok**: con cuenta personal necesitas 1.000 seguidores para poner el enlace en el perfil. Hasta entonces, pon el dominio en el vídeo y en la descripción.
- **Instagram**: los carruseles de «guarda esto» (tablas de neto por sueldo) consiguen muchos guardados, y las historias con pegatina de enlace son lo que más clics lleva a la web.
- **Pinterest**: cada pin enlaza directo a la web y sigue trayendo visitas meses después. Sube las tablas como imágenes verticales.
- **Canal de WhatsApp o Telegram**: avisos de «ya es oficial: las pensiones suben X %».

## 3. Calendario de temas en tendencia

| Cuándo | Tema | Qué hacer |
|---|---|---|
| ~30 oct 2026 | IPC adelantado de octubre | Actualizar pensiones y subir un vídeo el mismo día |
| ~27 nov 2026 | IPC de noviembre: subida de 2027 casi cerrada | Página de pensiones + vídeo + canal |
| Diciembre | Paga extra de Navidad y salario mínimo 2027 | Guía 3 y vídeo de la paga extra |
| Enero 2027 | Nuevas cotizaciones: «¿por qué cobro menos en enero?» | Actualizar `params` y explicarlo |
| Abril-junio 2027 | Campaña de la Renta 2026 | Deducción del salario mínimo, dos pagadores |

Revisa Google Trends (España, últimas 24 h) cada mañana: cuando algo de dinero o empleo se dispare, publica ese mismo día una guía corta y un vídeo. Google Discover premia las páginas nuevas sobre temas en tendencia.
