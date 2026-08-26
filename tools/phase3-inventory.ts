/**
 * FASE 3 — CENSO DEL ORIGINAL Y REGISTRO DE CAOS.
 *
 * El bundle del original viene SIN minificar y lleva su SCSS compilado dentro, asi que su
 * tipografia se puede censar ENTERA sin pasar por el login. Esta herramienta:
 *
 *   1. descarga la hoja global y todos los chunks de JS,
 *   2. saca de los chunks el CSS de componente incrustado ('angular:jit:style:...'),
 *   3. lo parsea con css-tree y cuenta cada valor declarado,
 *   4. hace lo mismo con la replica, y cruza.
 *
 * ⚠️ LIMITE, y es importante: esto censa lo DECLARADO, no lo COMPUTADO. En el original hay
 * un '* { font-size: 0.8vw }' global que alcanza a los hijos de texto y GANA sobre la
 * herencia, asi que un 'font-size' declarado en un contenedor puede no llegar a su texto.
 * El censo computado necesita medir la app en vivo, y eso si esta tras el login.
 *
 * Uso:  node tools/phase3-inventory.ts
 * Escribe findings/phase-3-inventory.md y findings/phase-3-chaos-log.md
 */
import { glob, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import * as csstree from 'css-tree';

const ORIGIN =
  process.env['SC_ORIGINAL_URL'] ??
  'https://comunicatoraeddev.smart-contact.com/sismac/';
const CACHE = '.cache/original-bundle';

/** Propiedades que entran en el censo, agrupadas por familia. */
const TYPO = [
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'text-transform',
];
const BOX = ['padding', 'margin', 'gap', 'border-radius', 'width', 'height'];

interface Decl {
  prop: string;
  value: string;
  selector: string;
  source: string;
}

async function cached(url: string, name: string): Promise<string> {
  // El nombre puede traer subdirectorios (assets/js/vendor/...): se aplana.
  const file = path.join(CACHE, name.replace(/[^\w.-]+/g, '_'));
  if (existsSync(file)) {
    return readFile(file, 'utf8');
  }
  const txt = await (await fetch(url)).text();
  await mkdir(CACHE, { recursive: true });
  await writeFile(file, txt, 'utf8');
  return txt;
}

/** Saca los bloques de CSS de componente que Angular deja incrustados en los chunks. */
function embeddedCss(js: string): string[] {
  const out: string[] = [];
  const marker = 'angular:jit:style:';
  let i = js.indexOf(marker);
  while (i !== -1) {
    // Tras el banner viene "var xxx = '...';" con el CSS entre comillas simples.
    const q = js.indexOf("'", i);
    if (q === -1) {
      break;
    }
    let j = q + 1;
    let buf = '';
    while (j < js.length) {
      const c = js[j] as string;
      if (c === '\\') {
        const next = js[j + 1] as string;
        buf += next === 'n' ? '\n' : next;
        j += 2;
        continue;
      }
      if (c === "'") {
        break;
      }
      buf += c;
      j += 1;
    }
    if (buf.length > 40) {
      out.push(buf);
    }
    i = js.indexOf(marker, j);
  }
  return out;
}

function collect(css: string, source: string, into: Decl[]): void {
  let ast: csstree.CssNode;
  try {
    ast = csstree.parse(css, { positions: false, parseValue: false });
  } catch {
    return;
  }
  csstree.walk(ast, {
    visit: 'Declaration',
    enter(node) {
      const prop = node.property.toLowerCase();
      if (!TYPO.includes(prop) && !BOX.includes(prop)) {
        return;
      }
      let selector = '?';
      const rule = (this as unknown as { rule?: csstree.Rule }).rule;
      if (rule?.prelude) {
        selector = csstree.generate(rule.prelude).slice(0, 90);
      }
      into.push({
        prop,
        value: csstree.generate(node.value).trim().replace(/\s+/g, ' '),
        selector,
        source,
      });
    },
  });
}

async function inventory(): Promise<Decl[]> {
  const decls: Decl[] = [];
  const index = await cached(ORIGIN, 'index.html');

  for (const m of index.matchAll(/href="([^"]+\.css)"/g)) {
    const href = m[1] as string;
    const css = await cached(new URL(href, ORIGIN).href, href);
    collect(css, href, decls);
  }
  /*
   * CIERRE TRANSITIVO. El index solo carga el arranque; el resto son chunks perezosos que
   * el navegador solo pide despues del login. Se recorren siguiendo cualquier referencia a
   * 'chunk-XXXX.js' dentro de lo ya descargado, hasta que no aparezcan nuevos: asi el
   * censo alcanza tambien el codigo de la vista privada sin entrar en ella.
   */
  const pending: string[] = [...index.matchAll(/src="([^"]+\.js)"/g)].map(
    (m) => m[1] as string
  );
  const seen = new Set<string>();
  while (pending.length) {
    const name = pending.shift() as string;
    if (seen.has(name)) {
      continue;
    }
    seen.add(name);
    let js: string;
    try {
      js = await cached(new URL(name, ORIGIN).href, name);
    } catch {
      continue;
    }
    for (const c of embeddedCss(js)) {
      collect(c, name, decls);
    }
    for (const im of js.matchAll(/chunk-[A-Z0-9]{8}\.js/g)) {
      const chunk = im[0];
      if (!seen.has(chunk)) {
        pending.push(chunk);
      }
    }
  }
  console.log(`  ficheros recorridos: ${seen.size}`);
  return decls;
}

const decls = await inventory();
const byProp = new Map<string, Map<string, Decl[]>>();
for (const d of decls) {
  const m = byProp.get(d.prop) ?? new Map<string, Decl[]>();
  const list = m.get(d.value) ?? [];
  list.push(d);
  m.set(d.value, list);
  byProp.set(d.prop, m);
}

/** Convierte a px a 1456 si el valor es una longitud reconocible; si no, null. */
function toPx(value: string): number | null {
  const m = /^(-?\d*\.?\d+)(vw|px|rem|em)$/.exec(value.trim());
  if (!m) {
    return null;
  }
  const n = Number(m[1]);
  switch (m[2]) {
    case 'vw':
      return n * 14.56;
    case 'px':
      return n;
    // En el original 1rem = 0.8vw por el '*' global; 1em depende del contexto.
    case 'rem':
      return n * 0.8 * 14.56;
    default:
      return null;
  }
}

// ── inventario ──────────────────────────────────────────────────────────────
const inv: string[] = [
  '# FASE 3 — Censo del original (valores DECLARADOS)',
  '',
  `Generado por \`node tools/phase3-inventory.ts\` desde el bundle sin minificar de`,
  `\`${ORIGIN}\`. **${decls.length} declaraciones** en las propiedades de tipografía y caja.`,
  '',
  '> ⚠️ **Es el censo de lo DECLARADO, no de lo COMPUTADO.** El original lleva un',
  '> `* { font-size: 0.8vw }` global que alcanza a los hijos de texto y gana sobre la',
  '> herencia, así que un `font-size` declarado en un contenedor puede no llegar a su',
  '> texto. El censo computado exige medir la app en vivo, y eso está tras el login.',
  '> Ver `STATUS.md`.',
  '',
  '> Equivalencias en px calculadas a 1456 de ancho (`1vw = 14.56px`, `1rem = 0.8vw`).',
  '',
];

for (const prop of [...TYPO, ...BOX]) {
  const m = byProp.get(prop);
  if (!m) {
    continue;
  }
  const rows = [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  inv.push(
    `## \`${prop}\` — ${rows.length} valores distintos, ${[
      ...m.values(),
    ].reduce((n, l) => n + l.length, 0)} usos`
  );
  inv.push('');
  inv.push('| valor | a 1456 | usos | un selector de ejemplo |');
  inv.push('|---|---|---|---|');
  for (const [value, list] of rows.slice(0, 40)) {
    const px = toPx(value);
    const first = list[0] as Decl;
    inv.push(
      `| \`${value}\` | ${px === null ? '—' : `${px.toFixed(2)}px`} | ${
        list.length
      } | \`${first.selector.replace(/\|/g, '\\|')}\` |`
    );
  }
  if (rows.length > 40) {
    inv.push(`| … | | | **${rows.length - 40} valores más, no listados** |`);
  }
  inv.push('');
}

// ── caos ────────────────────────────────────────────────────────────────────
const chaos: string[] = [
  '# FASE 3 — Registro de caos del original',
  '',
  '**Esto se documenta, NO se arregla.** El modo de fidelidad es CAOS-FIEL: un 17 y un 18',
  'que «deberían» ser lo mismo se quedan en 17 y 18. Este registro existe para que una',
  'decisión futura de normalización tenga datos, no para justificar tocar nada hoy.',
  '',
];

for (const prop of [
  'font-size',
  'line-height',
  'letter-spacing',
  'border-radius',
]) {
  const m = byProp.get(prop);
  if (!m) {
    continue;
  }
  const withPx = [...m.entries()]
    .map(([value, list]) => ({ value, px: toPx(value), n: list.length }))
    .filter((x): x is { value: string; px: number; n: number } => x.px !== null)
    .sort((a, b) => a.px - b.px);

  // Casi-duplicados: valores a menos de 0.5px a 1456 pero declarados distinto.
  const near: string[] = [];
  for (let i = 1; i < withPx.length; i += 1) {
    const a = withPx[i - 1] as { value: string; px: number; n: number };
    const b = withPx[i] as { value: string; px: number; n: number };
    const d = b.px - a.px;
    if (d > 0 && d < 0.5) {
      near.push(
        `| \`${a.value}\` (${a.px.toFixed(2)}px, ×${a.n}) | \`${
          b.value
        }\` (${b.px.toFixed(2)}px, ×${b.n}) | ${d.toFixed(3)}px |`
      );
    }
  }
  const oneOffs = withPx.filter((x) => x.n === 1);

  chaos.push(`## \`${prop}\``);
  chaos.push('');
  chaos.push(
    `${withPx.length} valores distintos con longitud reconocible; **${oneOffs.length} aparecen UNA sola vez**.`
  );
  chaos.push('');
  if (near.length) {
    chaos.push(
      `### Casi-duplicados (menos de 0.5px de diferencia a 1456): ${near.length}`
    );
    chaos.push('');
    chaos.push('| valor A | valor B | diferencia |');
    chaos.push('|---|---|---|');
    chaos.push(...near.slice(0, 25));
    if (near.length > 25) {
      chaos.push(`| … | | **${near.length - 25} pares más** |`);
    }
  } else {
    chaos.push('Sin casi-duplicados por debajo de 0.5px.');
  }
  chaos.push('');
}

// ── cruce con la replica ────────────────────────────────────────────────────
/*
 * Que valores de tipografia declara la replica, y cuales de ellos existen en el original.
 * Se leen los bloques 'styles: `...`' de los componentes y las hojas globales. Igual que
 * arriba, es DECLARADO contra DECLARADO: no sustituye a medir, pero dice de un vistazo si
 * la replica se ha inventado un tamano que el original no usa.
 */
const REPLICA_GLOB = ['projects/agent/src/app', 'projects/agent/src/styles'];
const replicaDecls: Decl[] = [];
for (const dir of REPLICA_GLOB) {
  for await (const file of glob(`${dir}/**/*.{ts,scss,css}`)) {
    const src = await readFile(file, 'utf8');
    if (file.endsWith('.ts')) {
      for (const m of src.matchAll(/styles:\s*`([\s\S]*?)`,\n/g)) {
        collect(m[1] as string, file, replicaDecls);
      }
    } else {
      collect(src, file, replicaDecls);
    }
  }
}

const originalSizes = new Set(
  [...(byProp.get('font-size')?.keys() ?? [])].map((v) => {
    const px = toPx(v);
    return px === null ? v : px.toFixed(2);
  })
);
const replicaSizes = new Map<string, number>();
for (const d of replicaDecls) {
  if (d.prop !== 'font-size') {
    continue;
  }
  replicaSizes.set(d.value, (replicaSizes.get(d.value) ?? 0) + 1);
}

const cross: string[] = [
  '## Cruce con la réplica — `font-size`',
  '',
  `La réplica declara **${replicaSizes.size} tamaños distintos** (${
    replicaDecls.filter((d) => d.prop === 'font-size').length
  } usos).`,
  'Un ✅ significa que ese mismo tamaño existe en el original (comparado a 1456, a dos decimales).',
  '',
  '| réplica | a 1456 | usos | ¿está en el original? |',
  '|---|---|---|---|',
];
let orphans = 0;
for (const [value, n] of [...replicaSizes.entries()].sort(
  (a, b) => b[1] - a[1]
)) {
  const px = toPx(value);
  const key = px === null ? value : px.toFixed(2);
  const hit = originalSizes.has(key);
  if (!hit) {
    orphans += 1;
  }
  cross.push(
    `| \`${value}\` | ${px === null ? '—' : `${px.toFixed(2)}px`} | ${n} | ${
      hit ? '✅' : '❌ no aparece'
    } |`
  );
}
cross.push('');
cross.push(
  orphans === 0
    ? '**Ningún tamaño huérfano**: todo lo que declara la réplica existe en el original.'
    : `**${orphans} tamaños de la réplica no aparecen en el original.** Cada uno es un candidato a delta: o se midió mal, o sale de un cálculo que el original no hace, o es invención. Hay que verificarlos midiendo.`
);
cross.push('');
inv.push(...cross);

await mkdir('findings', { recursive: true });
await writeFile('findings/phase-3-inventory.md', `${inv.join('\n')}\n`, 'utf8');
await writeFile(
  'findings/phase-3-chaos-log.md',
  `${chaos.join('\n')}\n`,
  'utf8'
);
console.log(
  `declaraciones censadas: ${decls.length} (original), ${replicaDecls.length} (replica)`
);
console.log(`tamanos de la replica ausentes del original: ${orphans}`);
for (const prop of [...TYPO, ...BOX]) {
  const m = byProp.get(prop);
  if (m) {
    console.log(
      `  ${prop.padEnd(16)} ${String(m.size).padStart(4)} valores distintos, ${[
        ...m.values(),
      ].reduce((n, l) => n + l.length, 0)} usos`
    );
  }
}
