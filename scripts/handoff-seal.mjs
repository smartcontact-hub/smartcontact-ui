/**
 * El sello `HEAD <sha>` de un hand-off, como gate (CHECK D de `docs:coherence`): el commit que cita
 * tiene que EXISTIR y SOBREVIVIR a la fusión del PR.
 *
 * Por qué «sobrevivir»: los PR se funden por squash, así que un commit que solo vive en la rama
 * desaparece de main al fundir. El CI del PR no lo ve (su checkout SÍ tiene la rama) y el rojo
 * llega después, en el CI de main: pasó con #464, sellado en `24ced9b5`, un merge de la rama.
 * Sobrevive lo alcanzable desde `origin/main` o desde un tag `archive/*`: el tag es la ref
 * permanente con la que se retira una rama que no se funde (AGENTS.md §Session-Close, paso 5), y
 * dos hand-offs sellan a propósito en una así.
 *
 * Se prueba en rojo con el squash reproducido en `scripts/__tests__/handoff-seal.test.mjs`.
 */
import { execFileSync } from 'node:child_process';

export const BASE = 'origin/main';
export const TAGS_PERMANENTES = 'refs/tags/archive/';

// Sin las `GIT_*` heredadas: dentro de un hook de git apuntan al repositorio de verdad, y el que
// manda aquí es `cwd` (en el test, un repo temporal).
const SIN_GIT = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));
const git = (cwd, args) =>
  execFileSync('git', args, { cwd, env: SIN_GIT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const ok = (cwd, args) => {
  try {
    git(cwd, args);
    return true;
  } catch {
    return false;
  }
};

/** `null` si `base` existe; si no, el motivo con su arreglo. */
export function faltaBase({ cwd, base = BASE }) {
  if (ok(cwd, ['rev-parse', '--verify', '--quiet', `${base}^{commit}`])) return null;
  return `no existe \`${base}\`, así que no se puede saber si los sellos sobreviven a la fusión: \`git fetch origin main\` y repite.`;
}

/** `'fantasma'` (no existe), `'solo-en-rama'` (existe pero se perderá al fundir) o `null` (bien). */
export function revisarSello(sha, { cwd, base = BASE }) {
  if (!ok(cwd, ['cat-file', '-e', `${sha}^{commit}`])) return 'fantasma';
  if (ok(cwd, ['merge-base', '--is-ancestor', sha, base])) return null;
  if (git(cwd, ['for-each-ref', '--count=1', '--contains', sha, '--format=%(refname)', TAGS_PERMANENTES])) return null;
  return 'solo-en-rama';
}
