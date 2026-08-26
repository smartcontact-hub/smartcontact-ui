/**
 * Fuentes de CSS de los dos lados, en un solo sitio.
 *
 * El bundle del original viene SIN minificar y lleva el SCSS de cada componente dentro de
 * los chunks, asi que su CSS entero se puede leer sin pasar por el login. Se cachea en
 * '.cache/' (gitignored) para no machacar su servidor en cada ejecucion.
 */
import { glob, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export const ORIGIN =
  process.env['SC_ORIGINAL_URL'] ??
  'https://comunicatoraeddev.smart-contact.com/sismac/';
const CACHE = '.cache/original-bundle';

export interface CssSource {
  readonly name: string;
  readonly css: string;
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
export function embeddedCss(js: string): string[] {
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

/**
 * Todo el CSS del original: la hoja global mas el CSS incrustado en los chunks,
 * cerrando el grafo — los chunks perezosos de la vista privada solo se alcanzan
 * siguiendo referencias, no desde el index.
 */
export async function originalCss(): Promise<CssSource[]> {
  const out: CssSource[] = [];
  const index = await cached(ORIGIN, 'index.html');

  for (const m of index.matchAll(/href="([^"]+\.css)"/g)) {
    const href = m[1] as string;
    out.push({
      name: href,
      css: await cached(new URL(href, ORIGIN).href, href),
    });
  }

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
    for (const css of embeddedCss(js)) {
      out.push({ name, css });
    }
    for (const im of js.matchAll(/chunk-[A-Z0-9]{8}\.js/g)) {
      if (!seen.has(im[0])) {
        pending.push(im[0]);
      }
    }
  }
  return out;
}

/** CSS de la replica: los bloques `styles:` de cada componente mas las hojas globales. */
export async function replicaCss(
  dirs: readonly string[] = [
    'projects/agent/src/app',
    'projects/agent/src/styles',
  ]
): Promise<CssSource[]> {
  const out: CssSource[] = [];
  for (const dir of dirs) {
    for await (const file of glob(`${dir}/**/*.{ts,scss,css}`)) {
      const src = await readFile(file, 'utf8');
      if (file.endsWith('.ts')) {
        for (const m of src.matchAll(/styles:\s*`([\s\S]*?)`,\n/g)) {
          out.push({ name: file, css: m[1] as string });
        }
      } else {
        out.push({ name: file, css: src });
      }
    }
  }
  return out;
}
