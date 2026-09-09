#!/usr/bin/env node
/**
 * Hook `UserPromptSubmit` — la corrección se registra EN EL MOMENTO, no al cerrar.
 *
 * Por qué: `/reflect` corre al final de la sesión, cuando la corrección ya se ha olvidado o
 * racionalizado. Medido el 2026-09-09: las seis reglas más rotas de LEARNINGS (de 3 a 5 sesiones
 * cada una) están TODAS en la tarjeta de CLAUDE.md que viaja en cada turno, y siguen siendo prosa.
 * Más texto no las dispara; lo que falta es que una máquina vea el momento en que Rafa corrige.
 *
 * Qué hace: si el mensaje suena a corrección (patrones ESTRECHOS, en su idioma), lo apunta en
 * `correcciones.jsonl` (en la carpeta del proyecto de Claude, fuera del repo) y mete una línea en
 * el contexto para que la respuesta empiece por nombrar qué regla o ficha ya lo cubría. Un falso
 * positivo cuesta una línea; un falso negativo es lo de siempre.
 *
 * Entrada: JSON por stdin (prompt, session_id, cwd). Salida: texto plano → contexto de Claude.
 * `--listar [horas]` imprime las correcciones recientes agrupadas por sesión (lo lee /reflect).
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { dirProyectoClaude } from '../memory-shape.mjs';

const PATRONES = [
  /^\s*no[,.;:]\s/i,
  /\botra vez\b/i,
  /\bya te (lo )?(he )?dich[oa]\b/i,
  /\bte (lo )?(dije|he dicho|he pedido|pedí)\b/i,
  /\bpara lerdos\b/i,
  /\bno me refer[ií]a\b|\bno me refiero\b/i,
  /\bno era eso\b|\beso no es\b/i,
  /\bte has (saltado|pasado|equivocado|colado|liado)\b/i,
  /\bno hagas\b|\bdeja de\b/i,
  /\best[áa] mal\b/i,
  /\bpor qu[eé] (no )?(has|lo has|me has|hiciste|lo hiciste)\b/i,
  /\bcontra (tus|mis) bias\b/i,
];

export const esCorreccion = (texto) => typeof texto === 'string' && PATRONES.some((p) => p.test(texto));

export function rutaRegistro(cwd) {
  const dir = dirProyectoClaude(cwd);
  return dir ? join(dir, 'correcciones.jsonl') : null;
}

/** Apunta la corrección y devuelve cuántas lleva esta sesión (0 si no hay dónde apuntar). */
export function registrar({ prompt, session_id, cwd }) {
  const ruta = rutaRegistro(cwd);
  if (!ruta) return 0;
  mkdirSync(join(ruta, '..'), { recursive: true });
  appendFileSync(ruta, JSON.stringify({ ts: new Date().toISOString(), session_id, cwd, prompt: prompt.slice(0, 300) }) + '\n');
  return leer(ruta).filter((e) => e.session_id === session_id).length;
}

export function leer(ruta, horas = Infinity) {
  if (!ruta || !existsSync(ruta)) return [];
  const desde = Date.now() - horas * 3600 * 1000;
  const out = [];
  for (const linea of readFileSync(ruta, 'utf8').split('\n')) {
    if (!linea.trim()) continue;
    try {
      const e = JSON.parse(linea);
      if (Date.parse(e.ts) >= desde) out.push(e);
    } catch {
      /* línea corrupta: se ignora */
    }
  }
  return out;
}

export function aviso(n) {
  return (
    `⚠️ sc: esto suena a corrección (nº ${n} de la sesión; apuntada en correcciones.jsonl). ` +
    'Antes de contestar, di en UNA línea qué regla de LEARNINGS (#N) o ficha de memoria ya lo cubría, o «ninguna». /reflect la enruta al cerrar.'
  );
}

function listar(horas) {
  const entradas = leer(rutaRegistro(process.cwd()), horas);
  if (!entradas.length) return `Sin correcciones registradas en las últimas ${horas} h.`;
  const porSesion = new Map();
  for (const e of entradas) porSesion.set(e.session_id, [...(porSesion.get(e.session_id) || []), e]);
  const lineas = [`${entradas.length} corrección(es) en las últimas ${horas} h:`];
  for (const [sid, es] of porSesion) {
    lineas.push(`· sesión ${String(sid).slice(0, 8)} (${es.length}):`);
    for (const e of es) lineas.push(`    ${e.ts.slice(0, 16)}  ${e.prompt.replace(/\s+/g, ' ').slice(0, 120)}`);
  }
  return lineas.join('\n');
}

async function main() {
  const i = process.argv.indexOf('--listar');
  if (i > 0) {
    process.stdout.write(listar(Number(process.argv[i + 1]) || 48) + '\n');
    return;
  }
  let raw = '';
  process.stdin.setEncoding('utf8');
  for await (const d of process.stdin) raw += d;
  let input = {};
  try {
    input = JSON.parse(raw || '{}');
  } catch {
    return;
  }
  if (!esCorreccion(input.prompt)) return;
  try {
    const n = registrar({ prompt: input.prompt, session_id: input.session_id || 'sin-id', cwd: input.cwd || process.cwd() });
    process.stdout.write(aviso(n) + '\n');
  } catch (e) {
    // Un hook roto no puede bloquear el trabajo: falla ABIERTO y lo dice.
    process.stderr.write(`correction-capture: ${e.message}\n`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
