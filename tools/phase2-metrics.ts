/**
 * FASE 2 — EXTRACCION DE METRICAS.
 *
 * Recorre el DOM y escribe UN NODO POR LINEA en NDJSON. No resume nada: los ficheros se
 * consultan con jq desde bash, nunca se cargan enteros a una conversacion.
 *
 * Uso:
 *   node tools/phase2-metrics.ts --side replica --width 1456 --state comunicator-call
 *   node tools/phase2-metrics.ts --side replica --width 1920 --state default
 *
 * Escribe findings/phase-2-metrics-{side}-{width}-{state}.ndjson. La PRIMERA linea es el
 * manifiesto de la ejecucion; las demas son nodos.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { openSession, settle, scrollbarWidth } from './lib/harness.ts';

interface Args {
  side: string;
  width: number;
  height: number;
  state: string;
  url: string;
}

function parseArgs(): Args {
  const a = process.argv.slice(2);
  const get = (k: string, d?: string): string => {
    const i = a.indexOf(`--${k}`);
    if (i === -1 || !a[i + 1]) {
      if (d === undefined) {
        throw new Error(`falta --${k}`);
      }
      return d;
    }
    return a[i + 1] as string;
  };
  const side = get('side', 'replica');
  const defaultUrl =
    side === 'original'
      ? process.env['SC_ORIGINAL_URL'] ??
        'https://comunicatoraeddev.smart-contact.com/sismac/'
      : process.env['SC_REPLICA_URL'] ?? 'http://127.0.0.1:8792/';
  return {
    side,
    width: Number(get('width', '1456')),
    height: Number(get('height', '900')),
    state: get('state', 'default'),
    url: get('url', defaultUrl),
  };
}

/**
 * ACTUACIONES DE ESTADO — guionizadas e idempotentes.
 *
 * Nada de exploracion libre: un recorrido no reproducible vuelve inservible cualquier
 * diff residual posterior. Cada entrada deja la pagina en un estado concreto partiendo
 * SIEMPRE de una carga limpia.
 */
const STATES: Record<string, string[]> = {
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
};

const args = parseArgs();
const actuation = STATES[args.state];
if (actuation === undefined) {
  throw new Error(
    `estado desconocido: ${args.state} (hay: ${Object.keys(STATES).join(', ')})`
  );
}

const session = await openSession('chromium', args.width, args.height);
await session.page.goto(args.url, { waitUntil: 'load' });
await settle(session.page);
/*
 * Un paso por 'evaluate', con espera entre medias: Angular renderiza la seccion DESPUES
 * del clic, asi que encadenar los clics en un solo script hace que el segundo no
 * encuentre nada y el estado salga identico al anterior sin avisar.
 */
for (const step of actuation) {
  await session.page.evaluate(step);
  await session.page.waitForTimeout(350);
}
if (actuation.length) {
  await settle(session.page);
}

const doc = await session.page.evaluate(() => {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const custom: Record<string, string> = {};
  for (const sheet of [...document.styleSheets]) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of [...rules]) {
      if (!(rule instanceof CSSStyleRule) || rule.selectorText !== ':root') {
        continue;
      }
      for (const prop of [...rule.style]) {
        if (prop.startsWith('--')) {
          custom[prop] = cs.getPropertyValue(prop).trim();
        }
      }
    }
  }
  return {
    rootFontSize: cs.fontSize,
    innerWidth: window.innerWidth,
    clientWidth: root.clientWidth,
    devicePixelRatio: window.devicePixelRatio,
    fonts: [...(document.fonts as unknown as Iterable<FontFace>)].map((f) => ({
      family: f.family,
      weight: f.weight,
      style: f.style,
      status: f.status,
    })),
    customProperties: custom,
  };
});

const nodes = await session.page.evaluate(() => {
  /** Clave ESTRUCTURAL: rol semantico + hash del texto + ordinal en el arbol. */
  const hash = (s: string): string => {
    let h = 5381;
    for (let i = 0; i < s.length; i += 1) {
      h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(36);
  };
  const ordinals = new Map<string, number>();
  const out: Record<string, unknown>[] = [];

  for (const el of [...document.body.querySelectorAll<HTMLElement>('*')]) {
    // Solo nodos con texto RENDERIZADO propio.
    const own = [...el.childNodes]
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent ?? '')
      .join('')
      .trim();
    const r = el.getBoundingClientRect();
    if (!own && r.width === 0 && r.height === 0) {
      continue;
    }
    const cs = getComputedStyle(el);
    const role = el.getAttribute('role') ?? el.tagName.toLowerCase();
    const base = `${role}:${hash(own)}`;
    const n = (ordinals.get(base) ?? 0) + 1;
    ordinals.set(base, n);

    out.push({
      key: `${base}#${n}`,
      tag: el.tagName.toLowerCase(),
      cls: typeof el.className === 'string' ? el.className : '',
      text: own.slice(0, 60),
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      fontStyle: cs.fontStyle,
      fontVariationSettings: cs.fontVariationSettings,
      fontOpticalSizing: cs.fontOpticalSizing,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      wordSpacing: cs.wordSpacing,
      textTransform: cs.textTransform,
      textWrap: cs.getPropertyValue('text-wrap'),
      webkitFontSmoothing: cs.getPropertyValue('-webkit-font-smoothing'),
      textRendering: cs.getPropertyValue('text-rendering'),
      fontFeatureSettings: cs.fontFeatureSettings,
      fontVariantNumeric: cs.fontVariantNumeric,
      color: cs.color,
      margin: `${cs.marginTop} ${cs.marginRight} ${cs.marginBottom} ${cs.marginLeft}`,
      padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
      gap: cs.gap,
      borderWidth: `${cs.borderTopWidth} ${cs.borderRightWidth} ${cs.borderBottomWidth} ${cs.borderLeftWidth}`,
      borderRadius: cs.borderRadius,
      rect: [
        Math.round(r.x * 100) / 100,
        Math.round(r.y * 100) / 100,
        Math.round(r.width * 100) / 100,
        Math.round(r.height * 100) / 100,
      ],
    });
  }
  return out;
});

const sb = await scrollbarWidth(session.page);
await session.close();

const header = {
  kind: 'manifest',
  ...args,
  scrollbarWidth: sb,
  document: doc,
  manifest: session.manifest,
};
const lines = [JSON.stringify(header), ...nodes.map((n) => JSON.stringify(n))];
await mkdir('findings', { recursive: true });
const file = `findings/phase-2-metrics-${args.side}-${args.width}-${args.state}.ndjson`;
await writeFile(file, `${lines.join('\n')}\n`, 'utf8');
console.log(`${file}: ${nodes.length} nodos, scrollbar=${sb}`);
