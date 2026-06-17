import { test } from 'node:test';
import assert from 'node:assert/strict';
import { previewCheck } from '../preview-check.mjs';

// Verificador del lote `preview:live`: en el estado committeado (export ↔ CSS en sync,
// capas sanas, entrypoints cableados) el pipeline de preview tiene que estar VERDE.
test('preview:check — el pipeline de regen está verde y servible en el estado committeado', () => {
  const { ok, problems } = previewCheck();
  assert.equal(ok, true, `preview:check encontró problemas:\n  - ${problems.join('\n  - ')}`);
  assert.equal(problems.length, 0);
});
