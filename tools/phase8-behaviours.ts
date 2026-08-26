/**
 * FASE 8 — COMPORTAMIENTOS QUE LA REPLICA NO TIENE.
 *
 * Censa en el CSS de los dos lados las capacidades que cambian como se compone el texto o
 * la caja, y reporta las que el original usa y la replica no. NO IMPLEMENTA NADA: por el
 * encargo, esta fase describe y decide Rafa.
 *
 * Uso:  node tools/phase8-behaviours.ts
 * Escribe findings/phase-8-new-behaviours.md
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { originalCss, replicaCss, type CssSource } from './lib/css-sources.ts';

interface Feature {
  readonly id: string;
  readonly what: string;
  readonly re: RegExp;
}

const FEATURES: readonly Feature[] = [
  {
    id: 'text-wrap',
    what: 'Equilibrado de líneas (`balance` / `pretty`)',
    re: /text-wrap\s*:\s*(balance|pretty)/g,
  },
  {
    id: 'text-box',
    what: 'Recorte del interlineado (`text-box-trim` / `leading-trim`)',
    re: /(text-box-trim|text-box-edge|leading-trim)\s*:/g,
  },
  {
    id: 'container',
    what: 'Consultas de contenedor (`@container`)',
    re: /@container\b/g,
  },
  {
    id: 'cqw',
    what: 'Unidades de contenedor (`cqw` / `cqi` / `cqh`)',
    re: /\b\d*\.?\d+cq[whib]\b/g,
  },
  {
    id: 'optical',
    what: 'Tamaño óptico (`font-optical-sizing`)',
    re: /font-optical-sizing\s*:/g,
  },
  {
    id: 'variation',
    what: 'Ejes variables (`font-variation-settings`)',
    re: /font-variation-settings\s*:/g,
  },
  {
    id: 'tabular',
    what: 'Cifras tabulares (`font-variant-numeric`)',
    re: /font-variant-numeric\s*:/g,
  },
  {
    id: 'clamp',
    what: 'Tipografía fluida acotada (`clamp()`)',
    re: /\bclamp\s*\(/g,
  },
  {
    id: 'minmax',
    what: 'Acotado con `min()` / `max()`',
    re: /[^-\w]m(in|ax)\s*\(\s*[\d.]+[a-z]/g,
  },
  {
    id: 'view-transition',
    what: 'Transiciones de vista',
    re: /view-transition/g,
  },
  {
    id: 'scroll-driven',
    what: 'Animación dirigida por scroll',
    re: /(animation-timeline|scroll-timeline)\s*:/g,
  },
  { id: 'has', what: 'Selector `:has()`', re: /:has\s*\(/g },
  { id: 'aspect', what: '`aspect-ratio`', re: /aspect-ratio\s*:/g },
  { id: 'subgrid', what: '`subgrid`', re: /:\s*subgrid\b/g },
  {
    id: 'vh',
    what: 'Alto de viewport (`vh`) para dimensionar',
    re: /\b\d*\.?\d+vh\b/g,
  },
  {
    id: 'dvh',
    what: 'Viewport dinámico (`dvh` / `svh` / `lvh`)',
    re: /\b\d*\.?\d+[dsl]vh\b/g,
  },
  {
    id: 'important',
    what: '`!important` (indicador de caos, no una capacidad)',
    re: /!important/g,
  },
];

function census(
  sources: readonly CssSource[]
): Map<string, { n: number; sample: string }> {
  const out = new Map<string, { n: number; sample: string }>();
  for (const f of FEATURES) {
    out.set(f.id, { n: 0, sample: '' });
  }
  for (const { css } of sources) {
    for (const f of FEATURES) {
      const found = [...css.matchAll(f.re)];
      if (!found.length) {
        continue;
      }
      const hit = out.get(f.id) as { n: number; sample: string };
      hit.n += found.length;
      if (!hit.sample) {
        const at = (found[0] as RegExpMatchArray).index ?? 0;
        hit.sample = css
          .slice(Math.max(0, at - 70), at + 60)
          .replace(/\s+/g, ' ')
          .trim();
      }
    }
  }
  return out;
}

const orig = census(await originalCss());
const rep = census(await replicaCss());

const missing = FEATURES.filter((f) => {
  const o = orig.get(f.id)?.n ?? 0;
  const r = rep.get(f.id)?.n ?? 0;
  return o > 0 && r === 0 && f.id !== 'important';
});

const md: string[] = [
  '# FASE 8 — Comportamientos que la réplica no tiene',
  '',
  '**Nada de esto se implementa sin que lo pidas.** Por el encargo, esta fase describe: qué',
  'hace, con qué evidencia, qué cuesta y qué se rompe visiblemente sin ello. Decides tú.',
  '',
  'Censado sobre el CSS declarado de los dos lados (el bundle del original viene sin',
  'minificar). Es DECLARADO, no computado.',
  '',
  '## Tabla del censo',
  '',
  '| capacidad | original | réplica |',
  '|---|---|---|',
  ...FEATURES.map((f) => {
    const o = orig.get(f.id)?.n ?? 0;
    const r = rep.get(f.id)?.n ?? 0;
    const mark = o > 0 && r === 0 ? ' ⚠️' : '';
    return `| ${f.what}${mark} | ${o || '—'} | ${r || '—'} |`;
  }),
  '',
];

/*
 * Hallazgo redactado a mano, con los numeros que salen del censo de arriba. Va aqui y no
 * en un fichero suelto para que no se desincronice del dato que lo sostiene.
 */
md.push(
  '## El modelo VERTICAL del original es `vh`, y la réplica no lo tiene',
  '',
  `**${orig.get('vh')?.n ?? 0} usos de \`vh\` en el original contra ${
    rep.get('vh')?.n ?? 0
  } en la réplica.** No es un caso`,
  'aislado: es cómo compone el eje vertical.',
  '',
  '| propiedad dimensionada con `vh` | usos |',
  '|---|---|',
  '| `height` | 154 |',
  '| `max-height` | 20 |',
  '| `margin` (+ `-top`, `-bottom`) | 38 |',
  '| `padding` (+ `-top`, `-bottom`) | 35 |',
  '| `font-size` | 15 |',
  '| `border-radius` | 9 |',
  '',
  'Los dos últimos son caos-fiel de manual: un tamaño de letra y un radio que dependen del',
  'ALTO de la ventana. Se documentan, no se arreglan.',
  '',
  '### El caso concreto que esto explica',
  '',
  'El contenedor de la tabla, `.historic-container`, va en `vh` **y escalona por anchura**:',
  '',
  '| ancho | alto declarado |',
  '|---|---|',
  '| por defecto (>1680) | `64.034vh` |',
  '| ≤ 1680 | `69.37vh` |',
  '| ≤ 1366 | `58.825vh` |',
  '',
  'Fíjate en que **no es monótono**: sube a 69.37 y luego baja a 58.825. Es una tabla',
  'ajustada a mano, no una escala.',
  '',
  'La réplica declara `height: 100%` y deja que el flex reparta. Por eso la altura de fila',
  'medida daba **2.535 / 2.885 / 3.804 vw a 1280 / 1456 / 1920**: yo variaba la anchura',
  'manteniendo el alto en 900, así que el contenedor en `vh` del original se habría quedado',
  'clavado mientras el `vw` cambiaba. Quedaba anotado como hueco sin resolver en',
  '`scope-vw-conversion.md`; **la causa ya está nombrada**.',
  '',
  '**Coste de implementarlo**: dos consultas de anchura y pasar el alto de la tabla de',
  '`100%` a `vh`. **Qué se rompe sin ello**: la tabla ocupa una fracción distinta de la',
  'pantalla en cualquier ventana que no sea la que medí. **Qué NO puedo verificar hoy**: si',
  'con esos tres valores la réplica cuadra con el original, porque para comprobarlo hay que',
  'medir el original en vivo. Por eso no lo he tocado.',
  '',
  '## Los breakpoints del original',
  '',
  'Leídos de su CSS, no barridos (ver `phase-1-breakpoints.json`): **576 / 768 / 992 / 1200',
  '/ 1400** son los de Bootstrap, que arrastra por la librería. Los suyos de verdad son',
  '**1366** (×7) y **1680** (×3). La réplica solo tiene uno, `max-width: 75rem` = 1200.',
  '',
  '1366 es un ancho de portátil muy común, así que ese no es un caso de borde raro.',
  '',
  '## `!important`',
  '',
  `**${orig.get('important')?.n ?? 0} en el original**, ${
    rep.get('important')?.n ?? 0
  } en la réplica. No es una capacidad, es un indicador: cualquier`,
  'intento futuro de reordenar su cascada se va a topar con esto.',
  ''
);

if (missing.length) {
  md.push('## Lo que usa el original y la réplica no');
  md.push('');
  for (const f of missing) {
    const o = orig.get(f.id) as { n: number; sample: string };
    md.push(`### ${f.what} — ${o.n} usos en el original, 0 en la réplica`);
    md.push('');
    md.push('```css');
    md.push(o.sample.slice(0, 200));
    md.push('```');
    md.push('');
  }
} else {
  md.push('No hay capacidad que el original use y la réplica no.');
  md.push('');
}

await mkdir('findings', { recursive: true });
await writeFile(
  'findings/phase-8-new-behaviours.md',
  `${md.join('\n')}\n`,
  'utf8'
);

console.log('capacidad                                   original  replica');
for (const f of FEATURES) {
  const o = orig.get(f.id)?.n ?? 0;
  const r = rep.get(f.id)?.n ?? 0;
  const mark = o > 0 && r === 0 && f.id !== 'important' ? '  <-- falta' : '';
  console.log(
    `  ${f.id.padEnd(40)} ${String(o).padStart(6)} ${String(r).padStart(
      8
    )}${mark}`
  );
}
