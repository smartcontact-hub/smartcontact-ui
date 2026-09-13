import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * TODO workflow que corre la smoke (`npm run e2e`) en Linux tiene que apagar las baselines
 * visuales con `SC_SKIP_VISUAL_BASELINES`. Las capturas de `components.spec.ts` son
 * `*-darwin.png` (se hacen en el Mac de Rafa): en un runner de Ubuntu no existe su pareja
 * `-linux.png` y Playwright falla escribiendo «A snapshot doesn't exist».
 *
 * Por qué es un test y no una nota: el 2026-09-13 el robot `tokens-sync` falló así con un
 * export IDÉNTICO al de `main`. `ci.yml` llevaba la variable desde el 2026-09-07; el robot no,
 * porque nadie lo miró al añadirla, y como el plugin exporta poco, el rojo pasó desapercibido.
 * Con el siguiente export que SÍ trajera cambios, el robot habría dado rojo sin motivo y el PR
 * de tokens habría llegado marcado como roto.
 */

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const workflowsDir = join(root, '.github/workflows');

/** Pasos de un workflow con el `runs-on` de su job y el `env` del job. Lectura por sangría. */
export function smokeStepsWithoutSkip(yml) {
  const lines = yml.split('\n');
  const faltan = [];
  let job = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const jobStart = /^ {2}([\w-]+):\s*$/.exec(line);
    if (jobStart) job = { name: jobStart[1], start: i, runsOn: '', env: '' };
    if (!job) continue;
    const runsOn = /^ {4}runs-on:\s*(.+)$/.exec(line);
    if (runsOn) job.runsOn = runsOn[1];
    const step = /^(\s*)- (name|uses|run|env|if|with):/.exec(line);
    if (!step) continue;
    const indent = step[1].length;
    let end = i + 1;
    while (end < lines.length) {
      const l = lines[end];
      if (l.trim() && (l.length - l.trimStart().length < indent || new RegExp(`^\\s{${indent}}- `).test(l))) break;
      end++;
    }
    const body = lines.slice(i, end).join('\n');
    if (!/npm run e2e(\s|$)/m.test(body)) continue;
    const jobText = lines.slice(job.start, i).join('\n');
    const skipped = /SC_SKIP_VISUAL_BASELINES/.test(body) || /^ {4}env:[\s\S]*SC_SKIP_VISUAL_BASELINES/m.test(jobText);
    if (/ubuntu/.test(job.runsOn) && !skipped) faltan.push(`${job.name}: ${/- name:\s*(.+)/.exec(body)?.[1] ?? '(paso sin nombre)'}`);
  }
  return faltan;
}

test('los workflows REALES apagan las baselines darwin donde corren la smoke en Linux', () => {
  for (const file of readdirSync(workflowsDir).filter((f) => /\.ya?ml$/.test(f))) {
    const faltan = smokeStepsWithoutSkip(readFileSync(join(workflowsDir, file), 'utf8'));
    assert.deepEqual(faltan, [], `${file}: la smoke corre en Linux sin SC_SKIP_VISUAL_BASELINES`);
  }
});

test('el lector enrojece con el fallo del robot y se calla con la variable puesta', () => {
  const roto = [
    'jobs:',
    '  sync:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - name: e2e smoke',
    '        run: |',
    '          npx playwright install --with-deps chromium',
    '          npm run e2e',
    '      - name: Otro paso',
    '        run: echo hola',
  ].join('\n');
  assert.deepEqual(smokeStepsWithoutSkip(roto), ['sync: e2e smoke']);

  const bien = roto.replace('        run: |', "        env:\n          SC_SKIP_VISUAL_BASELINES: '1'\n        run: |");
  assert.deepEqual(smokeStepsWithoutSkip(bien), []);

  // `npm run e2e:visual` no es la smoke, y en macOS no hace falta apagar nada.
  assert.deepEqual(smokeStepsWithoutSkip(roto.replace('npm run e2e', 'npm run e2e:visual')), []);
  assert.deepEqual(smokeStepsWithoutSkip(roto.replace('ubuntu-latest', 'macos-latest')), []);
});
