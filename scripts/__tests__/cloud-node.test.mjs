import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * El hook de arranque de la nube (`scripts/hooks/cloud-node.sh`). Medido el 2026-10-06: en cada sesión cloud salía
 * con 3 en 0,09 s sin decir nada, así que Angular encontraba el Node del contenedor (22.22.0 < 22.22.3), el clon
 * seguía superficial (`audit:commit-attribution` en rojo) y sin etiquetas (`explorations:check` en rojo). La causa:
 * `. nvm.sh` hace un `nvm use` del `.nvmrc` del directorio, la versión aún no está instalada, devuelve 3 y `set -e`
 * corta el hook antes de instalarla. El `nvm.sh` falso de abajo se porta igual que el real en ese punto.
 */

const HOOK = resolve(dirname(fileURLToPath(import.meta.url)), '../hooks/cloud-node.sh');
const SIN_GIT = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));

const NVM_FALSO = `
nvm() {
  case "$1" in
    install) mkdir -p "$NVM_DIR/v/$2/bin"; echo "$2" >> "$NVM_DIR/instaladas" ;;
    alias) : ;;
    which) echo "$NVM_DIR/v/$2/bin/node" ;;
    use) [ -d "$NVM_DIR/v/$2" ] || return 3; echo "$2" >> "$NVM_DIR/activadas" ;;
  esac
}
# Como el real: sin --no-use, activa el .nvmrc del directorio, y si no está instalado devuelve 3.
case " $* " in
  *" --no-use "*) : ;;
  *) [ -f .nvmrc ] && { nvm use "$(cat .nvmrc)" || return 3; } ;;
esac
`;

/** Un origen con dos commits y una etiqueta, un clon superficial suyo con `.nvmrc` y `node_modules`, y un nvm falso. */
function escenario() {
  const dir = mkdtempSync(join(tmpdir(), 'cloud-node-'));
  const origen = join(dir, 'origen');
  const clon = join(dir, 'clon');
  const nvm = join(dir, 'nvm');
  const git = (cwd, args) => execFileSync('git', args, { cwd, env: SIN_GIT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  execFileSync('git', ['init', '-q', '-b', 'main', origen], { env: SIN_GIT });
  for (const m of ['uno', 'dos']) git(origen, ['-c', 'user.name=P', '-c', 'user.email=p@example.com', 'commit', '-q', '--allow-empty', '-m', m]);
  git(origen, ['tag', 'archive/prueba', 'HEAD~1']);
  execFileSync('git', ['clone', '-q', '--depth', '1', '--no-tags', `file://${origen}`, clon], { env: SIN_GIT });
  writeFileSync(join(clon, '.nvmrc'), '22.23.2\n');
  mkdirSync(join(clon, 'node_modules'));
  mkdirSync(nvm);
  writeFileSync(join(nvm, 'nvm.sh'), NVM_FALSO);
  const envFile = join(dir, 'env');
  writeFileSync(envFile, '');
  const r = spawnSync('bash', [HOOK], {
    cwd: clon,
    encoding: 'utf8',
    env: { ...SIN_GIT, CLAUDE_CODE_REMOTE: 'true', CLAUDE_PROJECT_DIR: clon, CLAUDE_ENV_FILE: envFile, NVM_DIR: nvm },
  });
  return { r, clon, nvm, envFile, git: (args) => git(clon, args) };
}

test('con la versión del .nvmrc sin instalar, la instala y la pone en el PATH de la sesión', () => {
  const { r, nvm, envFile } = escenario();
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(readFileSync(join(nvm, 'instaladas'), 'utf8').trim(), '22.23.2');
  // Y la activa en el propio hook: `npm ci` y su mensaje corrían con el Node del contenedor.
  assert.equal(readFileSync(join(nvm, 'activadas'), 'utf8').trim(), '22.23.2');
  assert.match(readFileSync(envFile, 'utf8'), new RegExp(`export PATH="${join(nvm, 'v/22.23.2/bin')}:`));
});

test('un clon superficial sale completo y con las etiquetas', () => {
  const { r, git } = escenario();
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(git(['rev-parse', '--is-shallow-repository']), 'false');
  assert.equal(git(['tag', '-l', 'archive/*']), 'archive/prueba');
});

test('fuera de la nube no toca nada', () => {
  const r = spawnSync('bash', [HOOK], { encoding: 'utf8', env: { ...SIN_GIT, CLAUDE_CODE_REMOTE: '' } });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
});
