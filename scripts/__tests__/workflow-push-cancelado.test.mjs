import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * Un paso que empuja a una rama no puede correr cuando el run se cancela, y un push forzado a la rama
 * que también escribe el plugin de Figma va con `--force-with-lease`.
 *
 * Por qué es un test (2026-10-17): `tokens-sync` se cancela cuando llega otro push del plugin
 * (`cancel-in-progress`), y su paso de reset llevaba `if: always()`. El run cancelado lo corría igual y
 * forzaba `design-tokens-sync` a main, borrando el push que lo había cancelado antes de que su run lo
 * leyera. Pasó dos veces seguidas (runs 39068153047 y 39068274930): el export con el marcador de campo a
 * 700 no llegó a ningún PR y el robot dijo «sin cambio».
 */

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const workflowsDir = join(root, '.github/workflows');

/** Pasos con `if: always()` que hacen `git push`, por su nombre. Lectura por sangría. */
export function pushesQueCorrenAlCancelar(yml) {
  const lineas = yml.split('\n');
  const fuera = [];
  for (let i = 0; i < lineas.length; i++) {
    const paso = /^(\s*)- name:\s*(.+)$/.exec(lineas[i]);
    if (!paso) continue;
    const sangria = paso[1].length;
    let fin = i + 1;
    while (fin < lineas.length && !(lineas[fin].trim() && lineas[fin].search(/\S/) <= sangria)) fin++;
    const texto = lineas.slice(i, fin).join('\n');
    const condicion = new RegExp(`^ {${sangria + 2}}if:\\s*(.+)$`, 'm').exec(texto)?.[1] ?? '';
    if (/\balways\(\)/.test(condicion) && /\bgit push\b/.test(texto)) fuera.push(paso[2].trim());
    i = fin - 1;
  }
  return fuera;
}

/** Líneas que fuerzan `design-tokens-sync` sin `--force-with-lease`. */
export function forzadosSinLease(yml) {
  return yml
    .split('\n')
    .filter((l) => /\bgit push\b.*--force(?!-with-lease)\b.*design-tokens-sync/.test(l))
    .map((l) => l.trim());
}

const paso = (condicion, push) =>
  `on: push\njobs:\n  sync:\n    runs-on: x\n    steps:\n      - name: Resetear\n        if: ${condicion}\n        run: |\n          git commit -m x\n          ${push}\n      - name: Veredicto\n        if: always()\n        run: echo ok\n`;

test('push al cancelar: caza el reset con always() y deja pasar el de !cancelled()', () => {
  assert.deepEqual(pushesQueCorrenAlCancelar(paso('always()', 'git push --force origin HEAD:design-tokens-sync')), ['Resetear']);
  assert.deepEqual(pushesQueCorrenAlCancelar(paso('${{ always() }}', 'git push origin HEAD:x')), ['Resetear']);
  assert.deepEqual(pushesQueCorrenAlCancelar(paso('${{ !cancelled() }}', 'git push origin HEAD:x')), []);
});

test('push al cancelar: caza el --force a design-tokens-sync y deja pasar el de lease', () => {
  assert.equal(forzadosSinLease(paso('x', 'git push --force origin HEAD:design-tokens-sync')).length, 1);
  assert.deepEqual(
    forzadosSinLease(paso('x', 'git push --force-with-lease="design-tokens-sync:$PLUGIN_SHA" origin HEAD:design-tokens-sync')),
    [],
  );
});

test('push al cancelar: ningún workflow del repo empuja desde un paso que corre cancelado', () => {
  const fuera = [];
  for (const f of readdirSync(workflowsDir).filter((n) => /\.ya?ml$/.test(n))) {
    const yml = readFileSync(join(workflowsDir, f), 'utf8');
    for (const p of pushesQueCorrenAlCancelar(yml)) fuera.push(`${f}: ${p}`);
    for (const l of forzadosSinLease(yml)) fuera.push(`${f}: ${l}`);
  }
  assert.deepEqual(fuera, [], 'usa `if: ${{ !cancelled() }}` y `--force-with-lease` contra el sha leído');
});
