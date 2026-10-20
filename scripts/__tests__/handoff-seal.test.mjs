import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { faltaBase, revisarSello } from '../handoff-seal.mjs';

// El caso que lo motiva, reproducido sobre un repo de verdad: #464 selló su hand-off con un commit
// de la rama, el CI del PR pasó porque su checkout tenía ese commit, el squash lo dejó fuera de
// main y el rojo salió en el CI de main. Rojo con el sello de la rama, verde con el del squash; y
// verde con el de una rama retirada bajo `archive/*`, que es como sellan dos hand-offs a propósito.

// Sin las `GIT_*` heredadas: dentro de un hook de git apuntan al repositorio de verdad y estos git
// escribirían EN ÉL (lo vigila `pre-push-hook.test.mjs`).
const SIN_GIT = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));
const ENV = {
  ...SIN_GIT,
  GIT_AUTHOR_NAME: 'x',
  GIT_AUTHOR_EMAIL: 'x@example.invalid',
  GIT_COMMITTER_NAME: 'x',
  GIT_COMMITTER_EMAIL: 'x@example.invalid',
};
const git = (cwd, args) => execFileSync('git', args, { cwd, env: ENV, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

/** Un `origin` con main, un clon en una rama con un commit propio, y main avanzado por el squash de esa rama. */
function escenario() {
  const dir = mkdtempSync(join(tmpdir(), 'sello-'));
  const origen = join(dir, 'origen.git');
  const yo = join(dir, 'yo');
  git(dir, ['init', '-q', '--bare', '-b', 'main', origen]);
  git(dir, ['clone', '-q', origen, yo]);
  git(yo, ['commit', '-q', '--allow-empty', '-m', 'base']);
  git(yo, ['push', '-q', 'origin', 'HEAD:main']);
  git(yo, ['checkout', '-q', '-b', 'rama']);
  git(yo, ['commit', '-q', '--allow-empty', '-m', 'trabajo de la rama']);
  const deRama = git(yo, ['rev-parse', 'HEAD']);
  // El squash: un commit NUEVO en main con el contenido de la rama; el de la rama no entra.
  git(yo, ['checkout', '-q', 'main']);
  git(yo, ['commit', '-q', '--allow-empty', '-m', 'trabajo de la rama (#1)']);
  git(yo, ['push', '-q', 'origin', 'main']);
  git(yo, ['fetch', '-q', 'origin']);
  const squash = git(yo, ['rev-parse', 'HEAD']);
  return { yo, deRama, squash };
}

test('rojo: el sello apunta a un commit que solo vive en la rama (el squash lo borra)', () => {
  const { yo, deRama } = escenario();
  assert.equal(revisarSello(deRama, { cwd: yo }), 'solo-en-rama');
  assert.equal(revisarSello(deRama.slice(0, 8), { cwd: yo }), 'solo-en-rama');
});

test('verde: el sello apunta al commit del squash, que ya está en origin/main', () => {
  const { yo, squash } = escenario();
  assert.equal(revisarSello(squash, { cwd: yo }), null);
});

test('verde: la rama no se funde y se retira con un tag archive/*, la ref permanente', () => {
  const { yo, deRama } = escenario();
  git(yo, ['tag', '-a', 'archive/rama', deRama, '-m', 'rama retirada']);
  assert.equal(revisarSello(deRama, { cwd: yo }), null);
});

test('un tag que no es archive/* no salva el sello', () => {
  const { yo, deRama } = escenario();
  git(yo, ['tag', 'v-cualquiera', deRama]);
  assert.equal(revisarSello(deRama, { cwd: yo }), 'solo-en-rama');
});

test('rojo: un sello fabricado es un fantasma', () => {
  const { yo } = escenario();
  assert.equal(revisarSello('0123456789abcdef', { cwd: yo }), 'fantasma');
});

test('sin origin/main no se puede responder, y lo dice con el arreglo', () => {
  const { yo } = escenario();
  assert.equal(faltaBase({ cwd: yo }), null);
  git(yo, ['update-ref', '-d', 'refs/remotes/origin/main']);
  assert.match(faltaBase({ cwd: yo }), /no existe `origin\/main`.*git fetch origin main/);
});
