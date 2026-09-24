import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { aviso, deriva, fetchSiToca } from '../hooks/main-drift-guard.mjs';

// Sin las `GIT_*` heredadas: dentro de un hook de git (el pre-push corre `verify`), GIT_DIR apunta al
// repositorio de verdad y estos git escribirían EN ÉL (lo vigila `pre-push-hook.test.mjs`).
const SIN_GIT = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));
const git = (cwd, ...args) => execFileSync('git', args, { cwd, env: SIN_GIT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

/** Un `origin` desnudo, un clon con una rama de trabajo, y otra persona que funde en main. */
function escenario() {
  const raiz = mkdtempSync(join(tmpdir(), 'drift-'));
  const origen = join(raiz, 'origen.git');
  const yo = join(raiz, 'yo');
  const otra = join(raiz, 'otra');
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', origen], { env: SIN_GIT });
  for (const dir of [yo, otra]) {
    execFileSync('git', ['clone', '-q', origen, dir], { env: SIN_GIT, stdio: 'ignore' });
    git(dir, 'config', 'user.email', 't@t');
    git(dir, 'config', 'user.name', 't');
  }
  writeFileSync(join(otra, 'ficha.html'), 'v1\n');
  writeFileSync(join(otra, 'lista.html'), 'v1\n');
  git(otra, 'add', '.');
  git(otra, 'commit', '-q', '-m', 'base');
  git(otra, 'push', '-q', 'origin', 'HEAD:main');
  git(yo, 'pull', '-q', 'origin', 'main');
  git(yo, 'checkout', '-q', '-b', 'mi-rama');
  return { yo, otra };
}

function fundeEnMain(otra, fichero, msg) {
  writeFileSync(join(otra, fichero), `${msg}\n`);
  git(otra, 'commit', '-qam', msg);
  git(otra, 'push', '-q', 'origin', 'HEAD:main');
}

test('ROJO: main cambia el fichero que estoy tocando, aunque no lo haya commiteado', () => {
  const { yo, otra } = escenario();
  writeFileSync(join(yo, 'ficha.html'), 'mi cambio a medias\n');
  fundeEnMain(otra, 'ficha.html', 'la cabecera se pega a sus pestañas (#237)');
  git(yo, 'fetch', '-q', 'origin', 'main');
  const d = deriva(yo);
  assert.deepEqual(d.ficheros, ['ficha.html']);
  assert.equal(d.commits.length, 1);
  const t = aviso(d);
  assert.match(t, /ficha\.html/);
  assert.match(t, /#237/);
  assert.match(t, /ANTES de enseñarle nada al usuario/);
});

test('VERDE: main se mueve en OTRO fichero → silencio', () => {
  const { yo, otra } = escenario();
  writeFileSync(join(yo, 'ficha.html'), 'mi cambio\n');
  git(yo, 'commit', '-qam', 'mío');
  fundeEnMain(otra, 'lista.html', 'otra cosa');
  git(yo, 'fetch', '-q', 'origin', 'main');
  assert.equal(aviso(deriva(yo)), '');
});

test('VERDE: ya rebasado sobre main → silencio', () => {
  const { yo, otra } = escenario();
  fundeEnMain(otra, 'ficha.html', 'lo de la otra sesión');
  git(yo, 'fetch', '-q', 'origin', 'main');
  git(yo, 'rebase', '-q', 'origin/main');
  writeFileSync(join(yo, 'ficha.html'), 'mi cambio encima\n');
  assert.equal(aviso(deriva(yo)), '');
});

test('el fetch se hace como mucho cada 5 minutos', () => {
  const { yo } = escenario();
  const t0 = 1_000_000_000_000;
  assert.equal(fetchSiToca(yo, t0), true);
  assert.equal(fetchSiToca(yo, t0 + 60_000), false);
  assert.equal(fetchSiToca(yo, t0 + 5 * 60_000 + 1), true);
});
