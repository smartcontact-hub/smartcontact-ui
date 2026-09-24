#!/usr/bin/env node
/**
 * Hook `UserPromptSubmit` — `main` se mueve bajo los ficheros que estás tocando, y te lo dice ANTES
 * de que le enseñes nada al usuario.
 *
 * Por qué (2026-09-23, fichas de grupo, LEARNINGS #21): la sesión arrancó sobre un `main` de las
 * 16:31 y construyó encima. Mientras la revisión en local seguía abierta, entraron #237 (18:28), #239
 * (18:41) y #240 (20:57), las tres sobre las mismas fichas, y luego otra caja fundió sobre el mismo
 * fichero (21:50). En la revisión volvió deshecho lo ya aprobado (el hueco bajo la cabecera, las cajas de
 * sección) y una propuesta que rompía una decisión fijada con test ese mismo día. La regla #21 dice
 * «compara con origin/main ANTES de empezar»; al empezar no había nada que ver. Hacía falta mirar
 * a MITAD de sesión, y eso solo lo hace una máquina.
 *
 * Qué hace: en cada mensaje del usuario (con un `fetch` como mucho cada 5 minutos, para no pagar red en
 * cada turno) cruza los commits de `HEAD..origin/main` con los ficheros que esta rama cambia respecto
 * a su base, commiteados o no. Si alguno coincide, lo dice con los commits. Falla ABIERTO: sin red o
 * sin `origin`, calla.
 *
 * Entrada: JSON por stdin (cwd, prompt). Salida: texto plano → contexto de Claude.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Sin las `GIT_*` heredadas: que el `cwd` mande, aunque alguien lo llame desde dentro de un hook de git.
const SIN_GIT = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));
const git = (cwd, args) =>
  execFileSync('git', args, { cwd, env: SIN_GIT, encoding: 'utf8', timeout: 8000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const CADA_MS = 5 * 60 * 1000;
const SOBRE_DE_AGENTE = /^\s*<(?:cross-session-message|task-notification|scheduled-task)\b/i;

/** `fetch` de origin/main si el último fue hace más de 5 minutos. Devuelve si lo intentó. */
export function fetchSiToca(cwd, ahora = Date.now()) {
  const dir = join(cwd, git(cwd, ['rev-parse', '--git-common-dir']), 'sc-hooks');
  mkdirSync(dir, { recursive: true });
  const marca = join(dir, 'main-drift-fetch');
  const ultimo = existsSync(marca) ? Number(readFileSync(marca, 'utf8')) || 0 : 0;
  if (ahora - ultimo < CADA_MS) return false;
  writeFileSync(marca, String(ahora));
  try {
    git(cwd, ['fetch', '-q', '--no-tags', 'origin', 'main']);
  } catch {
    /* sin red: se compara con lo que haya en local */
  }
  return true;
}

/**
 * Commits de origin/main que esta rama aún no tiene y que tocan ficheros que ella cambia.
 * Devuelve `{ ficheros, commits }`, vacío si no hay cruce.
 */
export function deriva(cwd) {
  const base = git(cwd, ['merge-base', 'HEAD', 'origin/main']);
  // Contra el ÁRBOL de trabajo: lo commiteado en la rama y lo que está a medias.
  const mios = new Set(git(cwd, ['diff', '--name-only', base]).split('\n').filter(Boolean));
  if (mios.size === 0) return { ficheros: [], commits: [] };
  const suyos = git(cwd, ['diff', '--name-only', base, 'origin/main']).split('\n').filter(Boolean);
  const ficheros = suyos.filter((f) => mios.has(f));
  if (ficheros.length === 0) return { ficheros: [], commits: [] };
  const commits = git(cwd, ['log', '--oneline', `${base}..origin/main`, '--', ...ficheros]).split('\n').filter(Boolean);
  return { ficheros, commits };
}

export function aviso({ ficheros, commits }) {
  if (ficheros.length === 0) return '';
  const lista = ficheros.slice(0, 6).map((f) => `  · ${f}`).join('\n') + (ficheros.length > 6 ? `\n  · (+${ficheros.length - 6})` : '');
  return [
    `⚠️ sc: origin/main ha cambiado ${ficheros.length} fichero(s) que tu rama también toca (LEARNINGS #21):`,
    lista,
    `  Commits: ${commits.slice(0, 5).join(' · ')}${commits.length > 5 ? ' …' : ''}`,
    '  Rebasa (o fúndelo) ANTES de enseñarle nada al usuario o de proponer un cambio: puede que ya esté decidido y hecho.',
  ].join('\n');
}

async function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  for await (const d of process.stdin) raw += d;
  try {
    const input = JSON.parse(raw || '{}');
    if (typeof input.prompt === 'string' && SOBRE_DE_AGENTE.test(input.prompt)) return;
    const cwd = input.cwd || process.cwd();
    fetchSiToca(cwd);
    const texto = aviso(deriva(cwd));
    if (texto) process.stdout.write(texto + '\n');
  } catch (e) {
    process.stderr.write(`main-drift-guard: ${e.message}\n`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
