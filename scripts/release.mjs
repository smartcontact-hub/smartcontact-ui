#!/usr/bin/env node
/**
 * Corta una release de GitHub: los tres tarballs `@smartcontact-hub/*` adjuntos y las
 * notas sacadas de CHANGELOG.md.
 *
 * Existe porque publicar en el registro está APARCADO (DD-17) y aun así hace falta un
 * sitio del que descargarse el DS. Sin esto, la única forma de tener el paquete es
 * clonar el repo y compilarlo.
 *
 * Las notas NO se escriben aquí: se leen del CHANGELOG, que es la fuente. Así no puede
 * haber dos versiones del mismo anuncio. Los enlaces relativos del CHANGELOG se
 * reescriben a URLs absolutas del tag, porque en la página de la release no resuelven.
 *
 * SEGURO POR DEFECTO: dry-run salvo `--publish` (patrón del resto de scripts del repo).
 *
 * Uso:
 *   node scripts/release.mjs             # dry-run de la versión que marca package.json
 *   node scripts/release.mjs v1.0.0      # dry-run de una versión concreta
 *   node scripts/release.mjs --publish   # crea el tag y la release
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';

const root = resolve(import.meta.dirname, '..');
const REPO = 'smartcontact-hub/smartcontact-ui';
const PKGS = [
  ['design-tokens', 'smartcontact-hub-styles'],
  ['ui-smartcontact-icons', 'smartcontact-hub-icons'],
  ['ui-smartcontact', 'smartcontact-hub-components'],
];

const args = process.argv.slice(2);
const publish = args.includes('--publish');
const tagArg = args.find((a) => !a.startsWith('--'));

const die = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};
const sh = (cmd, cmdArgs, opts = {}) =>
  execFileSync(cmd, cmdArgs, { cwd: root, encoding: 'utf8', ...opts }).trim();

const json = (p) => JSON.parse(readFileSync(resolve(root, p), 'utf8'));

// 1 · Versión y lockstep. Los tres paquetes se versionan juntos (version-bump.mjs);
//     si uno se ha quedado atrás, sus peerDeps internos no cuadran y el tarball miente.
const rootVersion = json('package.json').version;
const version = (tagArg ?? `v${rootVersion}`).replace(/^v/, '');
const tag = `v${version}`;
if (version !== rootVersion)
  die(`El tag pide ${version} y package.json dice ${rootVersion}. Corre: npm run version:bump -- ${version} --write`);
for (const [project] of PKGS) {
  const v = json(`projects/${project}/package.json`).version;
  if (v !== version) die(`projects/${project} está en ${v}, no en ${version}. Los 3 van en lockstep.`);
}

// 2 · Notas. Sin sección en el CHANGELOG no hay release: la release ES el anuncio.
const changelog = readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8');
// Split, no regex multilinea: con la bandera `m` el `$` casa fin de LINEA, no fin de
// texto, y la sección salía vacía (medido al estrenar el script).
const block = changelog
  .split(/\n## /)
  .find((b) => b.startsWith(`[${version}]`));
if (!block) die(`CHANGELOG.md no tiene sección "## [${version}]". Escríbela antes de cortar la release.`);
const notes = block
  .slice(block.indexOf('\n') + 1)
  .trim()
  // Enlaces relativos → absolutos al tag: en la página de la release no hay repo debajo.
  .replace(/\]\((?!https?:|#)([^)]+)\)/g, `](https://github.com/${REPO}/blob/${tag}/$1)`);
if (notes.length < 200) die(`La sección del CHANGELOG para ${version} está casi vacía (${notes.length} caracteres).`);

// 3 · Estado del árbol. Una release apunta a un commit: si hay cambios sin commitear,
//     el tag no describe lo que se descarga.
const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
const dirty = sh('git', ['status', '--porcelain']);
const problems = [];
if (dirty) problems.push(`árbol sucio:\n${dirty}`);
if (branch !== 'main') problems.push(`estás en "${branch}", y las releases se cortan desde main`);
try {
  sh('git', ['rev-parse', '--verify', `refs/tags/${tag}`], { stdio: 'pipe' });
  problems.push(`el tag ${tag} YA existe en local`);
} catch {
  /* no existe: es lo que queremos */
}
if (sh('git', ['ls-remote', '--tags', 'origin', tag])) problems.push(`el tag ${tag} YA existe en origin`);

// 4 · Tarballs. Se reconstruyen siempre: un dist/ viejo publicaría código que no es el del tag.
console.log(`\nRelease ${tag} — ${publish ? 'PUBLICANDO' : 'dry-run'}\n`);
if (problems.length) {
  for (const p of problems) console.error(`✗ ${p}`);
  if (publish) process.exit(1);
} else {
  console.log('✓ Árbol limpio, en main, y el tag está libre');
}
console.log(`✓ Versión ${version} en los 4 package.json (lockstep)`);
console.log(`✓ Notas: ${notes.split('\n').length} líneas del CHANGELOG`);

console.log('\nConstruyendo los tarballs (npm run export:all)…');
execFileSync('npm', ['run', 'export:all'], { cwd: root, stdio: publish ? 'inherit' : 'ignore' });
const archives = resolve(root, 'dist/archives');
const assets = PKGS.map(([, tarball]) => {
  const file = `${tarball}-${version}.tgz`;
  const path = resolve(archives, file);
  if (!existsSync(path)) die(`No se generó ${file}. Hay en dist/archives: ${readdirSync(archives).join(', ')}`);
  return path;
});
for (const a of assets) console.log(`  ✓ ${a.replace(`${root}/`, '')}`);

if (!publish) {
  console.log(`\nDry-run. Repite con --publish para crear el tag ${tag} y la release con esos 3 ficheros.`);
  process.exit(0);
}

// 5 · Publicar. `gh release create` crea el tag sobre el commit actual y sube los assets.
const notesFile = resolve(tmpdir(), `sc-release-${tag}.md`);
writeFileSync(notesFile, notes);
execFileSync('gh', ['release', 'create', tag, ...assets, '--repo', REPO, '--title', `${tag} — Smart Contact Design System`, '--notes-file', notesFile], {
  cwd: root,
  stdio: 'inherit',
});
console.log(`\n✓ Release ${tag} publicada: https://github.com/${REPO}/releases/tag/${tag}`);
