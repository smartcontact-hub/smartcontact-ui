#!/usr/bin/env node
/**
 * AUDIT · ningún commit de la rama lleva la firma de la herramienta.
 *
 * POR QUÉ EXISTE. El repo es público y un commit fundido es un documento del proyecto (AGENTS.md
 * §«Pull requests y commits»). El mensaje que se escribe en una sesión ya lo vigila `bash-guard`,
 * pero el del squash lo compone GitHub AL FUNDIR: añade una línea `Co-authored-by:` por cada autor
 * de commit que no es quien funde. Las sesiones cloud firmaban con la identidad del contenedor, que
 * es la de la herramienta, y así entraron en `main` cinco fusiones con ella de coautora entre el
 * 2026-09-21 y el 2026-09-28 (#223, #224, #266, #267 y #270), con los commits de la rama limpios: la
 * línea la puso GitHub. Esto lo pone rojo ANTES de fundir, que es cuando aún se arregla sin tocar
 * `main`. Lo que ya está en `main` se queda: su historia no se reescribe (DD-134).
 *
 * QUÉ MIRA. Los commits que la rama lleva por encima de `origin/main` (`git log --no-merges
 * origin/main..HEAD`): en local y en la nube, lo que vas a pushear; en el CI de un PR, sus commits
 * (el job `verify` hace el checkout con la historia entera para verlos). Rojo si alguno:
 *   · tiene de autor o de committer el correo de la herramienta: GitHub lo pone de coautor al fundir,
 *     y la lista de commits del PR ya lo enseña con su nombre;
 *   · lleva en el mensaje una línea de atribución (el coautor de la herramienta, la línea
 *     «Generated with Claude Code» o el enlace a una sesión): el squash copia los mensajes de la rama
 *     en su cuerpo, así que viajarían a `main`. Solo cuenta la línea que EMPIEZA así, que es la forma
 *     de un trailer o de un pie; un commit que habla de la regla en su prosa no casa.
 * Un clon superficial no deja ver el rango entero y el gate no puede responder por él: rojo, con el
 * `git fetch` que lo arregla.
 *
 * QUÉ HACER SI SE PONE ROJO. Primero la identidad (`git config user.name` y `user.email`: la cuenta
 * del mantenedor, que en la nube pone `scripts/hooks/cloud-identity.mjs` al arrancar); después se
 * reescriben SOLO los commits de la rama, con el comando que imprime el gate, y se pushea con
 * `--force-with-lease`.
 *
 * ES PURO respecto a los commits (funciones exportadas → testeable sin git); el `main` los lee de git.
 */
import { execFileSync } from 'node:child_process';

const log = (s = '') => process.stdout.write(s + '\n');

/** El correo con el que firma la herramienta (autor, committer y coautor de sus trailers). */
export const CORREO_HERRAMIENTA = 'noreply@anthropic.com';

/**
 * Las líneas de atribución, ancladas al principio de la línea: así es como las escribe la
 * herramienta (trailer o pie), y así no casa un commit que las cita en su prosa. El enlace pide un
 * identificador de sesión de verdad, no el «session_…» con que lo nombra la documentación.
 */
export const LINEAS_DE_ATRIBUCION = [
  [/^[ \t]*co-authored-by:[^\n]*(?:\bclaude\b|noreply@anthropic\.com)/im, 'el coautor de la herramienta'],
  [/^[ \t]*(?:\S+[ \t]+)?generated with \[?claude code\b/im, 'la línea «Generated with Claude Code»'],
  [/^[ \t]*(?:https?:\/\/)?claude\.ai\/code\/session_[A-Za-z0-9]{6,}/im, 'el enlace a una sesión de claude.ai'],
];

/** Los motivos por los que UN commit lleva la firma de la herramienta; vacío si está limpio. */
export function motivos(commit) {
  const fuera = [];
  const esHerramienta = (correo) => String(correo ?? '').trim().toLowerCase() === CORREO_HERRAMIENTA;
  if (esHerramienta(commit.autor?.email)) fuera.push(`autor ${commit.autor.nombre} <${commit.autor.email}>: GitHub lo pone de coautor al fundir`);
  if (esHerramienta(commit.committer?.email))
    fuera.push(`committer ${commit.committer.nombre} <${commit.committer.email}>: la lista de commits del PR lo enseña`);
  const lineas = String(commit.mensaje ?? '').split('\n');
  for (const [re, que] of LINEAS_DE_ATRIBUCION) {
    const i = lineas.findIndex((l) => re.test(l));
    if (i >= 0) fuera.push(`el mensaje lleva ${que} (línea ${i + 1}: «${lineas[i].trim().slice(0, 90)}»)`);
  }
  return fuera;
}

/** Los commits con firma de la herramienta, con su asunto y sus motivos. PURA. */
export function revisar(commits) {
  return commits
    .map((c) => ({ sha: c.sha, asunto: String(c.mensaje ?? '').split('\n')[0], motivos: motivos(c) }))
    .filter((c) => c.motivos.length);
}

// Separadores que no aparecen en un mensaje de commit: uno entre campos y otro entre commits.
const CAMPO = '\x1f';
const COMMIT = '\x1e';
export const FORMATO = ['%H', '%an', '%ae', '%cn', '%ce', '%B'].join(CAMPO) + COMMIT;

/** Lo que imprime `git log --format=FORMATO`, en commits. PURA. */
export function parsearLog(salida) {
  return salida
    .split(COMMIT)
    .map((r) => r.replace(/^\n/, ''))
    .filter((r) => r.trim())
    .map((r) => {
      const [sha, an, ae, cn, ce, ...resto] = r.split(CAMPO);
      return { sha, autor: { nombre: an, email: ae }, committer: { nombre: cn, email: ce }, mensaje: resto.join(CAMPO) };
    });
}

/**
 * Lee de git los commits de la rama por encima de `base`. Devuelve `{ commits }` o `{ error }`
 * cuando no se puede responder por el rango (sin la base, o un clon superficial).
 */
export function leerRama({ cwd = process.cwd(), base = 'origin/main' } = {}) {
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    git('rev-parse', '--verify', '--quiet', `${base}^{commit}`);
  } catch {
    return { error: `no existe \`${base}\`, así que no hay rango que mirar: \`git fetch origin main\` y repite.` };
  }
  if (git('rev-parse', '--is-shallow-repository').trim() === 'true')
    return {
      error:
        'el clon es superficial y el rango puede quedar cortado (un commit fuera de la vista no se revisa). ' +
        'Arreglo: `git fetch --unshallow origin`; en un workflow, `fetch-depth: 0` en el checkout.',
    };
  return { commits: parsearLog(git('log', '--no-merges', `--format=${FORMATO}`, `${base}..HEAD`)) };
}

/** El comando que reescribe SOLO los commits de la rama: autor nuevo y mensaje sin las líneas. */
export const ARREGLO =
  "git rebase -r origin/main --exec 'git log -1 --format=%B | grep -viE \"^[[:space:]]*co-authored-by:.*(claude|noreply@anthropic)\" | git commit --amend --no-verify --reset-author -F -'";

/* ── main ──────────────────────────────────────────────────────────────────── */
if (process.argv[1] && process.argv[1].endsWith('audit-commit-attribution.mjs')) {
  const { commits, error } = leerRama();
  if (error) {
    log(`✗ audit:commit-attribution — ${error}`);
    process.exit(1);
  }
  const firmados = revisar(commits);
  if (firmados.length) {
    log(`✗ audit:commit-attribution — ${firmados.length} de ${commits.length} commit(s) de esta rama llevan la firma de la herramienta:`);
    log();
    for (const c of firmados) {
      log(`  ${c.sha.slice(0, 8)}  ${c.asunto.slice(0, 100)}`);
      for (const m of c.motivos) log(`            · ${m}`);
    }
    log();
    log('  El repo es público: ni autor, ni coautor, ni pie de la herramienta (AGENTS.md §«Pull requests y commits»).');
    log('  1. La identidad: `git config user.name` y `git config user.email` con la cuenta del mantenedor.');
    log('     En la nube la pone `scripts/hooks/cloud-identity.mjs` al arrancar; si esto sale allí, ese hook no corrió.');
    log('  2. Reescribe solo los commits de la rama (lo que ya está en main no se toca):');
    log(`     ${ARREGLO}`);
    log('  3. Si la rama ya estaba en el remoto: `git push --force-with-lease`.');
    process.exit(1);
  }
  log(`✓ audit:commit-attribution: ${commits.length} commit(s) por encima de origin/main, ninguno con la firma de la herramienta.`);
}
