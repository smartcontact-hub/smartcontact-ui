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

// hex → [r,g,b] · nearest(hex, palette) → la primitiva del DS más próxima (distancia RGB²).
// Sirve para sugerir un color que SÍ existe cuando el elegido está fuera de la paleta.
const rgb = (h) => {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(String(h).trim());
  return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : null;
};
function nearest(hex, palette = []) {
  const t = rgb(hex);
  if (!t) return null;
  let best = null;
  let bestD = Infinity;
  for (const { name, hex: ph } of palette) {
    const c = rgb(ph);
    if (!c) continue;
    const d = (t[0] - c[0]) ** 2 + (t[1] - c[1]) ** 2 + (t[2] - c[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = { name, hex: ph };
    }
  }
  return best;
}

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
  // color elegido fuera de la paleta del DS (el generador OMITE el slot y avisa).
  // Formato real: `[dark] toast.info.border.color = #0369a15c (base #0369a1 sin --sc-color-* primitiva)`.
  // Capturamos la BASE de 6 dígitos (sin alfa) → así `nearest()` puede sugerir la primitiva más próxima.
  (line, ctx = {}) => {
    const m = line.match(
      /\[(\w+)\]\s+(\S+)\s*=\s*#\w+\s*\(base\s*(#[0-9a-fA-F]{6})\s*sin --sc-color-\* primitiva\)/,
    );
    if (!m) return null;
    const [, , path, base] = m;
    const near = nearest(base, ctx.palette);
    const sug = near
      ? ` Lo más cercano que **sí** existe: \`--${near.name}\` (\`${near.hex}\`).`
      : '';
    return {
      plain:
        `**Color fuera de la paleta del DS** (omitido, NO aplicado — el resto de tu cambio sí fluye). ` +
        `Elegiste \`${base}\` (en \`${path}\`). La paleta del DS es un set **curado** de familias ` +
        `(amber, blue, gray, emerald…) y ese color no está en ninguna.${sug} ` +
        `→ Usa un color de una familia que el DS ya tenga, **o** añade esa familia a la paleta (decisión de DS).`,
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
export function buildReport(rawText, { failed, palette = [] } = {}) {
  const findings = [];
  const seen = new Set();
  for (const line of rawText.split('\n')) {
    for (const t of TRANSLATORS) {
      const r = t(line, { palette });
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

  // Paleta de primitivas del DS — para sugerir el color EXISTENTE más cercano al elegido.
  const palette = [];
  const primPath = resolve(root, 'projects/design-tokens/src/lib/styles/tokens/layers/01-primitive.css');
  if (existsSync(primPath)) {
    for (const m of readFileSync(primPath, 'utf8').matchAll(
      /--(sc-color-[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g,
    )) {
      palette.push({ name: m[1], hex: m[2] });
    }
  }

  process.stdout.write(
    buildReport(`${importOut}\n${parityOut}`, { failed: importFailed || parityFailed, palette }) + '\n',
  );
}
