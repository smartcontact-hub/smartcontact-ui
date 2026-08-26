/**
 * OPCION A — traer al repo los MISMOS ficheros de fuente que sirve el original.
 *
 * Lee las caras declaradas en 'findings/phase-0-fonts.json', descarga cada 'src' y
 * COMPRUEBA LOS BYTES MAGICOS antes de guardarlo: el original es un SPA y responde 200
 * con su 'index.html' a cualquier ruta que no exista, asi que el codigo HTTP no dice si
 * el fichero esta ahi. Por eso Open Sans no tiene woff2 aunque su URL devuelva 200.
 *
 * Uso:  node tools/fetch-original-fonts.ts
 * Escribe projects/agent/public/fonts/** y tools/generated-font-face.css
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = 'projects/agent/public/fonts';
const REPORT = 'findings/phase-0-fonts.json';

/** Familias que nos llevamos. Poppins queda fuera: la superficie replicada no la usa. */
const WANTED = /^(Open Sans|Roboto)/;

/** Preferencia de formato; se queda con el primero que sea un fichero de fuente real. */
const FORMAT_ORDER = ['.woff2', '.woff', '.ttf'];

interface Face {
  family: string;
  src: string[];
  weight?: string;
  style?: string;
  display?: string;
}

function magicOf(buf: Buffer): string | null {
  const sig = buf.subarray(0, 4).toString('latin1');
  if (sig === 'wOF2') {
    return 'woff2';
  }
  if (sig === 'wOFF') {
    return 'woff';
  }
  const first = buf.readUInt32BE(0);
  // 0x00010000 = TrueType, 'true' = TrueType Mac, 'OTTO' = CFF.
  if (first === 0x00010000 || sig === 'true' || sig === 'OTTO') {
    return 'truetype';
  }
  return null;
}

const report = JSON.parse(await readFile(REPORT, 'utf8')) as {
  sides: { side: string; declaredFaces: Face[] }[];
};
const original = report.sides.find((s) => s.side === 'original');
if (!original) {
  throw new Error('findings/phase-0-fonts.json no trae el lado original');
}

const faces = original.declaredFaces.filter((f) => WANTED.test(f.family));
const css: string[] = [
  '/* GENERADO por tools/fetch-original-fonts.ts — no editar a mano.',
  ' * Son los MISMOS ficheros y los MISMOS nombres de familia que sirve la app real:',
  " * el original pide el peso por NOMBRE DE FAMILIA ('Open Sans Semibold'), no con",
  ' * font-weight, y sin estas caras la replica cae a un fallback sintetico. */',
  '',
];
let totalBytes = 0;
const kept: string[] = [];
const skipped: string[] = [];

for (const face of faces) {
  // De todos los src declarados, quedarse con el mejor formato que EXISTA de verdad.
  const candidates = face.src
    .filter((u) => FORMAT_ORDER.some((ext) => u.toLowerCase().includes(ext)))
    .sort(
      (a, b) =>
        FORMAT_ORDER.findIndex((e) => a.toLowerCase().includes(e)) -
        FORMAT_ORDER.findIndex((e) => b.toLowerCase().includes(e))
    );

  let saved: { rel: string; format: string; bytes: number } | null = null;
  for (const url of candidates) {
    let buf: Buffer;
    try {
      buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    } catch {
      continue;
    }
    const magic = magicOf(buf);
    if (!magic) {
      // 200 pero no es una fuente: el SPA devolvio su index.html.
      continue;
    }
    const rel = new URL(url).pathname.replace(/^\/assets\/fonts\//, '');
    const dest = path.join(OUT_DIR, rel);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, buf);
    saved = { rel, format: magic, bytes: buf.byteLength };
    break;
  }

  if (!saved) {
    skipped.push(face.family);
    continue;
  }
  totalBytes += saved.bytes;
  kept.push(
    `${face.family} -> ${saved.rel} (${saved.format}, ${saved.bytes} B)`
  );
  css.push(
    '@font-face {',
    `  font-family: '${face.family}';`,
    `  src: url('/fonts/${saved.rel}') format('${saved.format}');`,
    `  font-weight: ${face.weight ?? 'normal'};`,
    `  font-style: ${face.style ?? 'normal'};`,
    `  font-display: ${face.display ?? 'swap'};`,
    '}',
    ''
  );
}

await writeFile('tools/generated-font-face.css', css.join('\n'), 'utf8');
console.log(
  `guardadas ${kept.length} caras, ${(totalBytes / 1024).toFixed(
    0
  )} KB en total`
);
for (const k of kept) {
  console.log(`  ${k}`);
}
if (skipped.length) {
  console.log(`sin fichero real: ${skipped.join(', ')}`);
}
