# Plan de contenido y tráfico

## 1. Guías que escribir antes de pedir AdSense

Ordenadas por búsquedas y por lo que pagan sus anuncios. Cada una enlaza a su calculadora. Copia el formato de `src/pages/guias/salario-minimo-2026-neto.html`.

| # | Guía | Calculadora |
|---|---|---|
| 1 | Cuánto se cobra de paro con 1.000, 1.500 o 2.000 € de sueldo | Paro |
| 2 | Tabla IRPF 2026: cuánto te retienen según tu sueldo | Sueldo neto |
| 3 | Cuándo se cobra la paga extra de Navidad y cuánto es | Sueldo neto |
| 4 | Cuánto me quitan de la nómina: Seguridad Social e IRPF explicados | Sueldo neto |
| 5 | Baja voluntaria: qué cobras y cuánto preaviso tienes que dar | Finiquito |
| 6 | Cómo reclamar un finiquito mal calculado | Finiquito |
| 7 | Vacaciones no disfrutadas: cuántas te pagan al irte | Finiquito |
| 8 | Fin de contrato temporal: indemnización y paro | Finiquito y paro |
| 9 | Cómo pedir el paro paso a paso (y el plazo de 15 días) | Paro |
| 10 | Capitalizar el paro para hacerte autónomo | Paro |
| 11 | Subsidio por desempleo 2026: requisitos y cuantías | Paro |
| 12 | Cuándo se cobra la pensión de enero de 2027 | Pensiones |
| 13 | Pensiones mínimas 2026: cuantías y complemento a mínimos | Pensiones |
| 14 | 12 o 14 pagas: cuál te conviene | Sueldo neto |
| 15 | Dos pagadores: cuándo tienes que hacer la Renta | Sueldo neto |

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

Nombres de los parámetros: `bruto`, `pagas`, `contrato` (indefinido/temporal), `situacion` (1/2/3), `hijos`, `menores3`, `edad` · finiquito: `motivo`, `fechaInicio`, `fechaBaja`, `vacaciones`, `disfrutadas`, `devengo` · paro: `meses`, `hijos` · pensiones: `pension`, `pagas`, `ipc`.

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
