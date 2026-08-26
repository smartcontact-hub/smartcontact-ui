/**
 * FASE 0 — FORENSE DE FUENTES  [GLOBAL] [GATE DURO]
 *
 * Carga cada lado con interceptacion de red, apunta TODO fichero de fuente pedido de
 * verdad, lo descarga y lo abre con fontkit. Ademas parsea las hojas de estilo con
 * css-tree para sacar los descriptores de cada @font-face (font-display, unicode-range,
 * size-adjust y los override de metricas).
 *
 * Uso:  node tools/phase0-fonts.ts
 *
 * Escribe findings/phase-0-fonts.json. El veredicto se redacta a mano en
 * findings/phase-0-verdict.md a partir de ese JSON.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import * as fontkit from 'fontkit';
import * as csstree from 'css-tree';
import { openSession, settle, scrollbarWidth } from './lib/harness.ts';

interface FaceDescriptor {
  readonly family: string;
  readonly src: readonly string[];
  readonly weight?: string;
  readonly style?: string;
  readonly display?: string;
  readonly unicodeRange?: string;
  readonly sizeAdjust?: string;
  readonly ascentOverride?: string;
  readonly descentOverride?: string;
  readonly lineGapOverride?: string;
}

interface FontFileReport {
  readonly url: string;
  readonly bytes: number;
  readonly ok: boolean;
  readonly error?: string;
  readonly postscriptName?: string;
  readonly familyName?: string;
  readonly subfamilyName?: string;
  readonly variable?: boolean;
  readonly axes?: Record<string, { min: number; default: number; max: number }>;
  readonly namedInstances?: readonly string[];
  readonly unitsPerEm?: number;
  readonly typoAscender?: number;
  readonly typoDescender?: number;
  readonly typoLineGap?: number;
  readonly winAscent?: number;
  readonly winDescent?: number;
  readonly hheaAscender?: number;
  readonly hheaDescender?: number;
  readonly hheaLineGap?: number;
  readonly capHeight?: number;
  readonly xHeight?: number;
  readonly useTypoMetrics?: boolean;
  /** false = declarado en un @font-face pero no pedido por la vista medida. */
  readonly requestedByPage?: boolean;
}

interface SideReport {
  readonly side: string;
  readonly url: string;
  readonly reachable: boolean;
  readonly note?: string;
  readonly scrollbarWidth?: number;
  readonly hosting: readonly string[];
  readonly declaredFaces: readonly FaceDescriptor[];
  readonly requestedFonts: readonly FontFileReport[];
  readonly documentFonts: readonly {
    family: string;
    weight: string;
    style: string;
    status: string;
  }[];
}

const DESCRIPTOR_KEYS: Record<string, keyof FaceDescriptor> = {
  'font-weight': 'weight',
  'font-style': 'style',
  'font-display': 'display',
  'unicode-range': 'unicodeRange',
  'size-adjust': 'sizeAdjust',
  'ascent-override': 'ascentOverride',
  'descent-override': 'descentOverride',
  'line-gap-override': 'lineGapOverride',
};

function parseFaces(css: string, baseUrl: string): FaceDescriptor[] {
  const out: FaceDescriptor[] = [];
  let ast: csstree.CssNode;
  try {
    ast = csstree.parse(css, { positions: false });
  } catch {
    return out;
  }
  csstree.walk(ast, {
    visit: 'Atrule',
    enter(node) {
      if (node.name !== 'font-face' || !node.block) {
        return;
      }
      const face: Record<string, unknown> = { src: [] as string[] };
      csstree.walk(node.block, {
        visit: 'Declaration',
        enter(decl) {
          const value = csstree.generate(decl.value).trim();
          if (decl.property === 'font-family') {
            face['family'] = value.replace(/^['"]|['"]$/g, '');
            return;
          }
          if (decl.property === 'src') {
            const urls: string[] = [];
            csstree.walk(decl.value, {
              visit: 'Url',
              enter(u) {
                try {
                  urls.push(new URL(u.value, baseUrl).href);
                } catch {
                  urls.push(u.value);
                }
              },
            });
            face['src'] = urls;
            return;
          }
          const key = DESCRIPTOR_KEYS[decl.property];
          if (key) {
            face[key] = value;
          }
        },
      });
      if (face['family']) {
        out.push(face as unknown as FaceDescriptor);
      }
    },
  });
  return out;
}

function classifyHost(url: string): string {
  const h = new URL(url).hostname;
  if (h.endsWith('fonts.gstatic.com') || h.endsWith('fonts.googleapis.com')) {
    return 'Google Fonts';
  }
  if (h.endsWith('use.typekit.net') || h.endsWith('typekit.com')) {
    return 'Adobe Fonts';
  }
  return `self-hosted (${h})`;
}

/** Lectura defensiva: las tablas que expone fontkit varian entre versiones y formatos. */
function num(
  src: Record<string, unknown> | undefined,
  key: string
): number | undefined {
  const v = src?.[key];
  return typeof v === 'number' ? v : undefined;
}

function readFont(url: string, buf: Buffer): FontFileReport {
  try {
    const f = fontkit.create(buf) as unknown as Record<string, unknown>;
    const os2 = (f['OS/2'] ?? {}) as Record<string, unknown>;
    const hhea = (f['hhea'] ?? {}) as Record<string, unknown>;
    const axes = (f['variationAxes'] ?? {}) as Record<
      string,
      { min: number; default: number; max: number }
    >;
    const variable = Object.keys(axes).length > 0;

    // fontkit v2 puede dar fsSelection como numero o ya desglosado en banderas.
    const selection = os2['fsSelection'];
    const useTypo =
      typeof selection === 'number'
        ? (selection & 0x80) !== 0
        : selection && typeof selection === 'object'
        ? Boolean((selection as Record<string, unknown>)['useTypoMetrics'])
        : undefined;

    const str = (key: string): string | undefined =>
      typeof f[key] === 'string' ? (f[key] as string) : undefined;

    return {
      url,
      bytes: buf.byteLength,
      ok: true,
      postscriptName: str('postscriptName'),
      familyName: str('familyName'),
      subfamilyName: str('subfamilyName'),
      variable,
      axes: variable ? axes : undefined,
      namedInstances: variable
        ? Object.keys((f['namedVariations'] ?? {}) as Record<string, unknown>)
        : undefined,
      unitsPerEm: num(f, 'unitsPerEm'),
      typoAscender: num(os2, 'typoAscender'),
      typoDescender: num(os2, 'typoDescender'),
      typoLineGap: num(os2, 'typoLineGap'),
      winAscent: num(os2, 'winAscent'),
      winDescent: num(os2, 'winDescent'),
      hheaAscender: num(hhea, 'ascent'),
      hheaDescender: num(hhea, 'descent'),
      hheaLineGap: num(hhea, 'lineGap'),
      capHeight: num(f, 'capHeight'),
      xHeight: num(f, 'xHeight'),
      // Bit 7 de fsSelection: si esta puesto, el navegador usa las metricas typo.
      useTypoMetrics: useTypo,
    };
  } catch (e) {
    return {
      url,
      bytes: buf.byteLength,
      ok: false,
      error: (e as Error).message,
    };
  }
}

async function inspect(side: string, url: string): Promise<SideReport> {
  const session = await openSession('chromium', 1440, 900);
  const { page } = session;
  const fontUrls = new Set<string>();
  const cssUrls = new Set<string>();

  page.on('response', (res) => {
    const u = res.url();
    const type = res.headers()['content-type'] ?? '';
    if (/\.(woff2?|ttf|otf|eot)(\?|$)/i.test(u) || /font/i.test(type)) {
      fontUrls.add(u);
    }
    if (/\.css(\?|$)/i.test(u) || type.includes('text/css')) {
      cssUrls.add(u);
    }
  });

  let reachable = true;
  let note: string | undefined;
  try {
    const res = await page.goto(url, { waitUntil: 'load', timeout: 45_000 });
    if (!res || !res.ok()) {
      reachable = false;
      note = `HTTP ${res ? res.status() : 'sin respuesta'}`;
    }
    await settle(page);
  } catch (e) {
    reachable = false;
    note = (e as Error).message;
  }

  // Hojas de estilo: las que vinieron por red mas las incrustadas en el documento.
  const inlineCss = await page
    .evaluate(() =>
      [...document.querySelectorAll('style')]
        .map((s) => s.textContent ?? '')
        .join('\n')
    )
    .catch(() => '');

  const declaredFaces: FaceDescriptor[] = parseFaces(inlineCss, url);
  for (const href of cssUrls) {
    try {
      const txt = await (await fetch(href)).text();
      declaredFaces.push(...parseFaces(txt, href));
    } catch {
      /* la hoja no es legible fuera del navegador; queda anotada por ausencia */
    }
  }

  /*
   * Se abren DOS conjuntos: los ficheros que la pagina pidio de verdad y, ademas, todo
   * src declarado en un @font-face. La vista publica no ejercita todos los pesos, asi
   * que sin el segundo conjunto el veredicto variable-vs-estatico saldria incompleto.
   */
  const declaredSrc = new Set(
    declaredFaces
      .flatMap((f) => f.src)
      .filter((u) => /\.(woff2?|ttf|otf)(\?|$)/i.test(u))
  );
  const requested: FontFileReport[] = [];
  for (const f of new Set([...fontUrls, ...declaredSrc])) {
    const wasRequested = fontUrls.has(f);
    try {
      const buf = Buffer.from(await (await fetch(f)).arrayBuffer());
      requested.push({
        ...readFont(f, buf),
        requestedByPage: wasRequested,
      } as FontFileReport);
    } catch (e) {
      requested.push({
        url: f,
        bytes: 0,
        ok: false,
        error: (e as Error).message,
        requestedByPage: wasRequested,
      } as FontFileReport);
    }
  }

  const documentFonts = await page
    .evaluate(() =>
      [...(document.fonts as unknown as Iterable<FontFace>)].map((f) => ({
        family: f.family,
        weight: f.weight,
        style: f.style,
        status: f.status,
      }))
    )
    .catch(() => []);

  const sb = reachable
    ? await scrollbarWidth(page).catch(() => undefined)
    : undefined;
  const manifest = session.manifest;
  await session.close();

  return {
    side,
    url,
    reachable,
    note,
    scrollbarWidth: sb,
    hosting: [...new Set([...fontUrls].map(classifyHost))],
    declaredFaces,
    requestedFonts: requested,
    documentFonts,
    // el manifiesto viaja con el artefacto
    ...({ manifest } as object),
  } as SideReport;
}

const ORIGINAL =
  process.env['SC_ORIGINAL_URL'] ??
  'https://comunicatoraeddev.smart-contact.com/sismac/';
const REPLICA = process.env['SC_REPLICA_URL'] ?? 'http://127.0.0.1:8792/';

const report = {
  phase: 'phase-0-fonts',
  generatedAt: new Date().toISOString(),
  sides: [
    await inspect('original', ORIGINAL),
    await inspect('replica', REPLICA),
  ],
};

await mkdir('findings', { recursive: true });
await writeFile(
  'findings/phase-0-fonts.json',
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8'
);
console.log('escrito findings/phase-0-fonts.json');
for (const s of report.sides) {
  console.log(
    `${s.side}: reachable=${s.reachable} faces=${
      s.declaredFaces.length
    } files=${s.requestedFonts.length} scrollbar=${s.scrollbarWidth} hosting=${
      s.hosting.join(', ') || '-'
    }${s.note ? ` note=${s.note}` : ''}`
  );
}
