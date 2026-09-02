#!/usr/bin/env node
/**
 * Hook `SessionStart` — memoria de trabajo que sobrevive a la compactación.
 *
 * Dos cosas que LEARNINGS documenta como perdidas justo después de compactar:
 *   · el SHA con el que arrancaste (#5 s28: main se movió bajo tus pies y no te enteraste
 *     hasta el push). En `startup`/`resume`/`fork` se anota; en `compact` se compara con
 *     `origin/main` para los ficheros de guía y hand-off, y si hay novedad, se dice.
 *   · si el árbol actual ya pasó preflight (#7): la marca `.preflight-ok` se relee y se
 *     informa, para no volver a lanzar la cadena "por si acaso" (s35: TRECE veces).
 *
 * La tarjeta de punto de decisión NO se reinyecta aquí: vive en `CLAUDE.md`, que viaja en
 * cada turno de todos modos. Aquí solo va lo que cambia con el tiempo.
 *
 * Entrada: JSON por stdin (reason, session_id, cwd). Salida: texto plano → contexto de Claude.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const git = (cwd, args, opts = {}) => execFileSync('git', args, { cwd, encoding: 'utf8', timeout: 8000, ...opts }).trim();
const GUIA = ['CLAUDE.md', 'AGENTS.md', 'LEARNINGS.md', 'NEXT-SESSION.md', 'docs/handoff/'];

function rutaSesion(cwd, id) {
  const gitDir = git(cwd, ['rev-parse', '--git-dir']);
  const dir = join(cwd, gitDir, 'sc-hooks');
  mkdirSync(dir, { recursive: true });
  return join(dir, `session-${id}.sha`);
}

export function alArrancar(cwd, id) {
  const ruta = rutaSesion(cwd, id);
  if (!existsSync(ruta)) writeFileSync(ruta, git(cwd, ['rev-parse', 'HEAD']) + '\n');
  return readFileSync(ruta, 'utf8').trim();
}

export async function alCompactar(cwd, id) {
  const lineas = [];
  const inicio = alArrancar(cwd, id);
  try {
    git(cwd, ['fetch', '-q', '--no-tags', 'origin', 'main'], { stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    lineas.push('(no pude hacer fetch de origin/main; la comparación de abajo es contra lo que hay en local)');
  }
  let movido = '';
  try {
    movido = git(cwd, ['log', '--oneline', `${inicio}..origin/main`, '--', ...GUIA]);
  } catch {
    /* sha de arranque ya no alcanzable o sin origin: sin comparación */
  }
  if (movido)
    lineas.push(
      `⚠️ Desde que arrancaste (${inicio.slice(0, 7)}) han cambiado en origin/main ficheros de guía o hand-off. RELÉELOS antes de cerrar (LEARNINGS #5):\n${movido}`,
    );
  else lineas.push(`Guía y hand-offs sin cambios en origin/main desde tu arranque (${inicio.slice(0, 7)}).`);

  try {
    const { estadoPreflight } = await import('../preflight-mark.mjs');
    const st = estadoPreflight(cwd);
    lineas.push(st.ok ? `Preflight: ✓ ${st.motivo}. No lo relances si no cambias el árbol.` : `Preflight: ✗ ${st.motivo}.`);
  } catch {
    /* sin marca: nada que decir */
  }
  lineas.push('La tarjeta de punto de decisión de CLAUDE.md sigue vigente: reléela antes de afirmar, commitear o pushear.');
  return lineas.join('\n');
}

async function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  for await (const d of process.stdin) raw += d;
  let input = {};
  try {
    input = JSON.parse(raw || '{}');
  } catch {
    return;
  }
  const cwd = input.cwd || process.cwd();
  const id = (input.session_id || 'sin-id').replace(/[^a-zA-Z0-9-]/g, '');
  try {
    if (input.reason === 'compact') process.stdout.write((await alCompactar(cwd, id)) + '\n');
    else alArrancar(cwd, id);
  } catch (e) {
    process.stderr.write(`compact-card: ${e.message}\n`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
