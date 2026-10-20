// Páginas de confianza: metodología (con casos de control que se comprueban en cada build)
// e historial de actualizaciones.
import { calcularNomina, cuotaEscala, reduccionRendimientosTrabajo } from '../static/js/calc/nomina.js';
import { calcularParo } from '../static/js/calc/paro.js';
import { indemnizacion } from '../static/js/calc/finiquito.js';
import { cuotaFrancesa } from '../static/js/calc/hipoteca.js';
import { calcularAutonomo } from '../static/js/calc/autonomos.js';
import { calcularPension } from '../static/js/calc/pensiones.js';
import { fecha } from '../static/js/calc/util.js';
import { DATOS, ENLACES, fechaLarga } from '../datos-oficiales.mjs';
import { ACTUALIZACIONES, PROXIMAS } from '../actualizaciones.mjs';

const fmt = (n, d = 2) => new Intl.NumberFormat('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }).format(n);
const eur = (n) => `${fmt(n)} €`;
const pct = (n) => `${fmt(n)} %`;
const ACTUALIZADO = ACTUALIZACIONES[0].fecha;

// Casos de control: resultado del motor frente a un valor de referencia publicado o legal.
export const CASOS = [
  { calc: 'Sueldo neto', caso: 'Retención con el salario mínimo (17.094 €), soltero/a sin hijos', resultado: () => pct(calcularNomina({ brutoAnual: 17094 }).irpf.tipo), esperado: '3,06 %', fuente: 'Retención publicada por AEDAF para el SMI de 2026' },
  { calc: 'Sueldo neto', caso: 'Escala de retención sobre una base de 24.000 €', resultado: () => eur(cuotaEscala(24000)), esperado: '5.365,50 €', fuente: 'Ejemplo del algoritmo de retenciones de la Agencia Tributaria' },
  { calc: 'Sueldo neto', caso: 'Reducción por rendimientos del trabajo con 18.000 €', resultado: () => eur(reduccionRendimientosTrabajo(18000)), esperado: '1.992,15 €', fuente: 'Ley del IRPF, artículo 20' },
  { calc: 'Sueldo neto', caso: 'Cotización anual con 30.000 € e indefinido', resultado: () => eur(calcularNomina({ brutoAnual: 30000 }).ss.anual), esperado: '1.950,00 €', fuente: '6,50 % de la Orden PJC/297/2026' },
  { calc: 'Paro', caso: 'Cuantía máxima sin hijos', resultado: () => eur(calcularParo({ brutoAnual: 40000, mesesCotizados: 72 }).primeros180.bruto), esperado: '1.225,00 €', fuente: 'SEPE: 175 % del IPREM con pagas extra' },
  { calc: 'Paro', caso: 'Cuantía mínima con hijos', resultado: () => eur(calcularParo({ brutoAnual: 8000, mesesCotizados: 72, hijos: 1 }).primeros180.bruto), esperado: '749,00 €', fuente: 'SEPE: 107 % del IPREM con pagas extra' },
  { calc: 'Paro', caso: 'Duración con 720 días cotizados', resultado: () => `${calcularParo({ brutoAnual: 20000, mesesCotizados: 24 }).dias} días`, esperado: '240 días', fuente: 'Ley General de la Seguridad Social, artículo 269' },
  { calc: 'Finiquito', caso: 'Despido improcedente tras 1 año con 24.000 €', resultado: () => eur(indemnizacion({ motivo: 'improcedente', inicio: fecha('2025-11-01'), baja: fecha('2026-10-31'), salarioDia: 24000 / 365 }).importe), esperado: '2.169,86 €', fuente: '33 días de salario por año (Estatuto de los Trabajadores, art. 56)' },
  { calc: 'Hipoteca', caso: '150.000 € a 25 años al 3 %', resultado: () => eur(Math.round(cuotaFrancesa(150000, 0.03, 25) * 100) / 100), esperado: '711,32 €', fuente: 'Fórmula del sistema francés' },
  { calc: 'Autónomos', caso: 'Rendimiento de 30.000 € al año (tramo 9)', resultado: () => eur(calcularAutonomo({ rendimientoAnual: 30000 }).cuotaMinima), esperado: '401,47 €', fuente: 'Base mínima de 1.274,51 € × 31,5 % (Orden PJC/297/2026)' },
  { calc: 'Autónomos', caso: 'Cuota mínima del tramo 1', resultado: () => eur(calcularAutonomo({ rendimientoAnual: 5000 }).cuotaMinima), esperado: '205,88 €', fuente: 'Base mínima de 653,59 € × 31,5 %' },
  { calc: 'Pensiones', caso: 'Pensión máxima de 2027 con una subida del 3,5 %', resultado: () => eur(calcularPension({ pensionMensual: 3359.6, subida: 0.035 }).nueva), esperado: '3.481,05 €', fuente: 'Revalorización más 0,115 puntos (reforma de 2023)' },
];

const tabla = (cab, filas) => `<div class="tabla-envoltura"><table>
  <thead><tr>${cab.map((c) => `<th>${c}</th>`).join('')}</tr></thead>
  <tbody>${filas.map((f) => `<tr>${f.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('\n')}</tbody>
</table></div>`;

const ICONO_OK = '<svg class="ok" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9"/><path d="M6 10.4l2.6 2.6L14 7.4"/></svg>';

function metodologia() {
  const comprobaciones = CASOS.map((c) => {
    const obtenido = c.resultado();
    if (obtenido !== c.esperado) {
      throw new Error(`Comprobación fallida (${c.calc}: ${c.caso}): da ${obtenido} y debería dar ${c.esperado}`);
    }
    return `<li class="comprobacion">
      <div><span class="chip">${c.calc}</span><p class="comprobacion-caso">${c.caso}</p><p class="tabla-nota">Referencia: ${c.fuente}</p></div>
      <div class="comprobacion-resultado"><strong>${obtenido}</strong><span class="comprobado">${ICONO_OK}Coincide (${c.esperado})</span></div>
    </li>`;
  }).join('\n    ');
  const datos = DATOS.map((d) => `<li class="comprobacion">
      <div><p class="comprobacion-caso">${d.dato}</p><p class="tabla-nota">${d.detalle}</p></div>
      <div class="comprobacion-resultado"><strong>${d.valor}</strong><span class="tabla-nota">${d.enlace ? `<a href="${d.enlace}" rel="noopener">${d.fuente}</a>` : d.fuente} · ${fechaLarga(d.fecha)}</span></div>
    </li>`).join('\n    ');

  const limites = [
    ['sueldo-neto', 'Sueldo neto y tabla de sueldos', 'Retención de IRPF según el algoritmo oficial de la Agencia Tributaria (gastos, reducción por rendimientos del trabajo, mínimos por edad e hijos, límites sin retención, límite del 43 % y mínimo del 2 % en temporales) y cotizaciones de 2026, incluida la de solidaridad.', 'Discapacidad, ascendientes a cargo, movilidad geográfica, pensiones compensatorias, retribución en especie y regularizaciones a mitad de año.'],
    ['subida-sueldo', 'Subida de sueldo', 'El mismo motor que el sueldo neto, aplicado antes y después de la subida.', 'Los mismos casos que el sueldo neto, y las ayudas que dependen de tus ingresos.'],
    ['hipoteca', 'Hipoteca', 'Sistema francés de cuota constante, Euríbor oficial más diferencial, préstamo máximo con el 35 % de los ingresos netos y gastos de compra estimados en un 10 % del precio.', 'Comisiones, seguros vinculados (por eso no calcula la TAE), hipotecas mixtas y el ITP exacto de cada comunidad autónoma.'],
    ['autonomos', 'Cuota de autónomos', 'Los 15 tramos de 2026, la deducción del 7 % (3 % en societarios), la base mínima de los societarios y la tarifa plana.', 'La regularización posterior de la Seguridad Social, bonificaciones específicas y el pluriempleo.'],
    ['finiquito', 'Finiquito e indemnización', 'Salario pendiente, vacaciones, pagas extra con devengo semestral o anual e indemnizaciones con sus topes, incluido el régimen de los contratos anteriores al 12 de febrero de 2012.', 'Mejoras de tu convenio, salarios de tramitación, despidos nulos y la retención de IRPF del finiquito.'],
    ['paro', 'Paro', 'Duración según los días cotizados, el 70 % y el 60 % de la base reguladora y los mínimos y máximos con el IPREM de 2026.', 'Jornada parcial (reduce los topes), la retención de IRPF, el subsidio y la compatibilidad con un trabajo.'],
    ['pensiones', 'Pensiones 2027', 'La regla de la Ley 21/2021 (media del IPC interanual de diciembre a noviembre) y el ajuste especial de la pensión máxima.', 'Las pensiones mínimas y no contributivas, que se fijan por decreto y suelen subir más.'],
  ].map(([id, nombre, si, no]) => `<h3 id="${id}">${nombre}</h3>
    <ul class="lista-limites"><li><strong>Tiene en cuenta:</strong> ${si}</li><li><strong>No tiene en cuenta:</strong> ${no}</li></ul>`).join('\n    ');

  return {
    rel: 'metodologia.html',
    raw: `---
title: Metodología y comprobaciones | AlNeto
description: Cómo calcula AlNeto cada resultado, qué datos oficiales usa, qué tiene en cuenta cada calculadora y los casos de control que se comprueban en cada actualización.
breadcrumb: Metodología
updated: ${ACTUALIZADO}
---
<section class="cabecera-pagina">
  <div class="contenedor">
    <nav class="migas" aria-label="Estás en"><a href="/">Inicio</a> › Metodología</nav>
    <header class="intro">
      <span class="eyebrow">${ICONO_OK}${CASOS.length} de ${CASOS.length} comprobaciones superadas</span>
      <h1>Metodología y comprobaciones</h1>
      <p class="lead">Una calculadora de dinero solo sirve si te puedes fiar de ella. Aquí está todo: de dónde salen las cifras, qué tiene en cuenta cada cálculo y los casos con los que lo comprobamos cada vez que actualizamos la web.</p>
      <p class="sello"><span>Revisado el {{actualizado}}</span><span>Datos de fuentes oficiales</span></p>
    </header>
  </div>
</section>
<div class="contenedor">
  <div class="articulo-rejilla">
  <article class="prosa">
    <h2>Nuestros principios</h2>
    <ul>
      <li><strong>Solo fuentes oficiales.</strong> BOE, Agencia Tributaria, Seguridad Social, SEPE, INE y Banco de España. Cada página indica la norma que aplica.</li>
      <li><strong>Un único motor de cálculo.</strong> Las calculadoras, las tablas de los artículos y las páginas de sueldo usan exactamente las mismas funciones, así que nunca se contradicen.</li>
      <li><strong>Comprobado en cada actualización.</strong> Antes de publicar cualquier cambio se ejecutan pruebas automáticas y los casos de control de esta página. Si alguno no coincide con la referencia, la web no se publica.</li>
      <li><strong>Privado.</strong> Los cálculos se hacen en tu navegador: lo que escribes no se envía a ningún servidor.</li>
      <li><strong>Con fecha.</strong> Cada página dice cuándo se revisó y el <a href="/actualizaciones/">historial de actualizaciones</a> recoge cada cambio de cifras.</li>
    </ul>

    <h2>Casos de control</h2>
    <p>Estos resultados se recalculan en cada actualización de la web y se comparan con un valor de referencia publicado o que sale directamente de la norma:</p>
    <ul class="comprobaciones">
    ${comprobaciones}
    </ul>

    <h2>Datos oficiales que usamos</h2>
    <ul class="comprobaciones">
    ${datos}
    </ul>

    <h2>Qué tiene en cuenta cada calculadora</h2>
    <p>Ninguna calculadora puede recoger todos los casos. Esto es lo que entra en cada cálculo y lo que se queda fuera:</p>
    ${limites}

    <h2>Si ves un error</h2>
    <p>Si un resultado no coincide con tu nómina, tu carta del SEPE o la oferta de tu banco, <a href="/contacto/">escríbeme</a> con los datos que usaste. Reviso cada aviso y, si hay un error, lo corrijo y lo apunto en el <a href="/actualizaciones/">historial</a>.</p>
    {{autoria}}
  </article>
  <aside class="indice">{{toc}}</aside>
  </div>
</div>
`,
  };
}

function actualizaciones() {
  const entradas = ACTUALIZACIONES.map((a) => `<li class="hito">
      <time datetime="${a.fecha}">${fechaLarga(a.fecha)}</time>
      <h3>${a.titulo}</h3>
      <p>${a.detalle}</p>
    </li>`).join('\n    ');
  const proximas = tabla(['Fecha aproximada', 'Dato', 'Qué se actualiza'], PROXIMAS.map((p) => [fechaLarga(p.fecha), p.dato, p.afecta]));
  return {
    rel: 'actualizaciones.html',
    raw: `---
title: Historial de actualizaciones | AlNeto
description: Cada cambio de cifras y de calculadoras de AlNeto, con su fecha, y las próximas revisiones previstas cuando se publiquen nuevos datos oficiales.
breadcrumb: Actualizaciones
updated: ${ACTUALIZADO}
---
<section class="cabecera-pagina">
  <div class="contenedor">
    <nav class="migas" aria-label="Estás en"><a href="/">Inicio</a> › Actualizaciones</nav>
    <header class="intro">
      <span class="eyebrow">Última actualización: {{actualizado}}</span>
      <h1>Historial de actualizaciones</h1>
      <p class="lead">Cada vez que cambia una cifra oficial o mejoramos una calculadora, queda apuntado aquí con su fecha.</p>
    </header>
  </div>
</section>
<div class="contenedor">
  <div class="articulo-rejilla">
  <article class="prosa">
    <h2>Cambios</h2>
    <ol class="cronologia">
    ${entradas}
    </ol>

    <h2>Próximas revisiones</h2>
    <p>Fechas en las que se publican datos oficiales que afectan a las calculadoras:</p>
    ${proximas}
    <p>Consulta la <a href="/metodologia/">metodología</a> para ver qué datos usa cada calculadora y cómo se comprueban.</p>
  </article>
  <aside class="indice">{{toc}}</aside>
  </div>
</div>
`,
  };
}

export const paginas = () => [metodologia(), actualizaciones()];
