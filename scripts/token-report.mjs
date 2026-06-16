#!/usr/bin/env node
/**
 * Carril RÁPIDO de feedback para diseño — traduce las validaciones a cristiano.
 *
 * El parity + los generadores ya saben el fallo EXACTO (contraste, color fuera de
 * paleta, drift…). Este script captura esa salida técnica y la TRADUCE a un
 * veredicto en lenguaje claro (Markdown) para que el diseñador sepa en ~1 min QUÉ
 * pasó y POR QUÉ, sin leer logs de CI ni esperar al build/e2e/preview (~5 min).
 *
 * Sin IA a propósito: los checks son deterministas y finitos → una traducción por
 * reglas es instantánea, exacta y no se inventa nada. (IA quedaría para "sugiéreme
 * el color corregido", que es otro lote del roadmap.)
 *
 * NO es un gate (sale 0 siempre) — el gate sigue siendo `verify` / `tokens-sync`.
 * Lo consume `.github/workflows/tokens-check.yml` (resumen del run + comentario PR).
 *
 * Uso:
 *   node scripts/token-report.mjs [import.log]   # imprime el Markdown del veredicto
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

// ── Traductores: patrón técnico → frase en cristiano ──────────────────────────
// Cada uno devuelve { plain } si machea la línea, o null. El orden no importa
// (se deduplica por texto). Añade uno nuevo cuando aparezca un fallo no cubierto.
const TRANSLATORS = [
  // a11y · contraste por debajo de AA (lo que más pega un cambio de color)
  (line) => {
    const m = line.match(
      /✗\s*\[(\w+)\]\s*a11y:\s*--\S+\s+sobre\s+--\S+\s*=\s*([\d.]+):1\s*\(<\s*AA\s*([\d.]+);\s*(#\w+)\/(#\w+)\)/,
    );
    if (!m) return null;
    const [, mode, ratio, aa, fgHex, bgHex] = m;
    const modo = mode === 'dark' ? 'modo oscuro' : 'modo claro';
    return {
      plain:
        `**Contraste insuficiente (${modo}).** El texto sobre ese fondo se lee a **${ratio}:1**, ` +
        `y hace falta **${aa}:1** para que sea legible (\`${fgHex}\` sobre \`${bgHex}\`). ` +
        `→ Usa colores con más diferencia de luz (oscurece el fondo si el texto es claro, o al revés).`,
    };
  },
  // color elegido fuera de la paleta del DS (el generador no encuentra primitiva)
  (line) => {
    const m = line.match(/\[(\w+)\]\s+(\S+)\s*=\s*(#\w+)\s*\(sin --sc-color-\* primitiva\)/);
    if (!m) return null;
    const [, , path, hex] = m;
    return {
      plain:
        `**Color fuera de la paleta.** Elegiste \`${hex}\` (en \`${path}\`), pero ese tono exacto ` +
        `no existe en la rampa del DS. → Usa un paso que sí exista (p.ej. \`amber-600\`), no un tono intermedio.`,
    };
  },
  // color desalineado export ↔ código (parity §6)
  (line) => {
    const m = line.match(/✗\s*\[(\w+)\]\s+(\S+):\s*export=(#\w+)\s+vs\s+--(\S+)=(#\w+)/);
    if (!m) return null;
    const [, mode, path, expHex, , gotHex] = m;
    return {
      plain:
        `**Color desalineado (${mode}).** \`${path}\` en Figma es \`${expHex}\` pero el código ` +
        `resuelve a \`${gotHex}\`. Suele cuadrar al regenerar; si insiste, es una divergencia a declarar.`,
    };
  },
  // sizing desalineado (parity §4)
  (line) => {
    const m = line.match(/✗\s*(\S+):\s*DRIFT\s*—\s*export=(\S+)\s+vs\s+preset=(\S+)/);
    if (!m) return null;
    const [, label, exp, got] = m;
    return { plain: `**Tamaño desalineado.** \`${label}\`: Figma dice \`${exp}\` pero el preset usa \`${got}\`.` };
  },
];

/**
 * @param {string} rawText  salida técnica combinada (import + parity)
 * @param {{failed:boolean}} opts  si alguna validación salió ≠0
 * @returns {string} Markdown del veredicto en cristiano
 */
export function buildReport(rawText, { failed }) {
  const findings = [];
  const seen = new Set();
  for (const line of rawText.split('\n')) {
    for (const t of TRANSLATORS) {
      const r = t(line);
      if (r && !seen.has(r.plain)) {
        seen.add(r.plain);
        findings.push(r);
      }
    }
  }
  // No dejar al diseñador a ciegas: si algo falló y ningún traductor lo cazó, muestra el crudo.
  if (failed && findings.length === 0) {
    const raw = rawText
      .split('\n')
      .filter((l) => /^\s*✗/.test(l))
      .slice(0, 6)
      .join('\n');
    findings.push({
      plain:
        '**Hay un problema que el traductor aún no reconoce.** Detalle técnico:\n\n' +
        '```\n' + (raw || '(ver el log del run)') + '\n```',
    });
  }

  const ok = !failed && findings.length === 0;
  const foot =
    '\n\n<sub>Informe rápido (parity + a11y), ~1 min. El build + e2e + preview van por su carril (~5 min). ' +
    'Generado por `scripts/token-report.mjs` — reglas, sin IA.</sub>';

  if (ok) {
    return (
      '## ✅ Tu cambio cuadra con el sistema\n\n' +
      'Contraste, paridad y escala: **todo bien**. Cuando el preview termine (~5 min) lo verás renderizado.' +
      foot
    );
  }
  return (
    `## ❌ Tu cambio tiene ${findings.length} cosa(s) que arreglar\n\n` +
    'No impide verlo en el preview, pero **no debería mergearse así**:\n\n' +
    findings.map((f, i) => `${i + 1}. ${f.plain}`).join('\n\n') +
    foot
  );
}

// ── CLI ───────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  // import.log = salida capturada de `npm run tokens:import` (puede traer errores de
  // generador, p.ej. color fuera de paleta). El workflow la pasa; en local es opcional.
  const importLog = process.argv[2];
  const importOut = importLog && existsSync(importLog) ? readFileSync(importLog, 'utf8') : '';
  const importFailed = /✗\s*token-gen/.test(importOut);

  let parityOut = '';
  let parityFailed = false;
  try {
    parityOut = execFileSync(process.execPath, [resolve(root, 'scripts/token-parity.mjs')], {
      cwd: root,
      encoding: 'utf8',
    });
  } catch (e) {
    parityOut = `${e.stdout || ''}${e.stderr || ''}`;
    parityFailed = true;
  }

  process.stdout.write(
    buildReport(`${importOut}\n${parityOut}`, { failed: importFailed || parityFailed }) + '\n',
  );
}
