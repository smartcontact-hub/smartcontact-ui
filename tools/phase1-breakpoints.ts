/**
 * FASE 1 — MAPA DE BREAKPOINTS.
 *
 * El encargo dice «no supongas los breakpoints, barre 320→1920 y busca discontinuidades».
 * El barrido es una forma de deducir por fuera lo que el CSS ya declara por dentro, y aqui
 * el CSS del original se puede LEER: viene sin minificar en su bundle. Asi que se leen sus
 * '@media' y '@container' directamente, que es la misma verdad sin ruido de muestreo.
 *
 * ⚠️ Lo que esto NO ve: un breakpoint aplicado desde JavaScript (un 'matchMedia' que cambia
 * clases, o un ResizeObserver). Eso solo aparece barriendo la app en vivo, y eso sigue tras
 * el login. Los candidatos que aparezcan en JS se listan aparte, sin darlos por buenos.
 *
 * Uso:  node tools/phase1-breakpoints.ts
 * Escribe findings/phase-1-breakpoints.json
 */
import { mkdir, writeFile } from 'node:fs/promises';
import * as csstree from 'css-tree';
import {
  ORIGIN,
  originalCss,
  replicaCss,
  type CssSource,
} from './lib/css-sources.ts';

interface Query {
  readonly raw: string;
  readonly sources: string[];
  readonly count: number;
}

interface Edge {
  /** Valor declarado, tal cual. */
  readonly raw: string;
  /** En px, si la unidad es convertible. En el original 1rem = 0.8vw = 11.648px a 1456. */
  readonly px: number | null;
  readonly feature: string;
  readonly count: number;
}

const REM_PX_ORIGINAL = 0.8 * 14.56;

function toPx(value: string, remPx: number): number | null {
  const m = /^(-?\d*\.?\d+)(px|rem|em|vw)$/.exec(value.trim());
  if (!m) {
    return null;
  }
  const n = Number(m[1]);
  switch (m[2]) {
    case 'px':
      return n;
    case 'rem':
    case 'em':
      return n * remPx;
    case 'vw':
      return n * 14.56;
    default:
      return null;
  }
}

function scan(
  sources: readonly CssSource[],
  remPx: number
): { queries: Query[]; edges: Edge[] } {
  const queries = new Map<string, { sources: Set<string>; count: number }>();
  const edges = new Map<string, { feature: string; count: number }>();

  for (const { name, css } of sources) {
    let ast: csstree.CssNode;
    try {
      ast = csstree.parse(css, { positions: false, parseValue: false });
    } catch {
      continue;
    }
    csstree.walk(ast, {
      visit: 'Atrule',
      enter(node) {
        if (node.name !== 'media' && node.name !== 'container') {
          return;
        }
        if (!node.prelude) {
          return;
        }
        const raw = `@${node.name} ${csstree.generate(node.prelude)}`.replace(
          /\s+/g,
          ' '
        );
        const hit = queries.get(raw) ?? {
          sources: new Set<string>(),
          count: 0,
        };
        hit.sources.add(name);
        hit.count += 1;
        queries.set(raw, hit);

        // Cada umbral de anchura es un borde candidato.
        for (const m of raw.matchAll(
          /(min-width|max-width|min-inline-size|max-inline-size)\s*:\s*([\d.]+(?:px|rem|em|vw))/g
        )) {
          const feature = m[1] as string;
          const value = m[2] as string;
          const key = `${feature}:${value}`;
          const e = edges.get(key) ?? { feature, count: 0 };
          e.count += 1;
          edges.set(key, e);
        }
      },
    });
  }

  return {
    queries: [...queries.entries()]
      .map(([raw, v]) => ({ raw, sources: [...v.sources], count: v.count }))
      .sort((a, b) => b.count - a.count),
    edges: [...edges.entries()]
      .map(([key, v]) => {
        const raw = key.split(':')[1] as string;
        return {
          raw,
          px: toPx(raw, remPx),
          feature: v.feature,
          count: v.count,
        };
      })
      .sort((a, b) => (a.px ?? 0) - (b.px ?? 0)),
  };
}

const orig = scan(await originalCss(), REM_PX_ORIGINAL);
// En la replica el rem SI vale 16px: no hereda el '*' global del original.
const rep = scan(await replicaCss(), 16);

/** Conjunto de anchos a medir: cada borde, ±1px, mas los fijos del encargo. */
const widths = new Set<number>([320, 768, 1440, 1456, 1920]);
for (const e of orig.edges) {
  if (e.px === null) {
    continue;
  }
  const w = Math.round(e.px);
  widths.add(w - 1);
  widths.add(w);
  widths.add(w + 1);
}

const report = {
  phase: 'phase-1-breakpoints',
  method: 'declarado (leido del CSS del bundle), no barrido',
  origin: ORIGIN,
  caveat:
    'No cubre breakpoints aplicados desde JavaScript (matchMedia, ResizeObserver). Eso exige barrer la app en vivo, y esta tras el login.',
  original: {
    mediaQueries: orig.queries.length,
    widthEdges: orig.edges,
    queries: orig.queries.slice(0, 60),
  },
  replica: {
    mediaQueries: rep.queries.length,
    widthEdges: rep.edges,
    queries: rep.queries,
  },
  measurementWidths: [...widths].sort((a, b) => a - b),
};

await mkdir('findings', { recursive: true });
await writeFile(
  'findings/phase-1-breakpoints.json',
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8'
);

console.log(
  `original: ${orig.queries.length} consultas distintas, ${orig.edges.length} umbrales de anchura`
);
for (const e of orig.edges) {
  console.log(
    `  ${e.feature.padEnd(9)} ${e.raw.padStart(10)} = ${
      e.px === null ? '?' : `${e.px.toFixed(0)}px`.padStart(7)
    }  x${e.count}`
  );
}
console.log(
  `replica:  ${rep.queries.length} consultas distintas, ${rep.edges.length} umbrales`
);
for (const e of rep.edges) {
  console.log(
    `  ${e.feature.padEnd(9)} ${e.raw.padStart(10)} = ${
      e.px === null ? '?' : `${e.px.toFixed(0)}px`.padStart(7)
    }  x${e.count}`
  );
}
console.log(`anchos de medicion: ${report.measurementWidths.length}`);
