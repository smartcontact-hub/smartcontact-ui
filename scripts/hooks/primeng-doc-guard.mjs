#!/usr/bin/env node
/**
 * Hook `UserPromptSubmit` — cuando Rafa pasa un enlace de primeng.dev, la documentación ENTERA se lee
 * antes de escribir, y el componente entra tal cual.
 *
 * Por qué (2026-09-15, DD-112): Rafa pidió «meter el nativo» de Tabs, Toolbar, InputGroup, Divider y
 * SelectButton pasando sus páginas de primeng.dev, y lo que salió se apartó de la documentación en
 * cosas que él vio a simple vista: la raya de `p-tabs` dejó de deslizarse (se cambió por una marca
 * fija en el tema) y las pestañas llevaban contador e icono que el ejemplo no tiene. Sus palabras:
 * «parto de la idea de que lo vas a hacer tal cual sale en la docu». La web de primeng.dev pinta sus
 * ejemplos con JavaScript: leerla con un fetch trae los títulos, no el código ni la API. Sin una
 * máquina que lo recuerde en ese momento, la tentación es construir desde un ejemplo suelto.
 *
 * Qué hace: si el mensaje trae `primeng.dev/<componente>` (o `primeng.org`), mete en el contexto la
 * orden de sacar la documentación completa con `tools/primeng-doc.mjs` y las reglas de AGENTS.md
 * («Componentes de primeng.dev»). Lo que se puede vigilar después lo vigila
 * `audit:primeng-coupling` §F (una regla que oculta, anima o transforma una pieza de PrimeNG).
 *
 * Entrada: JSON por stdin (prompt). Salida: texto plano → contexto de Claude. Falla ABIERTO.
 */
import { fileURLToPath } from 'node:url';

const ENLACE = /\bprimeng\.(?:dev|org)\/([a-z][a-z0-9-]*)/gi;
// Páginas de la web que no son un componente.
const NO_COMPONENTES = new Set(['installation', 'configuration', 'theming', 'styled', 'unstyled', 'passthrough', 'icons', 'guides', 'playground', 'templates', 'llms', 'mcp', 'uikit', 'designer', 'support', 'roadmap', 'team', 'colors', 'tailwind', 'accessibility', 'animations', 'customicons', 'i18n', 'setup', 'vite', 'migration']);
const SOBRE_DE_AGENTE = /^\s*<(?:cross-session-message|task-notification|scheduled-task)\b/i;

/** Componentes de primeng.dev citados en el mensaje, sin repetir y en orden. */
export function componentesCitados(texto) {
  if (typeof texto !== 'string' || SOBRE_DE_AGENTE.test(texto)) return [];
  const vistos = [];
  for (const m of texto.matchAll(ENLACE)) {
    const c = m[1].toLowerCase();
    if (!NO_COMPONENTES.has(c) && !vistos.includes(c)) vistos.push(c);
  }
  return vistos;
}

export function aviso(componentes) {
  const lista = componentes.map((c) => `\`${c}\``).join(', ');
  return [
    `⚠️ sc: Rafa pide componentes de primeng.dev (${lista}). Regla (AGENTS.md, «Componentes de primeng.dev», DD-112):`,
    `  1. Antes de escribir, la doc ENTERA de cada uno: ${componentes.map((c) => `\`node tools/primeng-doc.mjs ${c}\``).join(' · ')} (secciones, API instalada con lo obsoleto, movimiento, nuestra capa). La web no trae el código.`,
    '  2. El nativo TAL CUAL: su plantilla, sus props y su comportamiento y movimiento. Nuestra capa solo en tokens (preset). Nada que el ejemplo no tenga (contadores, iconos, envoltorios) sin decir por qué.',
    '  3. Mídelo contra primeng.dev en el navegador (espaciado, estados, movimiento) antes de enseñarlo. Un desvío de comportamiento lo para `audit:primeng-coupling` §F: si hace falta, se propone a Rafa con su medida.',
  ].join('\n');
}

async function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  for await (const d of process.stdin) raw += d;
  try {
    const comps = componentesCitados(JSON.parse(raw || '{}').prompt);
    if (comps.length) process.stdout.write(aviso(comps) + '\n');
  } catch (e) {
    process.stderr.write(`primeng-doc-guard: ${e.message}\n`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
