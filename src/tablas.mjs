// Tablas que se generan en el build con las MISMAS funciones que usan las calculadoras,
// así los ejemplos del texto nunca contradicen al resultado. Se usan como {{tabla:nombre}}.
import { calcularNomina } from './static/js/calc/nomina.js';
import { calcularParo, topesParo } from './static/js/calc/paro.js';
import { indemnizacion } from './static/js/calc/finiquito.js';
import { compararSueldos } from './static/js/calc/subida.js';
import { cuotaFrancesa, capitalParaCuota } from './static/js/calc/hipoteca.js';
import { HIPOTECA, AUTONOMOS } from './static/js/calc/params-2026.js';
import { DATOS, fechaLarga } from './datos-oficiales.mjs';
import { CASOS } from './generadores/confianza.mjs';
import { fecha } from './static/js/calc/util.js';
import { calcularPension, pensionMaxima2027 } from './static/js/calc/pensiones.js';
import { SS, IRPF, PARO, PENSIONES } from './static/js/calc/params-2026.js';

const eur = (n, decimales = 2) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: decimales, maximumFractionDigits: decimales, useGrouping: 'always' }).format(n);
const pct = (n, d = 2) => `${n.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d })} %`;
const miles = (n) => n.toLocaleString('es-ES', { useGrouping: 'always' });

const tabla = (cabeceras, filas, pie = '') => `<div class="tabla-envoltura"><table>
  <thead><tr>${cabeceras.map((c, i) => `<th${i ? ' class="n"' : ''}>${c}</th>`).join('')}</tr></thead>
  <tbody>${filas.map((f) => `<tr>${f.map((c, i) => `<td${i ? ' class="n"' : ''}>${c}</td>`).join('')}</tr>`).join('\n')}</tbody>
  ${pie ? `<caption>${pie}</caption>` : ''}
</table></div>`;

export const tablas = {
  // Datos sueltos para usar dentro del texto
  'smi-neto-mensual': () => eur(calcularNomina({ brutoAnual: 17094, pagas: 14 }).netoMensual),
  'neto-30000': () => eur(calcularNomina({ brutoAnual: 30000, pagas: 14 }).netoMensual),
  'irpf-30000': () => pct(calcularNomina({ brutoAnual: 30000 }).irpf.tipo),
  'ss-30000': () => eur(calcularNomina({ brutoAnual: 30000 }).ss.mensual),
  'anual-30000': () => eur(calcularNomina({ brutoAnual: 30000 }).netoAnual, 0),
  'paro-24000': () => eur(calcularParo({ brutoAnual: 24000, mesesCotizados: 72 }).primeros180.bruto),

  'smi-2026': () => {
    const r14 = calcularNomina({ brutoAnual: 17094, pagas: 14 });
    const r12 = calcularNomina({ brutoAnual: 17094, pagas: 12 });
    return tabla(
      ['Salario mínimo 2026', 'Bruto', 'Neto (soltero/a, sin hijos)'],
      [
        ['Al mes en 14 pagas', eur(1221), eur(r14.netoMensual)],
        ['Paga extra (junio y diciembre)', eur(1221), eur(r14.netoPagaExtra)],
        ['Al mes en 12 pagas', eur(17094 / 12), eur(r12.netoMensual)],
        ['Al año', eur(17094), eur(r14.netoAnual)],
      ],
      `Con contrato indefinido: ${pct(r14.ss.tipo * 100)} de Seguridad Social y ${pct(r14.irpf.tipo)} de retención de IRPF.`,
    );
  },

  'despidos-ejemplos': () => {
    const baja = fecha('2026-10-31');
    const salarioDia = 24000 / 365;
    const anios = [1, 2, 3, 5, 8, 10, 12, 14];
    const calc = (motivo, n) =>
      indemnizacion({ motivo, inicio: fecha(`${2026 - n}-11-01`), baja, salarioDia });
    return tabla(
      ['Antigüedad', 'Fin de contrato temporal (12 días)', 'Despido objetivo (20 días)', 'Despido improcedente (33 días)'],
      anios.map((n) => [
        `${n} ${n === 1 ? 'año' : 'años'}`,
        eur(calc('fin-temporal', n).importe),
        eur(calc('objetivo', n).importe),
        eur(calc('improcedente', n).importe),
      ]),
      'Sueldo de 24.000 € brutos al año, con antigüedad posterior a febrero de 2012. Los topes de 12 y 24 mensualidades ya están aplicados.',
    );
  },

  'subida-ejemplos': () =>
    tabla(
      ['Sueldo actual', 'Con 2.000 € más', 'Más al mes (neto, 14 pagas)', 'Más al año (neto)', 'Te llega'],
      [16000, 18000, 20000, 25000, 30000, 35000, 40000, 50000, 60000, 80000].map((b) => {
        const r = compararSueldos(b, b + 2000);
        return [eur(b, 0), eur(b + 2000, 0), `+ ${eur(r.subidaNetaMensual)}`, `+ ${eur(r.subidaNetaAnual)}`, pct(r.aprovechamiento * 100, 0)];
      }),
      'Contrato indefinido, soltero/a sin hijos. «Te llega» es la parte de la subida bruta que acaba en tu cuenta.',
    ),

  'hipoteca-plazos': () =>
    tabla(
      ['Plazo', 'Cuota al mes', 'Intereses totales', 'Total pagado'],
      [15, 20, 25, 30, 35, 40].map((anios) => {
        const c = cuotaFrancesa(150000, 0.029, anios);
        return [`${anios} años`, eur(c), eur(c * anios * 12 - 150000, 0), eur(c * anios * 12, 0)];
      }),
      'Préstamo de 150.000 € a tipo fijo del 2,90 %. Más plazo baja la cuota, pero dispara los intereses.',
    ),

  'hipoteca-tipos': () =>
    tabla(
      ['Tipo de interés', 'Cuota al mes', 'Intereses totales'],
      [0.02, 0.025, 0.029, 0.035, 0.04, 0.045, 0.05].map((t) => {
        const c = cuotaFrancesa(150000, t, 25);
        return [pct(t * 100), eur(c), eur(c * 300 - 150000, 0)];
      }),
      'Préstamo de 150.000 € a 25 años.',
    ),

  'euribor-actual': () => pct(HIPOTECA.euribor * 100, 3),
  'euribor-mes': () => HIPOTECA.euriborMes,
  'mes-tipos': () => HIPOTECA.mesTiposMedios,
  'tipo-medio-fijo': () => pct(HIPOTECA.tipoMedioFijo * 100),

  'autonomos-tramos': () =>
    tabla(
      ['Tramo', 'Rendimiento neto al mes', 'Base mínima', 'Cuota mínima', 'Cuota máxima'],
      AUTONOMOS.tramos.map((t, i) => {
        const desde = i === 0 ? 0 : AUTONOMOS.tramos[i - 1].hasta;
        const rango = t.hasta === Infinity ? `Más de ${eur(desde)}` : i === 0 ? `Hasta ${eur(t.hasta)}` : `${eur(desde)} – ${eur(t.hasta)}`;
        return [String(i + 1), rango, eur(t.min), eur(t.min * AUTONOMOS.tipo), eur(t.max * AUTONOMOS.tipo)];
      }),
      'Orden PJC/297/2026. Cuota = base elegida × 31,5 % (incluye el MEI). Los tramos 1 a 3 forman la tabla reducida.',
    ),

  // ----- Guías -----
  'irpf-por-sueldo': () => {
    const casos = [{}, { hijos: 1 }, { hijos: 2 }, { situacion: 1, hijos: 1 }, { situacion: 2, hijos: 2 }];
    return tabla(
      ['Sueldo bruto', 'Sin hijos', '1 hijo', '2 hijos', 'Monoparental, 1 hijo', 'Cónyuge sin ingresos, 2 hijos'],
      [15000, 16000, 17094, 18000, 20000, 22000, 24000, 26000, 28000, 30000, 33000, 36000, 40000, 45000, 50000, 60000, 70000, 80000, 100000].map((b) =>
        [eur(b, 0), ...casos.map((c) => pct(calcularNomina({ brutoAnual: b, ...c }).irpf.tipo))]),
      'Contrato indefinido y menor de 65 años. Con hijos compartidos, cada progenitor aplica la mitad del mínimo por descendientes.',
    );
  },

  'paga-extra-tabla': () =>
    tabla(
      ['Sueldo bruto anual', 'Paga extra bruta', 'Paga extra neta', 'Nómina normal neta'],
      [16000, 18000, 20000, 22000, 25000, 28000, 30000, 35000, 40000, 50000, 60000].map((b) => {
        const r = calcularNomina({ brutoAnual: b, pagas: 14 });
        return [eur(b, 0), eur(b / 14), eur(r.netoPagaExtra), eur(r.netoMensual)];
      }),
      'En 14 pagas, soltero/a sin hijos con contrato indefinido. La paga extra solo lleva IRPF, por eso sale más alta que una nómina normal.',
    ),

  'pagas-12-14': () =>
    tabla(
      ['Sueldo bruto anual', '14 pagas: nómina', '14 pagas: paga extra', '12 pagas: nómina', 'Neto anual (igual)'],
      [18000, 22000, 25000, 30000, 35000, 40000, 50000].map((b) => {
        const a = calcularNomina({ brutoAnual: b, pagas: 14 });
        const c = calcularNomina({ brutoAnual: b, pagas: 12 });
        return [eur(b, 0), eur(a.netoMensual), eur(a.netoPagaExtra), eur(c.netoMensual), eur(a.netoAnual, 0)];
      }),
      'Soltero/a sin hijos, contrato indefinido.',
    ),

  'paro-por-sueldo-mensual': () =>
    tabla(
      ['Bruto al mes (14 pagas)', 'Base reguladora', 'Paro meses 1-6', 'Desde el mes 7', 'Con hijos (meses 1-6)'],
      [1000, 1221, 1300, 1500, 1700, 1800, 2000, 2200, 2500, 3000].map((m) => {
        const r = calcularParo({ brutoAnual: m * 14, mesesCotizados: 72, hijos: 0 });
        const h = calcularParo({ brutoAnual: m * 14, mesesCotizados: 72, hijos: 1 });
        return [eur(m, 0), eur(r.baseReguladora), eur(r.primeros180.bruto), eur(r.desde181.bruto), eur(h.primeros180.bruto)];
      }),
      'Jornada completa e importes brutos. La base reguladora es el bruto mensual con la parte proporcional de las pagas extra (bruto anual ÷ 12).',
    ),

  'retencion-22000': () => eur(calcularNomina({ brutoAnual: 22000 }).irpf.anual),

  'vacaciones-valor': () =>
    tabla(
      ['Sueldo bruto anual', 'Valor de 1 día de vacaciones', '10 días', '20 días', '30 días'],
      [18000, 21000, 24000, 28000, 32000, 40000, 50000].map((b) => {
        const d = b / 365;
        return [eur(b, 0), eur(d), eur(d * 10), eur(d * 20), eur(d * 30)];
      }),
      'Importes brutos: tributan como salario. Salario diario = sueldo bruto anual ÷ 365.',
    ),

  'prestamo-por-sueldo': () =>
    tabla(
      ['Ingresos netos al mes', 'Cuota máxima (35 %)', 'Préstamo máx. a 25 años', 'Préstamo máx. a 30 años', 'Vivienda de hasta (30 años, 80 %)'],
      [1500, 1800, 2000, 2500, 3000, 3500, 4000, 5000].map((n) => {
        const cuota = n * HIPOTECA.esfuerzoMaximo;
        const p25 = capitalParaCuota(cuota, 0.029, 25);
        const p30 = capitalParaCuota(cuota, 0.029, 30);
        return [eur(n, 0), eur(cuota, 0), eur(p25, 0), eur(p30, 0), eur(p30 / HIPOTECA.financiacionHabitual, 0)];
      }),
      'Tipo fijo del 2,90 % TIN. Ingresos netos de todos los titulares. Sin otras deudas.',
    ),

  // Panel de cifras oficiales de la portada
  'panel-datos': () => `<div class="panel-datos">${DATOS.filter((d) => d.portada).map((d) => `<div class="dato">
      <span class="dato-nombre">${d.dato}</span>
      <span class="dato-valor">${d.valor}</span>
      <span class="dato-fuente"><svg class="ok" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9"/><path d="M6 10.4l2.6 2.6L14 7.4"/></svg>${d.fuente} · ${fechaLarga(d.fecha)}</span>
    </div>`).join('')}</div>`,
  'num-casos': () => String(CASOS.length),

  'nomina-ejemplos': () =>
    tabla(
      ['Bruto anual', 'Neto al mes (14 pagas)', 'Neto al mes (12 pagas)', 'Retención IRPF', 'Neto anual'],
      [15876, 17094, 20000, 22000, 24000, 26000, 28000, 30000, 35000, 40000, 45000, 50000, 60000, 80000].map((b) => {
        const r14 = calcularNomina({ brutoAnual: b, pagas: 14 });
        const r12 = calcularNomina({ brutoAnual: b, pagas: 12 });
        return [eur(b, 0), eur(r14.netoMensual), eur(r12.netoMensual), pct(r14.irpf.tipo), eur(r14.netoAnual)];
      }),
      'Contrato indefinido, soltero/a sin hijos y menor de 65 años. Calculado con la calculadora de esta página.',
    ),

  'nomina-hijos': () =>
    tabla(
      ['Situación (30.000 € brutos)', 'Retención IRPF', 'Neto al mes (14 pagas)'],
      [
        ['Sin hijos', { situacion: 3, hijos: 0 }],
        ['1 hijo (compartido con el otro progenitor)', { situacion: 3, hijos: 1 }],
        ['2 hijos (compartidos)', { situacion: 3, hijos: 2 }],
        ['Familia monoparental, 1 hijo', { situacion: 1, hijos: 1 }],
        ['Cónyuge sin ingresos, 2 hijos', { situacion: 2, hijos: 2 }],
      ].map(([nombre, datos]) => {
        const r = calcularNomina({ brutoAnual: 30000, ...datos });
        return [nombre, pct(r.irpf.tipo), eur(r.netoMensual)];
      }),
    ),

  'cotizacion-trabajador': () => {
    const t = SS.trabajador;
    return tabla(
      ['Concepto', 'Indefinido', 'Temporal'],
      [
        ['Contingencias comunes', pct(t.contingenciasComunes * 100), pct(t.contingenciasComunes * 100)],
        ['Desempleo', pct(t.desempleoIndefinido * 100), pct(t.desempleoTemporal * 100)],
        ['Formación profesional', pct(t.formacion * 100), pct(t.formacion * 100)],
        ['MEI (equidad intergeneracional)', pct(t.mei * 100), pct(t.mei * 100)],
        ['<strong>Total</strong>',
          `<strong>${pct((t.contingenciasComunes + t.desempleoIndefinido + t.formacion + t.mei) * 100)}</strong>`,
          `<strong>${pct((t.contingenciasComunes + t.desempleoTemporal + t.formacion + t.mei) * 100)}</strong>`],
      ],
      `Sobre la base de cotización, con un tope de ${eur(SS.baseMaxMensual)} al mes en 2026.`,
    );
  },

  'irpf-escala': () => {
    let desde = 0;
    return tabla(
      ['Base para calcular el tipo', 'Tipo'],
      IRPF.escala.map(({ hasta, tipo }) => {
        const fila = [hasta === Infinity ? `Más de ${eur(desde, 0)}` : `De ${eur(desde, 0)} a ${eur(hasta, 0)}`, pct(tipo * 100, 0)];
        desde = hasta;
        return fila;
      }),
      'Escala de retenciones (estatal + autonómica general) del artículo 101 de la Ley del IRPF.',
    );
  },

  'irpf-limites': () => {
    const l = IRPF.limiteExcluyente;
    const c = (v) => (v ? eur(v, 0) : '—');
    return tabla(
      ['Situación', 'Sin hijos', '1 hijo', '2 o más hijos'],
      [
        ['Monoparental (soltero/a, viudo/a, divorciado/a con hijos)', c(l[1][0]), c(l[1][1]), c(l[1][2])],
        ['Casado/a con cónyuge sin rentas de más de 1.500 €', c(l[2][0]), c(l[2][1]), c(l[2][2])],
        ['Resto de casos', c(l[3][0]), c(l[3][1]), c(l[3][2])],
      ],
      'Si tu sueldo bruto anual no supera estas cifras, la empresa no te retiene IRPF.',
    );
  },

  'paro-duracion': () =>
    tabla(
      ['Cotizado en los últimos 6 años', 'Paro que te corresponde'],
      PARO.duracion.map(([cotizados, dias], i) => {
        const siguiente = PARO.duracion[i + 1]?.[0];
        const rango = siguiente ? `De ${miles(cotizados)} a ${miles(siguiente - 1)} días` : `${miles(cotizados)} días o más`;
        return [rango, `${dias} días (${dias / 30} meses)`];
      }),
    ),

  'paro-topes': () => {
    const s = topesParo(0);
    const u = topesParo(1);
    const d = topesParo(2);
    return tabla(
      ['Hijos a cargo', 'Mínimo al mes', 'Máximo al mes'],
      [
        ['Sin hijos', eur(s.minimo), eur(s.maximo)],
        ['1 hijo', eur(u.minimo), eur(u.maximo)],
        ['2 o más hijos', eur(d.minimo), eur(d.maximo)],
      ],
      `Calculados sobre el IPREM de 2026 (${eur(PARO.iprem, 0)} al mes) más una sexta parte. A jornada completa.`,
    );
  },

  'paro-ejemplos': () =>
    tabla(
      ['Sueldo bruto anual', 'Primeros 6 meses', 'Desde el mes 7', 'Con 1 hijo (6 primeros meses)'],
      [12000, 15000, 18000, 20000, 22000, 25000, 30000, 40000].map((b) => {
        const r = calcularParo({ brutoAnual: b, mesesCotizados: 72, hijos: 0 });
        const h = calcularParo({ brutoAnual: b, mesesCotizados: 72, hijos: 1 });
        return [eur(b, 0), eur(r.primeros180.bruto), eur(r.desde181.bruto), eur(h.primeros180.bruto)];
      }),
      'Importes brutos mensuales con jornada completa. Calculados con la calculadora de esta página.',
    ),

  'pensiones-ejemplos': () =>
    tabla(
      ['Pensión en 2026', `Pensión en 2027 (+${pct(PENSIONES.estimacion2027 * 100, 1)})`, 'Más al mes', 'Más al año (14 pagas)'],
      [600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2500, 3000, PENSIONES.maxima2026].map((p) => {
        const r = calcularPension({ pensionMensual: p });
        return [eur(p), eur(r.nueva), `+ ${eur(r.subidaPorPaga)}`, `+ ${eur(r.subidaAnual)}`];
      }),
      `La última fila es la pensión máxima de 2026, que sube 0,115 puntos más: quedaría en ${eur(pensionMaxima2027(PENSIONES.estimacion2027))}.`,
    ),
};
