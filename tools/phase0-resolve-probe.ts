/**
 * FASE 0 (anexo) — SONDA DE RESOLUCION.
 *
 * Declarar una familia no es servirla. Esta sonda pregunta al navegador, sobre la
 * replica ya cargada, que familias de las que el CSS nombra existen de verdad, y cuantos
 * nodos con texto las declaran en primera posicion. Responde a la pregunta del gate:
 * puede la replica reproducir el render del original, si o no.
 *
 * Uso:  node tools/phase0-resolve-probe.ts
 */
import { writeFile } from 'node:fs/promises';
import { openSession, settle } from './lib/harness.ts';

const REPLICA = process.env['SC_REPLICA_URL'] ?? 'http://127.0.0.1:8792/';
const CANDIDATES = [
  'Open Sans',
  'Open Sans Semibold',
  'Open Sans Bold',
  'Open Sans Light',
  'Roboto',
  'Roboto Medium',
  'Inter',
];

const session = await openSession('chromium', 1456, 900);
await session.page.goto(REPLICA, { waitUntil: 'load' });
await settle(session.page);

const result = await session.page.evaluate(async (families: string[]) => {
  /*
   * OJO: 'document.fonts.check()' NO sirve para esto. Devuelve true en cuanto ALGUNA
   * fuente puede pintar esos caracteres, aunque la familia pedida no exista, asi que
   * firma positivos falsos. La prueba real es medir: se pinta la misma cadena con la
   * familia sobre tres bases genericas; si el ancho no cambia respecto a NINGUNA base,
   * la familia no esta resolviendo y el texto lo pinta el fallback.
   */
  /*
   * Antes de medir hay que PEDIR las caras: con 'font-display: swap' el navegador no
   * descarga una familia que ningun elemento usa, y entonces la sonda la daria por
   * ausente aunque este declarada y servida. 'load()' resuelve con la lista vacia si la
   * familia no existe, asi que pedirla no falsea el resultado.
   */
  await Promise.all(
    families.flatMap((f) => [
      document.fonts.load(`400 14px "${f}"`).catch(() => []),
      document.fonts.load(`600 14px "${f}"`).catch(() => []),
    ])
  );
  await document.fonts.ready;

  const BASES = ['monospace', 'serif', 'sans-serif'];
  const SAMPLE = 'mmmmmmmmmmlliWWWWWWWWWW0123456789';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const widthOf = (font: string): number => {
    ctx.font = font;
    return ctx.measureText(SAMPLE).width;
  };
  const isPresent = (family: string, weight: number): boolean =>
    BASES.some(
      (base) =>
        Math.abs(
          widthOf(`${weight} 48px "${family}", ${base}`) -
            widthOf(`${weight} 48px ${base}`)
        ) > 0.5
    );
  const available = Object.fromEntries(
    families.flatMap((f) => [
      [`400 ${f}`, isPresent(f, 400)],
      [`600 ${f}`, isPresent(f, 600)],
    ])
  );

  // Nodos con texto: familia DECLARADA (la primera del stack) contra la RESUELTA.
  const rows: {
    declared: string;
    resolvedStack: string;
    weight: string;
    count: number;
  }[] = [];
  const seen = new Map<
    string,
    { declared: string; resolvedStack: string; weight: string; count: number }
  >();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if (!n.textContent || !n.textContent.trim()) {
      continue;
    }
    const el = n.parentElement;
    if (!el) {
      continue;
    }
    const cs = getComputedStyle(el);
    const stack = cs.fontFamily;
    const declared = stack
      .split(',')[0]
      .trim()
      .replace(/^['"]|['"]$/g, '');
    const key = `${declared}|${cs.fontWeight}`;
    const hit = seen.get(key);
    if (hit) {
      hit.count += 1;
    } else {
      seen.set(key, {
        declared,
        resolvedStack: stack,
        weight: cs.fontWeight,
        count: 1,
      });
    }
  }
  rows.push(...seen.values());
  rows.sort((a, b) => b.count - a.count);
  return { available, rows };
}, CANDIDATES);

const unavailable = result.rows.filter(
  (r) =>
    !result.available[`400 ${r.declared}`] &&
    !result.available[`600 ${r.declared}`]
);

await writeFile(
  'findings/phase-0-resolve-probe.json',
  `${JSON.stringify(
    { manifest: session.manifest, ...result, unavailable },
    null,
    2
  )}\n`,
  'utf8'
);
await session.close();

console.log('familias disponibles en la replica:');
for (const [k, v] of Object.entries(result.available)) {
  console.log(`  ${v ? 'SI' : 'NO'}  ${k}`);
}
console.log('\nfamilias declaradas en primera posicion que NO existen:');
for (const r of unavailable) {
  console.log(
    `  ${r.declared} (weight ${r.weight}) x${r.count} -> cae a: ${r.resolvedStack}`
  );
}
