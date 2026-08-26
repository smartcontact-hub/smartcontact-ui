/**
 * VERIFICADOR DE FLUIDEZ — la replica contra si misma, sin sesion.
 *
 * Si algo es fluido de verdad, mide los MISMOS vw en cualquier ventana. Este verificador
 * recorre el DOM entero a varios anchos y saca los nodos cuya medida en vw se mueve. No
 * compara contra el original —para eso hace falta login—, pero caza de un tiron lienzos
 * fijos, zoom, y cualquier px que se quedara sin convertir.
 *
 * ⚠️ EL DISENO DEL EXPERIMENTO IMPORTA. Medir a alto FIJO mezcla dos cosas distintas: lo
 * que esta clavado en px y lo que depende del ALTO de ventana ('100vh', 'flex: 1'). Un
 * elemento en vh cambia de ratio en vw simplemente porque cambia el ancho, y saldria como
 * falso positivo. Por eso se mide DOS VECES:
 *
 *   · a alto FIJO      -> se mueven los fijos Y los que dependen del alto;
 *   · a RATIO CONSTANTE -> solo se mueven los fijos de verdad.
 *
 * La interseccion es la respuesta. Lo demas es geometria, no un defecto.
 *
 * Uso:  node tools/check-vw-constancy.ts [--state <id>] [--tolerance 0.02]
 */
import { openSession, settle } from './lib/harness.ts';

const WIDTHS = [1280, 1456, 1920];
const FIXED_HEIGHT = 900;
/** Mismo ratio que 1456x900, para que lo que va en vh no salga como falso positivo. */
const RATIO = FIXED_HEIGHT / 1456;

const REPLICA = process.env['SC_REPLICA_URL'] ?? 'http://127.0.0.1:8792/';

const ACT: Record<string, string[]> = {
  default: [],
  'comunicator-call': [`document.querySelector('.footer__av')?.click();`],
  'comunicator-chat': [
    `document.querySelector('.footer__av')?.click();`,
    `document.querySelectorAll('.com__tab')[1]?.click();`,
  ],
  settings: [
    `document.querySelector('.footer__av')?.click();`,
    `document.querySelector('.com__icon--set')?.click();`,
  ],
  pendientes: [
    `[...document.querySelectorAll('button,[role=tab]')]
       .find((b) => /Pendientes/.test(b.textContent ?? ''))?.click();`,
  ],
};

const args = process.argv.slice(2);
const argOf = (k: string, d: string): string => {
  const i = args.indexOf(`--${k}`);
  return i === -1 || !args[i + 1] ? d : (args[i + 1] as string);
};
const STATES = argOf('state', '') ? [argOf('state', '')] : Object.keys(ACT);
/** En vw. 0.02vw son 0.29px a 1456: justo por debajo del umbral de ruido del encargo. */
const TOLERANCE = Number(argOf('tolerance', '0.02'));

type Sample = Map<string, number>;

async function sample(state: string, width: number, height: number): Promise<Sample> {
  const s = await openSession('chromium', width, height);
  await s.page.goto(REPLICA, { waitUntil: 'load' });
  await settle(s.page);
  for (const step of ACT[state] ?? []) {
    await s.page.evaluate(step);
    await s.page.waitForTimeout(350);
  }
  if ((ACT[state] ?? []).length) {
    await settle(s.page);
  }
  const rows = await s.page.evaluate((vw: number) => {
    const out: [string, number][] = [];
    const seen = new Map<string, number>();
    for (const el of [...document.body.querySelectorAll<HTMLElement>('*')]) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) {
        continue;
      }
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : '';
      const base = `${el.tagName.toLowerCase()}.${cls || '-'}`;
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      out.push([`${base}#${n}`, Math.round((r.height / (vw / 100)) * 10000) / 10000]);
    }
    return out;
  }, width);
  await s.close();
  return new Map(rows);
}

function drift(samples: Sample[]): Map<string, number> {
  const out = new Map<string, number>();
  const [first] = samples;
  if (!first) {
    return out;
  }
  for (const key of first.keys()) {
    const vals = samples.map((s) => s.get(key));
    if (vals.some((v) => v === undefined)) {
      continue; // el nodo no existe a todos los anchos: no es comparable
    }
    const nums = vals as number[];
    out.set(key, Math.max(...nums) - Math.min(...nums));
  }
  return out;
}

let worstOverall = 0;
const offenders: { state: string; key: string; fixed: number; ratio: number }[] = [];

for (const state of STATES) {
  const atFixed = drift(await Promise.all(WIDTHS.map((w) => sample(state, w, FIXED_HEIGHT))));
  const atRatio = drift(
    await Promise.all(WIDTHS.map((w) => sample(state, w, Math.round(w * RATIO)))),
  );

  const bad: { key: string; fixed: number; ratio: number }[] = [];
  for (const [key, r] of atRatio) {
    // Solo cuenta si se mueve TAMBIEN a ratio constante: ahi lo que va en vh ya no enganna.
    if (r > TOLERANCE) {
      bad.push({ key, fixed: atFixed.get(key) ?? Number.NaN, ratio: r });
    }
  }
  bad.sort((a, b) => b.ratio - a.ratio);
  const worst = bad[0]?.ratio ?? 0;
  worstOverall = Math.max(worstOverall, worst);
  offenders.push(...bad.map((b) => ({ state, ...b })));

  console.log(
    `${state.padEnd(20)} nodos=${String(atRatio.size).padStart(4)}  no constantes=${String(bad.length).padStart(3)}  peor=${worst.toFixed(4)}vw`,
  );
  for (const b of bad.slice(0, 8)) {
    console.log(
      `    ${b.key.padEnd(34)} ratio=${b.ratio.toFixed(4)}vw (${(b.ratio * 14.56).toFixed(2)}px a 1456)   altoFijo=${b.fixed.toFixed(4)}`,
    );
  }
}

console.log(
  `\npeor deriva a ratio constante: ${worstOverall.toFixed(4)}vw = ${(worstOverall * 14.56).toFixed(2)}px a 1456`,
);
console.log(`nodos no constantes en total: ${offenders.length}`);
process.exit(worstOverall > TOLERANCE ? 1 : 0);
