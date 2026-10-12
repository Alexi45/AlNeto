import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularHipoteca, cuotaFrancesa, capitalParaCuota } from '../src/static/js/calc/hipoteca.js';
import { calcularAutonomo, tramoAutonomo } from '../src/static/js/calc/autonomos.js';
import { compararSueldos } from '../src/static/js/calc/subida.js';

const cerca = (real, esperado, margen = 0.02) =>
  assert.ok(Math.abs(real - esperado) <= margen, `${real} no está cerca de ${esperado}`);

test('hipoteca: 150.000 € a 25 años al 3 % → 711,32 € al mes', () => {
  cerca(cuotaFrancesa(150000, 0.03, 25), 711.32);
  const r = calcularHipoteca({ precio: 187500, ahorro: 37500, anios: 25, tipoFijo: 0.03 });
  assert.equal(r.capital, 150000);
  assert.equal(r.cuota, 711.32);
  cerca(r.financiacion, 0.8, 1e-9);
  assert.equal(r.tabla.length, 25);
  assert.equal(r.tabla.at(-1).pendiente, 0);
  cerca(r.tabla.reduce((s, f) => s + f.amortizado, 0), 150000, 0.5);
});

test('hipoteca: capital máximo es la inversa de la cuota', () => {
  const capital = capitalParaCuota(711.32, 0.03, 25);
  cerca(capital, 150000, 1);
});

test('hipoteca variable: Euríbor + diferencial y escenarios', () => {
  const r = calcularHipoteca({ precio: 200000, ahorro: 50000, anios: 25, modalidad: 'variable', diferencial: 0.01 });
  cerca(r.tin, 0.04247, 1e-9);
  assert.equal(r.escenarios.length, 3);
  assert.ok(r.escenarios[0].cuota < r.escenarios[2].cuota);
});

test('autónomos: tramos de la Orden PJC/297/2026', () => {
  assert.equal(tramoAutonomo(670).numero, 1);
  assert.equal(tramoAutonomo(1166.69).numero, 3);
  assert.equal(tramoAutonomo(1166.7).numero, 4);
  assert.equal(tramoAutonomo(7000).numero, 15);
  // 30.000 € de rendimiento → 2.325 €/mes tras el 7 % → tramo 9, cuota mínima 401,47 €
  const r = calcularAutonomo({ rendimientoAnual: 30000 });
  assert.equal(r.tramo, 9);
  assert.equal(r.cuotaMinima, 401.47);
  assert.equal(calcularAutonomo({ rendimientoAnual: 5000 }).cuotaMinima, 205.88);
});

test('autónomos: societarios con base mínima de 1.424,40 € y tarifa plana', () => {
  assert.equal(calcularAutonomo({ rendimientoAnual: 10000, societario: true }).baseMinima, 1424.4);
  const tp = calcularAutonomo({ rendimientoAnual: 20000, primerAnio: true });
  assert.ok(tp.tarifaPlana);
  cerca(tp.cuota, 88.65);
});

test('subida de sueldo: de 30.000 a 32.000 € llega algo menos de lo bruto', () => {
  const r = compararSueldos(30000, 32000);
  assert.equal(r.subidaBruta, 2000);
  assert.ok(r.subidaNetaAnual > 1000 && r.subidaNetaAnual < 2000);
  cerca(r.aprovechamiento, r.subidaNetaAnual / 2000, 1e-9);
});
