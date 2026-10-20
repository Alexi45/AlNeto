import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CASOS } from '../src/generadores/confianza.mjs';
import { DATOS } from '../src/datos-oficiales.mjs';

// Los mismos casos que se publican en /metodologia/: si alguno cambia, la web no se publica.
for (const c of CASOS) {
  test(`caso de control · ${c.calc}: ${c.caso}`, () => assert.equal(c.resultado(), c.esperado));
}

test('cada dato oficial tiene valor, fuente y fecha', () => {
  for (const d of DATOS) {
    assert.ok(d.valor && d.fuente && /^\d{4}(-\d{2}){0,2}$/.test(d.fecha), d.id);
  }
});
