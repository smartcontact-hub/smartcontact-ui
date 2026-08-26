/**
 * Verificador interno: si la replica es fluida de verdad, cada pieza tiene que medir el
 * MISMO numero de vw a cualquier ancho. No compara contra el original —para eso hace falta
 * sesion—, compara la replica consigo misma, y eso ya caza un lienzo fijo o un zoom.
 *
 * Uso:  node tools/check-vw-constancy.ts [--state comunicator-call]
 */
import { openSession, settle } from './lib/harness.ts';

const WIDTHS = [1280, 1456, 1920];
const REPLICA = process.env['SC_REPLICA_URL'] ?? 'http://127.0.0.1:8792/';
const idx = process.argv.indexOf('--state');
const STATE = idx === -1 ? 'default' : (process.argv[idx + 1] as string);
const ACT: Record<string, string[]> = {
  default: [],
  'comunicator-call': [`document.querySelector('.footer__av')?.click();`],
};

const SELECTORS = [
  '.shell',
  '.kpis',
  '.tablewrap',
  'thead',
  'tbody tr',
  '.footer__status',
  '.footer__av',
  '.sw__b',
  'sc-icon',
  'sc-badge',
];

const byWidth = new Map<number, Record<string, number | null>>();
for (const w of WIDTHS) {
  const s = await openSession('chromium', w, 900);
  await s.page.goto(REPLICA, { waitUntil: 'load' });
  await settle(s.page);
  for (const step of ACT[STATE] ?? []) {
    await s.page.evaluate(step);
    await s.page.waitForTimeout(350);
  }
  byWidth.set(
    w,
    await s.page.evaluate(
      ({ sels, vw }: { sels: string[]; vw: number }) => {
        const out: Record<string, number | null> = {};
        for (const sel of sels) {
          const e = document.querySelector(sel);
          out[sel] = e
            ? Math.round(
                (e.getBoundingClientRect().height / (vw / 100)) * 1000
              ) / 1000
            : null;
        }
        return out;
      },
      { sels: SELECTORS, vw: w }
    )
  );
  await s.close();
}

console.log(`estado: ${STATE}   (alto de cada pieza, en vw)\n`);
console.log(
  `${'selector'.padEnd(18)}${WIDTHS.map((w) => String(w).padStart(10)).join(
    ''
  )}   deriva`
);
let worst = 0;
for (const sel of SELECTORS) {
  const vals = WIDTHS.map((w) => byWidth.get(w)?.[sel] ?? null);
  if (vals.some((v) => v === null)) {
    console.log(
      `${sel.padEnd(18)}${vals
        .map((v) => (v === null ? '—' : String(v)).padStart(10))
        .join('')}   (ausente)`
    );
    continue;
  }
  const nums = vals as number[];
  const drift = Math.max(...nums) - Math.min(...nums);
  worst = Math.max(worst, drift);
  console.log(
    `${sel.padEnd(18)}${nums
      .map((v) => v.toFixed(3).padStart(10))
      .join('')}   ${drift.toFixed(3)}${
      drift > 0.05 ? '  <-- NO constante' : ''
    }`
  );
}
console.log(
  `\nmayor deriva: ${worst.toFixed(3)}vw (= ${(worst * 14.56).toFixed(
    2
  )}px a 1456)`
);
process.exit(worst > 0.05 ? 1 : 0);
