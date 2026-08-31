/**
 * Diff de dos volcados NDJSON de la Fase 2, casando por CLAVE ESTRUCTURAL.
 *
 * Se niega a comparar artefactos con manifiestos distintos: dos volcados hechos con otro
 * navegador, otro arnes o otro DPR no son comparables, y compararlos igual produce
 * deltas que no significan nada.
 *
 * Tolerancias del encargo: >1px BLOQUEANTE, 0.25-1px MENOR, <0.25px RUIDO.
 *
 * Uso:  node tools/compare-ndjson.ts <a.ndjson> <b.ndjson> [--scale 1.318]
 *
 * '--scale' compara a ANCHOS DISTINTOS: multiplica la geometria de 'a' por el factor
 * antes de restar, que es como se comprueba que algo escala de verdad y no esta fijo.
 */
import { readFile } from 'node:fs/promises';
import { manifestDrift, type RunManifest } from './lib/manifest.ts';

interface Node {
  key: string;
  cls: string;
  text: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  rect: [number, number, number, number];
}

const GEOMETRIC = ['fontSize', 'lineHeight', 'letterSpacing'] as const;

async function load(file: string): Promise<{
  header: { manifest?: RunManifest; width?: number; innerWidth?: number };
  nodes: Map<string, Node>;
}> {
  const lines = (await readFile(file, 'utf8')).trim().split('\n');
  const header = JSON.parse(lines[0] as string) as {
    manifest?: RunManifest;
    width?: number;
    innerWidth?: number;
  };
  const nodes = new Map<string, Node>();
  for (const line of lines.slice(1)) {
    const n = JSON.parse(line) as Node;
    nodes.set(n.key, n);
  }
  return { header, nodes };
}

const [fileA, fileB] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!fileA || !fileB) {
  throw new Error(
    'uso: node tools/compare-ndjson.ts <a.ndjson> <b.ndjson> [--scale N]'
  );
}
const scaleArg = process.argv.indexOf('--scale');
const scale = scaleArg === -1 ? 1 : Number(process.argv[scaleArg + 1]);

const a = await load(fileA);
const b = await load(fileB);

/*
 * Un lado puede ser un VOLCADO DE CONSOLA (el snippet del censo del original en el
 * navegador real), que NO lleva `harness` porque no corre en el arnés de Playwright. Ahí
 * el guard estricto no aplica: las medidas son px CSS, comparables entre navegadores AL
 * MISMO ANCHO. Se avisa de la limitación y se sigue; el único invariante duro es el ancho,
 * porque el producto escala con el viewport (un `12px` fijo y un `0.8vw` coinciden a 1456
 * y divergen en el resto — eso un censo a un solo ancho NO lo distingue).
 */
const widthOf = (h: typeof a.header): number | undefined => h.width ?? h.innerWidth;
const isConsoleDump = (h: typeof a.header): boolean => !h.manifest?.harness;
if (isConsoleDump(a.header) || isConsoleDump(b.header)) {
  const wa = widthOf(a.header);
  const wb = widthOf(b.header);
  if (wa != null && wb != null && wa !== wb && scale === 1) {
    console.error(
      `ANCHOS DISTINTOS (${wa} vs ${wb}) y el producto escala con el viewport: ` +
        `mide ambos lados al MISMO ancho, o pasa \`--scale ${wa}/${wb}\`.`
    );
    process.exit(2);
  }
  console.error('⚠ Comparación cross-arnés (un lado es volcado de consola del navegador real).');
  console.error('  Guard de manifiesto relajado: se comparan px CSS al mismo ancho.');
  console.error('  OJO: a UN solo ancho no se distingue px/vw/rem que coincidan a ese ancho;');
  console.error('  para eso hace falta el control de dos anchos (razón medidas == razón anchos).');
} else {
  const drift = manifestDrift(a.header.manifest as RunManifest, b.header.manifest as RunManifest);
  if (drift.length) {
    console.error('MANIFIESTOS DISTINTOS — estos artefactos no son comparables:');
    for (const d of drift) {
      console.error(`  ${d}`);
    }
    process.exit(2);
  }
}

const px = (v: string): number => Number.parseFloat(v);
type Row = { key: string; prop: string; a: string; b: string; delta: number };
const blocking: Row[] = [];
const minor: Row[] = [];
let noise = 0;
const onlyA: string[] = [];
const onlyB: string[] = [];
const familyMismatch: Row[] = [];

for (const [key, na] of a.nodes) {
  const nb = b.nodes.get(key);
  if (!nb) {
    onlyA.push(`${key} ${na.cls.slice(0, 40)}`);
    continue;
  }

  // Familia y peso: cualquier diferencia es BLOQUEANTE, sin tolerancia. Se compara la
  // familia PRIMARIA (la primera del stack, la que de verdad pinta): un lado puede declarar
  // solo `Open Sans` y el otro `Open Sans, Helvetica Neue, Arial` — misma fuente renderizada,
  // distinta cadena; eso no es un swap de fuente y no debe salir como bloqueante.
  const primaryFamily = (ff: string): string =>
    (ff.split(',')[0] ?? '').trim().replace(/^["']|["']$/g, '').toLowerCase();
  if (primaryFamily(na.fontFamily) !== primaryFamily(nb.fontFamily) || na.fontWeight !== nb.fontWeight) {
    familyMismatch.push({
      key,
      prop: 'fontFamily/Weight',
      a: `${na.fontFamily} ${na.fontWeight}`,
      b: `${nb.fontFamily} ${nb.fontWeight}`,
      delta: Number.NaN,
    });
  }

  const push = (prop: string, va: number, vb: number): void => {
    if (!Number.isFinite(va) || !Number.isFinite(vb)) {
      return;
    }
    const delta = Math.abs(va * scale - vb);
    if (delta > 1) {
      blocking.push({ key, prop, a: String(va), b: String(vb), delta });
    } else if (delta >= 0.25) {
      minor.push({ key, prop, a: String(va), b: String(vb), delta });
    } else {
      noise += 1;
    }
  };

  for (const prop of GEOMETRIC) {
    push(prop, px(na[prop]), px(nb[prop]));
  }
  for (const [i, label] of ['x', 'y', 'w', 'h'].entries()) {
    push(`rect.${label}`, na.rect[i] as number, nb.rect[i] as number);
  }
}
for (const key of b.nodes.keys()) {
  if (!a.nodes.has(key)) {
    onlyB.push(key);
  }
}

const fmt = (rows: Row[]): string =>
  rows
    .sort((x, y) => y.delta - x.delta)
    .slice(0, 40)
    .map(
      (r) =>
        `  ${r.delta.toFixed(2).padStart(7)}  ${r.prop.padEnd(16)} ${r.a} -> ${
          r.b
        }  ${r.key}`
    )
    .join('\n');

console.log(
  `${fileA}\n  vs\n${fileB}${scale !== 1 ? `   (escala x${scale})` : ''}\n`
);
console.log(
  `nodos casados: ${a.nodes.size - onlyA.length} | solo en A: ${
    onlyA.length
  } | solo en B: ${onlyB.length}`
);
console.log(
  `BLOQUEANTE (>1px): ${blocking.length} | MENOR (0.25-1px): ${minor.length} | ruido: ${noise}`
);
if (familyMismatch.length) {
  console.log(`\nFAMILIA/PESO distintos: ${familyMismatch.length}`);
  console.log(fmt(familyMismatch));
}
if (blocking.length) {
  console.log('\n-- BLOQUEANTE --');
  console.log(fmt(blocking));
}
if (minor.length) {
  console.log('\n-- MENOR --');
  console.log(fmt(minor));
}
if (onlyA.length) {
  console.log(
    `\n-- solo en A (${onlyA.length}) --\n  ${onlyA.slice(0, 15).join('\n  ')}`
  );
}

process.exit(blocking.length || familyMismatch.length ? 1 : 0);
