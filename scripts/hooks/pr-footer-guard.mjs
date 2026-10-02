#!/usr/bin/env node
/**
 * Hook `PostToolUse` (la herramienta MCP que crea un PR) — en una sesión cloud, el pie de atribución que el
 * servidor añade a la portada del PR se quita en el acto.
 *
 * Por qué (2026-09-28): el repo es público y la portada de un PR va sin atribución de la herramienta
 * (AGENTS.md §«Pull requests y commits»). `attribution` de `.claude/settings.json` apaga la del CLI y
 * `bash-guard` deniega la de un `gh pr create` escrito a mano, pero en una sesión cloud no hay `gh`: el PR
 * se crea por el servidor MCP de GitHub, y ese servidor añade al final del cuerpo una raya y la línea de
 * atribución con el enlace de la sesión. Pasó en los tres PR creados así (#256, #262 y #265), con el
 * cuerpo enviado limpio; la respuesta de la herramienta solo trae el número y la URL, así que el pie
 * solo se ve al leer el PR. Las tres veces se quitó de memoria, y la memoria no viaja a la sesión
 * siguiente.
 *
 * Qué hace: tras crear un PR por MCP en la nube (`CLAUDE_CODE_REMOTE=true`, como `cloud-node.sh`), le
 * pide a Claude leer ese PR y quitar el pie con `update_pull_request`. En local calla: ahí el PR sale
 * por `gh` y lo vigila `bash-guard`.
 *
 * Entrada: JSON por stdin (tool_name, tool_response). Salida: JSON `decision: block` con el motivo, que
 * es como un `PostToolUse` le habla a Claude (la herramienta ya corrió: no deshace nada). Falla ABIERTO.
 */
import { fileURLToPath } from 'node:url';

const CREA_PR = /^mcp__.+__create_pull_request$/;

/** true si esta llamada creó un PR por MCP en una sesión cloud. */
export function debeAvisar(entrada, env = process.env) {
  return env.CLAUDE_CODE_REMOTE === 'true' && CREA_PR.test(String(entrada?.tool_name ?? ''));
}

/** El número del PR, de la URL que devuelve la herramienta (`{"id":…,"url":…/pull/N}`); null si no está. */
export function numeroDelPr(respuesta) {
  const texto = typeof respuesta === 'string' ? respuesta : JSON.stringify(respuesta ?? '');
  const m = /\/pull\/(\d+)/.exec(texto);
  return m ? Number(m[1]) : null;
}

export function motivo(numero) {
  const pr = numero ? `#${numero}` : 'el PR que acabas de crear';
  return [
    `sc: ${pr} se ha creado por MCP en una sesión cloud, y aquí el servidor añade al final de la portada un pie de atribución (una raya y la línea con el enlace de la sesión), aunque el cuerpo enviado vaya limpio.`,
    'El repo es público y la portada va sin atribución (AGENTS.md §«Pull requests y commits»). Antes de seguir:',
    `  1. Lee ${pr} (\`pull_request_read\`, método \`get\`): el pie son las últimas líneas, tras un \`---\`.`,
    '  2. `update_pull_request` con el cuerpo sin esas líneas.',
    `  3. Vuelve a leer ${pr} y confirma que la portada acaba en tu último párrafo.`,
  ].join('\n');
}

async function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  for await (const d of process.stdin) raw += d;
  try {
    const entrada = JSON.parse(raw || '{}');
    if (!debeAvisar(entrada)) return;
    process.stdout.write(JSON.stringify({ decision: 'block', reason: motivo(numeroDelPr(entrada.tool_response)) }));
  } catch (e) {
    process.stderr.write(`pr-footer-guard: ${e.message}\n`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
