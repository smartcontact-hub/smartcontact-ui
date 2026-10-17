import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * Todo paso de un workflow que pasa su salida por `| tee` tiene que correr con `pipefail`: si no, el
 * código de salida del paso es el de `tee`, que siempre acaba bien, y un fallo sale como éxito.
 *
 * Por qué es un test (2026-10-17): sin `shell: bash` explícito, GitHub corre `bash -e {0}`, sin
 * `pipefail`. El robot `tokens-sync` guardaba así el log de import, verify y e2e, y su veredicto lee el
 * `outcome` de esos pasos. En el PR #439, verify se paró en `tokens:parity` (3 huecos de cobertura) y
 * la smoke tuvo un test en rojo, y la portada dijo «Verde». Es LEARNINGS #7 dentro de un workflow.
 */

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const workflowsDir = join(root, '.github/workflows');

const conBash = (bloque) => /^\s*defaults:\s*\n\s+run:\s*\n\s+shell:\s*bash\s*$/m.test(bloque);
const conPipefail = (texto) => /^\s*shell:\s*bash\s*$/m.test(texto) || /\bset -[a-z]*o pipefail\b|\bset -o pipefail\b/.test(texto);

/** Pasos con `| tee` que no corren con `pipefail`, como «job › paso». Lectura por sangría. */
export function pasosConTeeSinPipefail(yml) {
  const lineas = yml.split('\n');
  const inicioJobs = lineas.findIndex((l) => /^jobs:\s*$/.test(l));
  if (inicioJobs < 0) return [];
  const cabecera = lineas.slice(0, inicioJobs).join('\n');
  const faltan = [];
  const jobs = [];
  for (let i = inicioJobs + 1; i < lineas.length; i++) {
    const m = /^ {2}([\w-]+):\s*$/.exec(lineas[i]);
    if (m) jobs.push({ nombre: m[1], desde: i });
  }
  jobs.forEach((job, n) => {
    const cuerpo = lineas.slice(job.desde, n + 1 < jobs.length ? jobs[n + 1].desde : lineas.length);
    const pasosEn = cuerpo.findIndex((l) => /^ {4}steps:\s*$/.test(l));
    const delJob = cuerpo.slice(0, pasosEn < 0 ? cuerpo.length : pasosEn).join('\n');
    if (conBash(cabecera) || conBash(delJob)) return;
    for (let i = pasosEn + 1; pasosEn >= 0 && i < cuerpo.length; i++) {
      const paso = /^(\s*)- /.exec(cuerpo[i]);
      if (!paso) continue;
      const sangria = paso[1].length;
      let fin = i + 1;
      while (fin < cuerpo.length && !(cuerpo[fin].trim() && cuerpo[fin].search(/\S/) <= sangria)) fin++;
      const texto = cuerpo.slice(i, fin).join('\n');
      if (/\|\s*tee\b/.test(texto) && !conPipefail(texto)) {
        faltan.push(`${job.nombre} › ${(/name:\s*(.+)/.exec(texto)?.[1] ?? '(sin nombre)').trim()}`);
      }
      i = fin - 1;
    }
  });
  return faltan;
}

test('pipefail: caza un paso con `| tee` sin pipefail y deja pasar los que lo llevan', () => {
  const sin = 'on: push\njobs:\n  a:\n    runs-on: x\n    steps:\n      - name: Verify\n        run: npm run verify 2>&1 | tee v.log\n';
  assert.deepEqual(pasosConTeeSinPipefail(sin), ['a › Verify']);
  const enJob = 'on: push\njobs:\n  a:\n    runs-on: x\n    defaults:\n      run:\n        shell: bash\n    steps:\n      - name: Verify\n        run: npm run verify 2>&1 | tee v.log\n';
  assert.deepEqual(pasosConTeeSinPipefail(enJob), []);
  const enPaso = 'on: push\njobs:\n  a:\n    runs-on: x\n    steps:\n      - name: Verify\n        shell: bash\n        run: npm run verify 2>&1 | tee v.log\n';
  assert.deepEqual(pasosConTeeSinPipefail(enPaso), []);
  const conSet = 'on: push\njobs:\n  a:\n    runs-on: x\n    steps:\n      - name: Verify\n        run: |\n          set -euo pipefail\n          npm run verify 2>&1 | tee v.log\n';
  assert.deepEqual(pasosConTeeSinPipefail(conSet), []);
});

test('pipefail: ningún workflow del repo guarda un log con `| tee` sin pipefail', () => {
  const faltan = [];
  for (const f of readdirSync(workflowsDir).filter((n) => /\.ya?ml$/.test(n))) {
    for (const p of pasosConTeeSinPipefail(readFileSync(join(workflowsDir, f), 'utf8'))) faltan.push(`${f}: ${p}`);
  }
  assert.deepEqual(faltan, [], 'pon `defaults: run: shell: bash` en el job (GitHub añade -o pipefail)');
});
