// Una página por sueldo bruto anual («30.000 € brutos: cuánto es neto»), más el índice
// /sueldo-neto/. Todo se calcula con el mismo motor que la calculadora, y cada página
// explica su caso concreto (tramo, límites, deducciones), no solo cambia la cifra.
import { calcularNomina } from '../static/js/calc/nomina.js';
import { SMI, SALARIOS_INE, SS } from '../static/js/calc/params-2026.js';
import { graficoLinea } from '../static/js/graficos.js';

export const SUELDOS = [
  ...Array.from({ length: 37 }, (_, i) => 14000 + i * 1000), // 14.000 – 50.000
  ...Array.from({ length: 15 }, (_, i) => 52000 + i * 2000), // 52.000 – 80.000
  85000, 90000, 95000, 100000, 120000, 150000,
];

const ACTUALIZADO = '2026-10-20';
const HORAS_ANUALES = 1790; // 40 h semanales descontando vacaciones y festivos (aprox.)

const fmt = (n, d = 2) => new Intl.NumberFormat('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }).format(n);
const eur = (n, d = 2) => `${fmt(n, d)} €`;
const pct = (n, d = 2) => `${fmt(n, d)} %`;
const miles = (n) => fmt(n, 0);
export const slugSueldo = (b) => `/sueldo-neto/${b}-euros-brutos/`;

// Curva «de cada euro bruto, cuántos céntimos te quedan» con un sueldo destacado.
const curvaCentimos = (destacado) => {
  const tope = Math.max(100000, destacado ?? 0);
  const puntos = SUELDOS.filter((x) => x <= tope).map((x) => {
    const r = calcularNomina({ brutoAnual: x, pagas: 14 });
    const y = (r.netoAnual / x) * 100;
    return { x, y, tx: `${eur(x, 0)} brutos al año`, ty: `${fmt(y, 1)} céntimos de cada euro` };
  });
  const marca = destacado ? puntos.find((p) => p.x === destacado) : null;
  return graficoLinea({
    id: 'grafico-centimos',
    titulo: 'De cada euro bruto, cuántos céntimos te quedan',
    subtitulo: 'Sueldo neto ÷ sueldo bruto, según el sueldo anual (2026)',
    nota: 'Soltero/a sin hijos con contrato indefinido. La curva baja porque el IRPF es progresivo; se aplana al superar el tope de cotización.',
    puntos,
    destacado: marca,
    etiquetaDestacado: marca ? `${eur(destacado, 0)}: ${fmt(marca.y, 0)} céntimos` : '',
    yMin: 50,
    yMax: 100,
    nTicksY: 5,
    formatoY: (t) => `${fmt(t, 0)} cts`,
    formatoX: (x) => `${fmt(x / 1000, 0)} mil €`,
    ticksX: [20000, 40000, 60000, 80000, 100000, ...(tope > 100000 ? [tope] : [])],
  });
};

const tabla = (cab, filas, pie = '') => `<div class="tabla-envoltura"><table>
  <thead><tr>${cab.map((c, i) => `<th${i ? ' class="n"' : ''}>${c}</th>`).join('')}</tr></thead>
  <tbody>${filas.map((f) => `<tr>${f.map((c, i) => `<td${i ? ' class="n"' : ''}>${c}</td>`).join('')}</tr>`).join('\n')}</tbody>
  ${pie ? `<caption>${pie}</caption>` : ''}
</table></div>`;

const comparaConINE = (b) => {
  const frase = (ref, nombre) => {
    const d = (b / ref - 1) * 100;
    if (Math.abs(d) < 2) return `prácticamente igual que el ${nombre} (${eur(ref, 0)})`;
    return `un ${pct(Math.abs(d), 0)} ${d > 0 ? 'por encima' : 'por debajo'} del ${nombre} (${eur(ref, 0)})`;
  };
  return `Según la Encuesta Anual de Estructura Salarial del INE (datos de ${SALARIOS_INE.anio}), un sueldo de ${eur(b, 0)} está ${frase(SALARIOS_INE.mediana, 'salario mediano')} y ${frase(SALARIOS_INE.media, 'salario medio')}. El mediano es el que deja a la mitad de los asalariados por encima y a la otra mitad por debajo, y es la mejor referencia: la media la suben unos pocos sueldos muy altos.`;
};

function pagina(b, i) {
  const r14 = calcularNomina({ brutoAnual: b, pagas: 14 });
  const r12 = calcularNomina({ brutoAnual: b, pagas: 12 });
  const mas = calcularNomina({ brutoAnual: b + 1000, pagas: 14 });
  const extraNeto = mas.netoAnual - r14.netoAnual;
  const centimos = Math.round((r14.netoAnual / b) * 100);
  const vecinos = SUELDOS.slice(Math.max(0, i - 3), i + 4).filter((x) => x !== b);

  const familias = [
    ['Soltero/a sin hijos', {}],
    ['1 hijo (compartido)', { hijos: 1 }],
    ['2 hijos (compartidos)', { hijos: 2 }],
    ['Monoparental con 1 hijo', { situacion: 1, hijos: 1 }],
    ['Cónyuge sin ingresos y 2 hijos', { situacion: 2, hijos: 2 }],
    ['Contrato temporal', { contrato: 'temporal' }],
    ['65 años o más', { edad: '65a74' }],
  ].map(([nombre, datos]) => {
    const r = calcularNomina({ brutoAnual: b, pagas: 14, ...datos });
    return [nombre, pct(r.irpf.tipo), eur(r.netoMensual), eur(r.netoAnual, 0)];
  });

  // Párrafos que cambian según el caso: es lo que hace útil cada página por separado.
  const notas = [];
  if (b < SMI.anual) {
    notas.push(`<p>Ojo: ${eur(b, 0)} al año está por debajo del salario mínimo de 2026 (${eur(SMI.anual, 0)}). Solo es legal con jornada parcial; a jornada completa la empresa tendría que pagarte al menos el salario mínimo.</p>`);
  }
  if (r14.irpf.motivo === 'exento') {
    notas.push(`<p><strong>No te retienen IRPF.</strong> Para un soltero sin hijos, la empresa no tiene que retener nada si el sueldo no pasa de ${eur(r14.irpf.limiteExcluyente, 0)} al año, y ${eur(b, 0)} está por debajo.</p>`);
  } else if (r14.irpf.tipo < 8) {
    notas.push(`<p>La retención es baja porque tu sueldo está cerca del límite sin retención (${eur(r14.irpf.limiteExcluyente, 0)}): la ley impide que la retención pase del 43 % de lo que superes ese límite, para que no haya saltos bruscos.</p>`);
  }
  if (r14.deduccionRenta > 0 && r14.irpf.anual > 0) {
    const cubre = r14.deduccionRenta >= r14.irpf.anual * 0.5;
    notas.push(`<p>Además, con este sueldo puedes aplicar en la Renta la <strong>deducción para sueldos bajos</strong> de 2026, de hasta ${eur(r14.deduccionRenta)}${cubre
      ? `, así que es probable que Hacienda te devuelva buena parte de los ${eur(r14.irpf.anual)} retenidos`
      : `: poco frente a los ${eur(r14.irpf.anual)} retenidos, pero son euros que se restan de lo que pagas`}. Lee cómo funciona en la <a href="/guias/salario-minimo-2026-neto/">guía del salario mínimo</a>.</p>`);
  }
  if (r14.irpf.reduccion > 0 && r14.irpf.motivo !== 'exento') {
    notas.push(`<p>Tu retención se beneficia de la <strong>reducción por rendimientos del trabajo</strong> (${eur(r14.irpf.reduccion)}), que solo tienen los sueldos que no superan unos 21.100 € brutos. Por eso, en esta zona, cada euro extra de sueldo hace subir bastante la retención.</p>`);
  }
  if (r14.ss.topeAlcanzado) {
    notas.push(`<p>Tu sueldo supera la base máxima de cotización (${eur(SS.baseMaxMensual)} al mes en 2026): solo cotizas por ese tope, más una pequeña <strong>cotización de solidaridad</strong> (${eur(r14.ss.solidaridadMensual)} al mes) por lo que lo supera.</p>`);
  }

  const brutoMes14 = b / 14;
  const brutoMes12 = b / 12;
  const titulo = `${eur(b, 0)} brutos al año: cuánto es neto en 2026`;

  return {
    rel: `sueldo-neto/${b}-euros-brutos.html`,
    raw: `---
title: ${titulo}
description: Con ${eur(b, 0)} brutos al año cobras ${eur(r14.netoMensual)} netos al mes en 14 pagas (${eur(r12.netoMensual)} en 12). Desglose de IRPF y Seguridad Social de 2026 y cómo cambia con hijos.
type: dato
script: graficos
metodo: sueldo-neto
breadcrumb: ${eur(b, 0)} brutos
parent: Sueldo neto|/sueldo-neto/
updated: ${ACTUALIZADO}
---
<section class="cabecera-pagina">
  <div class="contenedor">
    <nav class="migas" aria-label="Estás en"><a href="/">Inicio</a> › <a href="/sueldo-neto/">Sueldo neto</a> › ${eur(b, 0)} brutos</nav>
    <header class="intro">
      <span class="eyebrow">Sueldo neto 2026</span>
      <h1>${titulo}</h1>
      <p class="lead">Con un sueldo de <strong>${eur(b, 0)} brutos al año</strong> te llegan <strong>${eur(r14.netoMensual)} netos al mes</strong> si cobras en 14 pagas, o ${eur(r12.netoMensual)} si cobras en 12. En total, ${eur(r14.netoAnual, 0)} netos al año.</p>
      <p class="sello"><span>IRPF y cotizaciones de 2026</span><span>Actualizado el {{actualizado}}</span></p>
    </header>
  </div>
</section>

<div class="contenedor">
  <div class="cifras">
    <div class="cifra-tarjeta cifra-destacada"><span>Neto al mes (14 pagas)</span><strong>${eur(r14.netoMensual)}</strong><small>y 2 pagas extra de ${eur(r14.netoPagaExtra)}</small></div>
    <div class="cifra-tarjeta"><span>Neto al mes (12 pagas)</span><strong>${eur(r12.netoMensual)}</strong><small>con las extras prorrateadas</small></div>
    <div class="cifra-tarjeta"><span>Retención de IRPF</span><strong>${pct(r14.irpf.tipo)}</strong><small>${eur(r14.irpf.anual, 0)} al año</small></div>
    <div class="cifra-tarjeta"><span>Seguridad Social</span><strong>${eur(r14.ss.mensual)}</strong><small>al mes (${pct(r14.ss.tipo * 100)})</small></div>
  </div>

  <div class="articulo-rejilla">
  <article class="prosa">
    <h2>Desglose de ${eur(b, 0)} brutos en 2026</h2>
    ${tabla(['Concepto', 'Al año', 'Al mes (14 pagas)', 'Al mes (12 pagas)'], [
      ['Sueldo bruto', eur(b), eur(brutoMes14), eur(brutoMes12)],
      [`Seguridad Social (${pct(r14.ss.tipo * 100)})`, `− ${eur(r14.ss.anual)}`, `− ${eur(r14.ss.mensual)}`, `− ${eur(r12.ss.mensual)}`],
      [`Retención IRPF (${pct(r14.irpf.tipo)})`, `− ${eur(r14.irpf.anual)}`, `− ${eur(brutoMes14 * r14.irpf.tipo / 100)}`, `− ${eur(brutoMes12 * r12.irpf.tipo / 100)}`],
      ['<strong>Sueldo neto</strong>', `<strong>${eur(r14.netoAnual)}</strong>`, `<strong>${eur(r14.netoMensual)}</strong>`, `<strong>${eur(r12.netoMensual)}</strong>`],
    ], 'Contrato indefinido, soltero/a sin hijos y menor de 65 años. En 14 pagas, las pagas extra de junio y diciembre solo llevan IRPF.')}
    <p>De cada euro bruto te quedas unos <strong>${centimos} céntimos</strong>. Equivale a ${eur(brutoMes14)} brutos al mes en 14 pagas o ${eur(brutoMes12)} en 12, y a unos ${eur(b / HORAS_ANUALES)} brutos (${eur(r14.netoAnual / HORAS_ANUALES)} netos) por hora con jornada completa.</p>
    ${curvaCentimos(b)}
    ${notas.join('\n    ')}

    <h2>Si te suben 1.000 € al año</h2>
    <p>Pasar de ${eur(b, 0)} a ${eur(b + 1000, 0)} brutos te deja <strong>${eur(extraNeto)} netos más al año</strong> (${eur(extraNeto / 14)} más en cada una de las 14 pagas). Es decir, te llega el ${pct((extraNeto / 1000) * 100, 0)} de la subida. ${r14.irpf.tipoMarginal >= 0.3 ? `Estás en el tramo del ${pct(r14.irpf.tipoMarginal * 100, 0)} de la escala del IRPF: el último euro que ganas tributa a ese tipo, aunque tu retención media sea del ${pct(r14.irpf.tipo)}.` : 'Lo que no te llega se va en IRPF y cotizaciones.'} Prueba otras cifras en la <a href="/calculadora-subida-sueldo/">calculadora de subida de sueldo</a>.</p>

    <h2>Cuánto cobras con ${eur(b, 0)} según tu situación</h2>
    <p>La retención cambia con la familia y el contrato. Si tienes hijos con el otro progenitor, cada uno aplica la mitad del mínimo por hijos; si los crías solo o tu cónyuge no tiene ingresos, lo aplicas entero.</p>
    ${tabla(['Situación', 'Retención', 'Neto al mes (14 pagas)', 'Neto al año'], familias)}

    <h2>¿Es un buen sueldo?</h2>
    <p>${comparaConINE(b)} También equivale a ${fmt(b / SMI.anual, 1)} veces el salario mínimo de 2026 (${eur(SMI.anual, 0)}).</p>

    <h2>Sueldos parecidos</h2>
    ${tabla(['Bruto anual', 'Neto al mes (14 pagas)', 'Neto al mes (12 pagas)', 'Retención'], vecinos.map((x) => {
      const a = calcularNomina({ brutoAnual: x, pagas: 14 });
      const c = calcularNomina({ brutoAnual: x, pagas: 12 });
      return [`<a href="${slugSueldo(x)}">${eur(x, 0)}</a>`, eur(a.netoMensual), eur(c.netoMensual), pct(a.irpf.tipo)];
    }))}

    <h2>Preguntas frecuentes</h2>
    <div class="faq">
      <details>
        <summary>¿Cuánto son ${eur(b, 0)} brutos al mes?</summary>
        <div><p>${eur(brutoMes14)} brutos al mes si cobras en 14 pagas, o ${eur(brutoMes12)} en 12. En neto, ${eur(r14.netoMensual)} y ${eur(r12.netoMensual)} respectivamente.</p></div>
      </details>
      <details>
        <summary>¿Cuánto IRPF me retienen con ${eur(b, 0)}?</summary>
        <div><p>Un ${pct(r14.irpf.tipo)} si estás soltero, sin hijos y con contrato indefinido: ${eur(r14.irpf.anual)} al año. Con hijos o con el cónyuge a cargo, menos (mira la tabla de arriba). Es un adelanto: el impuesto definitivo se ajusta en la declaración de la Renta.</p></div>
      </details>
      <details>
        <summary>¿Por qué mi nómina no coincide exactamente?</summary>
        <div><p>Tu nómina puede llevar pluses, horas extra, retribución en especie o una regularización de IRPF a mitad de año. Ajusta tu caso en la <a href="/calculadora-sueldo-neto/?bruto=${b}">calculadora de sueldo neto</a>.</p></div>
      </details>
    </div>

    {{autoria}}

    <div class="fuentes">
      <p><strong>Cómo está calculado:</strong> algoritmo de retenciones de la Agencia Tributaria y bases y tipos de cotización de 2026 (Orden PJC/297/2026). Comparativa salarial: Encuesta Anual de Estructura Salarial ${SALARIOS_INE.anio} del INE. Ver <a href="/calculadora-sueldo-neto/">la calculadora</a> para todos los detalles y la normativa.</p>
    </div>
  </article>
  <aside class="indice">{{toc}}</aside>
  </div>

  <section class="relacionadas">
    <div class="cta-final">
      <div>
        <h2>¿Tu caso es distinto?</h2>
        <p>Calcula tu sueldo neto con tus hijos, tu contrato y tu edad.</p>
      </div>
      <a class="boton boton-claro" href="/calculadora-sueldo-neto/?bruto=${b}">Calcular con mis datos</a>
    </div>
  </section>
</div>
`,
  };
}

function indice() {
  const filas = SUELDOS.map((b) => {
    const a = calcularNomina({ brutoAnual: b, pagas: 14 });
    const c = calcularNomina({ brutoAnual: b, pagas: 12 });
    return [`<a href="${slugSueldo(b)}">${eur(b, 0)}</a>`, eur(a.netoMensual), eur(c.netoMensual), pct(a.irpf.tipo), eur(a.netoAnual, 0)];
  });
  const mensuales = [1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2200, 2400, 2500, 2800, 3000, 3500, 4000, 5000].map((m) => {
    const a = calcularNomina({ brutoAnual: m * 14, pagas: 14 });
    const c = calcularNomina({ brutoAnual: m * 12, pagas: 12 });
    return [eur(m, 0), eur(a.netoMensual), eur(c.netoMensual)];
  });
  return {
    rel: 'sueldo-neto/index.html',
    raw: `---
title: Tabla de sueldo neto 2026: de bruto a neto | AlNeto
description: Tabla con el sueldo neto de 2026 para cada sueldo bruto, de ${miles(SUELDOS[0])} a ${miles(SUELDOS.at(-1))} € al año y de 1.200 a 5.000 € al mes, con la retención de IRPF de cada uno.
type: dato
script: graficos
breadcrumb: Sueldo neto
updated: ${ACTUALIZADO}
---
<section class="cabecera-pagina">
  <div class="contenedor">
    <nav class="migas" aria-label="Estás en"><a href="/">Inicio</a> › Sueldo neto</nav>
    <header class="intro">
      <span class="eyebrow">Tabla 2026</span>
      <h1>Tabla de sueldo neto 2026, sueldo a sueldo</h1>
      <p class="lead">Busca tu sueldo bruto y mira cuánto te llega cada mes. Cada sueldo tiene su página con el desglose completo, cómo cambia con hijos y cuánto ganarías con una subida.</p>
      <p class="sello"><span>IRPF y cotizaciones de 2026</span><span>Actualizado el {{actualizado}}</span></p>
    </header>
  </div>
</section>
<div class="contenedor">
  <div class="articulo-rejilla">
  <article class="prosa">
    <h2>Cuánto te queda de cada euro</h2>
    ${curvaCentimos(null)}

    <h2>Sueldo neto según el bruto anual</h2>
    ${tabla(['Bruto anual', 'Neto al mes (14 pagas)', 'Neto al mes (12 pagas)', 'Retención', 'Neto al año'], filas, 'Contrato indefinido, soltero/a sin hijos y menor de 65 años.')}

    <h2>Sueldo neto según el bruto mensual</h2>
    <p>Si sabes tu bruto mensual pero no el anual, esta es la equivalencia:</p>
    ${tabla(['Bruto al mes', 'Neto (si son 14 pagas)', 'Neto (si son 12 pagas)'], mensuales, 'Ojo: 1.500 € brutos en 14 pagas son 21.000 € al año; en 12 pagas, 18.000 €.')}

    <h2>Cómo leer esta tabla</h2>
    <p>El neto es el bruto menos la cotización a la Seguridad Social (6,50 % con contrato indefinido) y la retención de IRPF, que crece con el sueldo. Con hijos, cónyuge a cargo o 65 años o más, la retención baja. Para tu caso exacto, usa la <a href="/calculadora-sueldo-neto/">calculadora de sueldo neto</a>.</p>
    {{autoria}}
  </article>
  <aside class="indice">{{toc}}</aside>
  </div>
</div>
`,
  };
}

export const paginas = () => [indice(), ...SUELDOS.map(pagina)];
