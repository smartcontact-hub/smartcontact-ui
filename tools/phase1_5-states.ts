/**
 * FASE 1.5 — MATRIZ DE ESTADOS.
 *
 * Dos mitades:
 *
 *  A) DESCUBRIMIENTO. Se parsea el CSS del ORIGINAL con css-tree y se saca cada selector
 *     que lleve un estado (:hover, :focus-visible, :disabled, [aria-expanded]…) Y que ademas
 *     toque alguna de las propiedades que mide la Fase 2. Ese conjunto son los candidatos.
 *     Adivinar o pinchar a mano no vale: un recorrido no reproducible vuelve inservible
 *     cualquier diff residual posterior.
 *
 *  B) PODADO E IDEMPOTENCIA, sobre la replica. Cada actuacion guionizada se ejecuta DOS
 *     veces y tiene que dar la misma huella; si no, no es reproducible y se marca. Y un
 *     estado solo entra en la matriz si CAMBIA alguna medida respecto a 'default'.
 *
 * Uso:  node tools/phase1_5-states.ts
 * Escribe findings/phase-1_5-states.json
 */
import { mkdir, writeFile } from 'node:fs/promises';
import * as csstree from 'css-tree';
import { openSession, settle } from './lib/harness.ts';
import { originalCss, type CssSource } from './lib/css-sources.ts';

/** Propiedades que mide la Fase 2: si el estado no toca ninguna, no nos interesa. */
const MEASURED = new Set([
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'word-spacing',
  'text-transform',
  'margin',
  'padding',
  'gap',
  'border-width',
  'border-radius',
  'width',
  'height',
  'display',
]);

const STATE_PATTERNS: readonly { id: string; re: RegExp }[] = [
  { id: 'hover', re: /:hover\b/ },
  { id: 'focus', re: /:focus\b(?!-)/ },
  { id: 'focus-visible', re: /:focus-visible\b/ },
  { id: 'focus-within', re: /:focus-within\b/ },
  { id: 'active', re: /:active\b/ },
  { id: 'disabled', re: /:disabled\b|\.disabled\b/ },
  { id: 'checked', re: /:checked\b/ },
  { id: 'aria-expanded', re: /\[aria-expanded/ },
  { id: 'data-state', re: /\[data-state/ },
  { id: 'open', re: /\[open\]|\.open\b|\.show\b|\.actived\b/ },
  { id: 'has', re: /:has\s*\(/ },
];

function discover(
  sources: readonly CssSource[]
): Record<string, { rules: number; sample: string }> {
  const out: Record<string, { rules: number; sample: string }> = {};
  for (const p of STATE_PATTERNS) {
    out[p.id] = { rules: 0, sample: '' };
  }
  for (const { css } of sources) {
    let ast: csstree.CssNode;
    try {
      ast = csstree.parse(css, { positions: false, parseValue: false });
    } catch {
      continue;
    }
    csstree.walk(ast, {
      visit: 'Rule',
      enter(rule) {
        if (!rule.prelude || rule.prelude.type !== 'SelectorList') {
          return;
        }
        const selector = csstree.generate(rule.prelude);
        const touches = (
          rule.block.children.toArray() as csstree.CssNode[]
        ).some(
          (d) =>
            d.type === 'Declaration' && MEASURED.has(d.property.toLowerCase())
        );
        if (!touches) {
          return;
        }
        for (const p of STATE_PATTERNS) {
          if (!p.re.test(selector)) {
            continue;
          }
          const hit = out[p.id] as { rules: number; sample: string };
          hit.rules += 1;
          if (!hit.sample) {
            hit.sample = selector.slice(0, 110);
          }
        }
      },
    });
  }
  return out;
}

/** Actuaciones guionizadas de la replica: un paso por 'evaluate', idempotentes. */
const ACTUATIONS: Record<string, string[]> = {
  default: [],
  'comunicator-call': [`document.querySelector('.footer__av')?.click();`],
  'comunicator-chat': [
    `document.querySelector('.footer__av')?.click();`,
    `document.querySelectorAll('.com__tab')[1]?.click();`,
  ],
  'comunicator-agents': [
    `document.querySelector('.footer__av')?.click();`,
    `document.querySelectorAll('.com__tab')[2]?.click();`,
  ],
  'comunicator-history': [
    `document.querySelector('.footer__av')?.click();`,
    `document.querySelectorAll('.com__tab')[3]?.click();`,
  ],
  settings: [
    `document.querySelector('.footer__av')?.click();`,
    `document.querySelector('.com__icon--set')?.click();`,
  ],
  'settings-prefs': [
    `document.querySelector('.footer__av')?.click();`,
    `document.querySelector('.com__icon--set')?.click();`,
    `document.querySelectorAll('.set__tabs button')[1]?.click();`,
  ],
  states: [`document.querySelector('.footer__status')?.click();`],
  pendientes: [
    `[...document.querySelectorAll('button,[role=tab]')]
       .find((b) => /Pendientes/.test(b.textContent ?? ''))?.click();`,
  ],
  'chat-open': [
    `document.querySelector('.footer__av')?.click();`,
    `document.querySelectorAll('.com__tab')[1]?.click();`,
    `document.querySelector('.msg')?.click();`,
  ],
  'chat-typify': [
    `document.querySelector('.footer__av')?.click();`,
    `document.querySelectorAll('.com__tab')[1]?.click();`,
    `document.querySelector('.msg__typify')?.click();`,
  ],
  /*
   * El desplegable de «Administrativo» cuelga del BOTON '.admin__toggle', no de la fila:
   * clicar la cabecera no hace nada. Lo cazo el podado, que vio que este estado medía
   * exactamente lo mismo que 'states'.
   */
  'states-admin': [
    `document.querySelector('.footer__status')?.click();`,
    `document.querySelector('.admin__toggle')?.click();`,
  ],
  dark: [`document.documentElement.classList.remove('ag-light');`],
};

const REPLICA = process.env['SC_REPLICA_URL'] ?? 'http://127.0.0.1:8792/';

/** Huella compacta del estado: no guarda el volcado, solo lo que permite compararlo. */
async function fingerprint(
  state: string
): Promise<{ hash: string; nodes: number }> {
  const session = await openSession('chromium', 1456, 900);
  await session.page.goto(REPLICA, { waitUntil: 'load' });
  await settle(session.page);
  for (const step of ACTUATIONS[state] as string[]) {
    await session.page.evaluate(step);
    await session.page.waitForTimeout(350);
  }
  if ((ACTUATIONS[state] as string[]).length) {
    await settle(session.page);
  }
  const result = await session.page.evaluate(() => {
    const parts: string[] = [];
    for (const el of [...document.body.querySelectorAll<HTMLElement>('*')]) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) {
        continue;
      }
      const cs = getComputedStyle(el);
      parts.push(
        `${el.tagName}|${
          typeof el.className === 'string' ? el.className : ''
        }|${cs.fontSize}|${cs.fontWeight}|${cs.lineHeight}|${
          cs.letterSpacing
        }|${Math.round(r.x * 100)}|${Math.round(r.y * 100)}|${Math.round(
          r.width * 100
        )}|${Math.round(r.height * 100)}`
      );
    }
    let h = 5381;
    const joined = parts.join('\n');
    for (let i = 0; i < joined.length; i += 1) {
      h = ((h << 5) + h + joined.charCodeAt(i)) | 0;
    }
    return { hash: (h >>> 0).toString(36), nodes: parts.length };
  });
  await session.close();
  return result;
}

const discovered = discover(await originalCss());

const entries: {
  id: string;
  rootSelector: string;
  actuation: string[];
  teardown: string;
  reproducible: boolean;
  changesMeasurements: boolean;
  nodes: number;
  notes: string;
}[] = [];

const base = await fingerprint('default');
let discarded = 0;
let flaky = 0;

/*
 * PODADO. Un estado entra si (1) es reproducible y (2) aporta medidas que ningun estado ya
 * aceptado da. Comparar solo contra 'default' no basta: dos actuaciones distintas pueden
 * acabar en la MISMA pantalla —por ejemplo si el segundo clic no encuentra su elemento— y
 * las dos pasarian el filtro mientras miden lo mismo.
 */
const accepted = new Map<string, string>([['default', base.hash]]);
let duplicates = 0;

for (const id of Object.keys(ACTUATIONS)) {
  const a = await fingerprint(id);
  const b = id === 'default' ? base : await fingerprint(id);
  const reproducible = id === 'default' ? true : a.hash === b.hash;
  const twin =
    id === 'default'
      ? null
      : [...accepted].find(([, h]) => h === a.hash)?.[0] ?? null;
  const changes = id === 'default' ? true : twin === null;
  if (!reproducible) {
    flaky += 1;
  }
  if (!changes) {
    discarded += 1;
    if (twin !== null && twin !== 'default') {
      duplicates += 1;
    }
  }
  if (reproducible && changes) {
    accepted.set(id, a.hash);
  }
  entries.push({
    id,
    rootSelector: id === 'default' ? ':root' : 'app-root',
    actuation: ACTUATIONS[id] as string[],
    // Cada medicion parte de una carga limpia: el desmontaje es recargar.
    teardown: 'recarga completa de la pagina',
    reproducible,
    changesMeasurements: changes,
    nodes: a.nodes,
    notes: !reproducible
      ? 'NO REPRODUCIBLE: dos ejecuciones seguidas dan medidas distintas. No sirve para diffear.'
      : changes
      ? ''
      : twin === 'default'
      ? 'DESCARTADO: no cambia ninguna medida respecto a default.'
      : `DESCARTADO: mide exactamente lo mismo que "${twin ?? '?'}".`,
  });
  console.log(
    `  ${id.padEnd(22)} nodos=${String(a.nodes).padStart(4)} reproducible=${
      reproducible ? 'si' : 'NO'
    } cambia=${changes ? 'si' : 'no'}`
  );
}

const report = {
  phase: 'phase-1_5-states',
  discovery: {
    method:
      'selectores del CSS del original que llevan estado Y tocan una propiedad medida',
    note: 'Los estados de RUTA (secciones del Comunicador) no salen de aqui: no son pseudoclases, son componentes distintos. Estan en la matriz por conocimiento del producto.',
    byState: discovered,
  },
  matrix: entries.filter((e) => e.changesMeasurements && e.reproducible),
  discardedCount: discarded,
  duplicateCount: duplicates,
  flakyCount: flaky,
  all: entries,
};

await mkdir('findings', { recursive: true });
await writeFile(
  'findings/phase-1_5-states.json',
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8'
);

console.log('\ndescubrimiento en el CSS del original:');
for (const [id, v] of Object.entries(discovered)) {
  if (v.rules) {
    console.log(`  ${id.padEnd(16)} ${String(v.rules).padStart(4)} reglas`);
  }
}
console.log(
  `\nmatriz: ${report.matrix.length} estados | descartados: ${discarded} (de ellos ${duplicates} duplicados) | no reproducibles: ${flaky}`
);
