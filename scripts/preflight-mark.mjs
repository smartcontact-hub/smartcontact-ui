#!/usr/bin/env node
/**
 * Marca de "preflight verde sobre ESTE árbol", y su lectura.
 *
 * Es la mitad mecánica de LEARNINGS #7: `preflight` UNA vez sobre el árbol FINAL, y solo
 * entonces `git push`. Antes eso era prosa (2.180 palabras, ≥8 reincidencias documentadas);
 * ahora es un fichero que escribe el último paso de `preflight` / `preflight:fast` /
 * `preflight:scope -- --run`, y que lee el hook de `git push` (`scripts/hooks/bash-guard.mjs`).
 *
 * Qué identifica el árbol: el TREE ID del working tree (`git write-tree` sobre un índice
 * temporal con `git add -A`). Es el mismo id que tendrá el commit si commiteas exactamente
 * eso, así que da igual si corriste preflight antes o después de commitear: lo que se exige
 * es que el contenido que pasó preflight sea el contenido de HEAD (committeado y sin nada
 * pendiente). Cambia una coma en un `.md` y el id cambia — que es justo lo que s33 pedía.
 *
 * Uso:  node scripts/preflight-mark.mjs <carril>     (lo llama la cadena al acabar en verde)
 *       node scripts/preflight-mark.mjs --check      (exit 0 si ESTE árbol ya pasó; lo usa `.githooks/pre-push`)
 *       import { estadoPreflight } from './preflight-mark.mjs'   (lo lee el hook de Claude)
 *
 * Dos hooks, una marca: el `pre-push` de git (s39) corría la cadena en CADA push, incluso sobre un
 * árbol que acababa de pasarla (medido 2026-09-02: 10 min repetidos y el push agotando el timeout
 * del agente). Ahora el pre-push mira la marca primero y solo corre la cadena si falta o caducó;
 * el hook de Claude deniega el push antes de llegar ahí si la marca no cuadra.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MARCA = '.preflight-ok';

const git = (cwd, args, env = {}) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, ...env } }).trim();

/** Tree id del working tree (tracked + untracked no ignorados), sin tocar el índice real. */
export function treeIdWorkingTree(cwd) {
  const dir = mkdtempSync(join(tmpdir(), 'sc-tree-'));
  const index = join(dir, 'index');
  try {
    git(cwd, ['read-tree', 'HEAD'], { GIT_INDEX_FILE: index });
    git(cwd, ['add', '-A'], { GIT_INDEX_FILE: index });
    return git(cwd, ['write-tree'], { GIT_INDEX_FILE: index });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function escribirMarca(cwd, carril) {
  const marca = {
    tree: treeIdWorkingTree(cwd),
    head: git(cwd, ['rev-parse', 'HEAD']),
    carril,
    en: new Date().toISOString(),
  };
  writeFileSync(join(cwd, MARCA), JSON.stringify(marca, null, 2) + '\n');
  return marca;
}

/**
 * ¿Se puede pushear HEAD? Verde solo si hay marca, el working tree es EXACTAMENTE el que pasó
 * preflight, y ese contenido está commiteado (HEAD^{tree} == marca.tree).
 * Devuelve { ok, motivo, marca }.
 */
export function estadoPreflight(cwd) {
  const ruta = join(cwd, MARCA);
  if (!existsSync(ruta)) return { ok: false, motivo: 'no hay marca de preflight (ningún carril ha pasado en verde sobre este árbol)' };
  let marca;
  try {
    marca = JSON.parse(readFileSync(ruta, 'utf8'));
  } catch {
    return { ok: false, motivo: `${MARCA} ilegible` };
  }
  const ahora = treeIdWorkingTree(cwd);
  if (ahora !== marca.tree)
    return { ok: false, motivo: `el árbol cambió después del preflight (${marca.carril}, ${marca.en}); no es el árbol final`, marca };
  const headTree = git(cwd, ['rev-parse', 'HEAD^{tree}']);
  if (headTree !== marca.tree)
    return { ok: false, motivo: 'el árbol que pasó preflight tiene cambios SIN COMMITEAR: lo que se pushea (HEAD) no es lo que se midió', marca };
  return { ok: true, motivo: `preflight ${marca.carril} en verde sobre este árbol (${marca.en})`, marca };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv[2] === '--check') {
    // Lo usa `.githooks/pre-push`: exit 0 = este árbol ya pasó un carril, no hace falta repetirlo.
    const st = estadoPreflight(process.cwd());
    console.log(`${st.ok ? '✓' : '✗'} ${st.motivo}`);
    process.exit(st.ok ? 0 : 1);
  }
  const carril = process.argv[2] || 'preflight';
  const m = escribirMarca(process.cwd(), carril);
  console.log(`✓ ${MARCA}: ${carril} en verde sobre tree ${m.tree.slice(0, 12)} (HEAD ${m.head.slice(0, 7)}). Ya puedes pushear ESTE árbol.`);
}
