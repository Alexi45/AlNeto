import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularNomina, reduccionRendimientosTrabajo } from '../src/static/js/calc/nomina.js';
import { calcularParo } from '../src/static/js/calc/paro.js';
import { calcularFiniquito } from '../src/static/js/calc/finiquito.js';
import { calcularPension, subidaPrevista } from '../src/static/js/calc/pensiones.js';
import { mesesRedondeadosArriba, fecha } from '../src/static/js/calc/util.js';

const cerca = (real, esperado, margen = 0.02) =>
  assert.ok(Math.abs(real - esperado) <= margen, `${real} no está cerca de ${esperado}`);

test('SMI 2026, soltero sin hijos: retención del 3,06 % (dato publicado por AEDAF)', () => {
  const r = calcularNomina({ brutoAnual: 17094 });
  assert.equal(r.irpf.tipo, 3.06);
  assert.equal(r.ss.anual, 1111.08); // 6,50 % mensual redondeado por nómina
});

test('30.000 € soltero sin hijos: 16,42 %', () => {
  const r = calcularNomina({ brutoAnual: 30000 });
  assert.equal(r.irpf.tipo, 16.42);
  assert.equal(r.ss.mensual, 162.5);
});

test('por debajo del límite excluyente no hay retención, ni siquiera el 2 % temporal', () => {
  assert.equal(calcularNomina({ brutoAnual: 15000, contrato: 'temporal' }).irpf.tipo, 0);
});

test('contrato temporal: mínimo del 2 % por encima del límite', () => {
  const r = calcularNomina({ brutoAnual: 16000, contrato: 'temporal' });
  assert.ok(r.irpf.tipo >= 2);
});

test('los hijos bajan la retención y la situación 2 aún más', () => {
  const sin = calcularNomina({ brutoAnual: 35000 }).irpf.tipo;
  const dos = calcularNomina({ brutoAnual: 35000, hijos: 2 }).irpf.tipo;
  const conyuge = calcularNomina({ brutoAnual: 35000, hijos: 2, situacion: 2 }).irpf.tipo;
  assert.ok(dos < sin && conyuge < dos);
});

test('sueldos altos: tope de base y cotización de solidaridad', () => {
  const r = calcularNomina({ brutoAnual: 80000 });
  assert.ok(r.ss.topeAlcanzado);
  // exceso mensual 6.666,67 - 5.101,20: 510,12 al 0,19 % + 1.055,35 al 0,21 %
  cerca(r.ss.solidaridadMensual, 0.97 + 2.22);
});

test('12 nóminas + 2 pagas extra suman el neto anual', () => {
  for (const brutoAnual of [18000, 26500, 42000, 95000]) {
    const r = calcularNomina({ brutoAnual, pagas: 14 });
    cerca(r.netoMensual * 12 + r.netoPagaExtra * 2, r.netoAnual, 0.1);
  }
});

test('reducción por rendimientos del trabajo (ejemplo de pensión de 18.000 €)', () => {
  cerca(reduccionRendimientosTrabajo(18000), 1992.15);
});

test('paro: tope máximo sin hijos y 60 % desde el día 181', () => {
  const r = calcularParo({ brutoAnual: 24000, mesesCotizados: 24, hijos: 0 });
  assert.equal(r.dias, 240);
  assert.equal(r.primeros180.bruto, 1225);
  assert.equal(r.primeros180.ajuste, 'maximo');
  assert.equal(r.desde181.bruto, 1200);
  assert.equal(r.primeros180.cotizacion, 94);
});

test('paro: mínimo y sin derecho por debajo de 12 meses', () => {
  assert.equal(calcularParo({ brutoAnual: 9000, mesesCotizados: 12 }).primeros180.bruto, 560);
  assert.equal(calcularParo({ brutoAnual: 9000, mesesCotizados: 12, hijos: 1 }).primeros180.bruto, 749);
  assert.equal(calcularParo({ brutoAnual: 30000, mesesCotizados: 11 }).tieneDerecho, false);
  assert.equal(calcularParo({ brutoAnual: 30000, mesesCotizados: 80 }).dias, 720);
});

test('meses de antigüedad: la fracción cuenta como mes entero', () => {
  assert.equal(mesesRedondeadosArriba(fecha('2020-01-15'), fecha('2020-03-14')), 2);
  assert.equal(mesesRedondeadosArriba(fecha('2020-01-15'), fecha('2020-03-20')), 3);
  assert.equal(mesesRedondeadosArriba(fecha('2024-03-01'), fecha('2026-03-15')), 25);
});

test('finiquito con despido improcedente', () => {
  const r = calcularFiniquito({
    brutoAnual: 28000, pagas: 14, devengo: 'semestral',
    fechaInicio: '2024-03-01', fechaBaja: '2026-03-15', motivo: 'improcedente',
  });
  assert.equal(r.salarioPendiente.importe, 1000);
  assert.equal(r.vacaciones.generadas, 6.08);
  cerca(r.pagasExtra[0].importe, 817.68);
  assert.equal(r.indemnizacion.dias, 68.75);
  cerca(r.indemnizacion.importe, 5273.97);
});

test('improcedente con contrato anterior a 2012: tope de 720 días', () => {
  const r = calcularFiniquito({
    brutoAnual: 30000, fechaInicio: '2005-01-01', fechaBaja: '2026-06-30', motivo: 'improcedente',
  });
  assert.equal(r.indemnizacion.dias, 720);
  assert.ok(r.indemnizacion.tope);
});

test('improcedente con más de 720 días generados antes de 2012', () => {
  const r = calcularFiniquito({
    brutoAnual: 30000, fechaInicio: '1990-01-01', fechaBaja: '2026-06-30', motivo: 'improcedente',
  });
  assert.equal(r.indemnizacion.dias, 997.5);
});

test('baja voluntaria: sin indemnización y pagas con devengo anual', () => {
  const r = calcularFiniquito({
    brutoAnual: 21000, devengo: 'anual', fechaInicio: '2023-05-01', fechaBaja: '2026-09-30', motivo: 'voluntaria',
  });
  assert.equal(r.indemnizacion.importe, 0);
  assert.equal(r.pagasExtra.length, 2);
  assert.equal(r.salarioPendiente.dias, 30);
});

test('pensiones: subida general y pensión máxima', () => {
  assert.equal(calcularPension({ pensionMensual: 1000, subida: 0.035 }).nueva, 1035);
  const max = calcularPension({ pensionMensual: 3359.6, subida: 0.035 });
  assert.ok(max.enMaxima);
  assert.equal(max.nueva, 3481.05);
  assert.equal(subidaPrevista(0.0435), 0.035);
});
