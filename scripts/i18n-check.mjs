#!/usr/bin/env node
/**
 * i18n:check — que la app SEA multiidioma de verdad, no solo que los ficheros cuadren.
 *
 * Nació midiendo solo COBERTURA (paridad de claves entre locales). Esa red tiene un agujero
 * de nacimiento: solo compara los locales ENTRE SÍ, así que un fallo presente en los cuatro a
 * la vez pasa en verde. El 2026-09-09 se midieron tres colándose por ahí: una clave usada en
 * una plantilla que no existía en ningún locale (`labels.bulk_actions`, se anunciaba cruda por
 * lector de pantalla), 23 textos en español escritos a pelo en atributos (`aria-label`,
 * `placeholder`, `title`) que ningún idioma traducía, y 4 fechas clavadas a `'es-ES'` que
 * seguían en formato español con la UI en francés.
 *
 * Checks (todos deterministas; cada uno nació de un fallo REAL medido, no de un catálogo):
 *   A. Paridad de claves: cada locale 1:1 con su referencia (ni sin traducir ni huérfanas).
 *   B. Toda clave que el código pide con `| translate` o `translate.instant(...)` EXISTE en la
 *      referencia. Sin esto, la UI pinta el dot-path crudo.
 *   C. Las variables `{{x}}` de la referencia llegan intactas a cada locale. Una que se pierde
 *      al traducir deja un hueco ("Abrir conversación " sin id).
 *   D. Ningún valor vacío: una clave en blanco es peor que la clave cruda, no se ve.
 *   E. La misma frase de la referencia no puede tener DOS traducciones distintas en el mismo
 *      locale (medido: "usuario" era `utilizador` en un sitio y `usuário` en otro, mezclando
 *      portugués de Portugal y de Brasil). Las divergencias legítimas van en EXCEPCIONES, con
 *      su motivo: es el único sitio donde esta decisión queda escrita.
 *   F. Copy a pelo en las plantillas del Supervisor: atributos visibles (`aria-label`,
 *      `placeholder`, `title`, `alt`) con texto literal en vez de una clave.
 *   G. Formato de fecha/número clavado a un idioma (`toLocale*('es-ES')`). El idioma activo lo
 *      sirve `LanguageService.locale()`.
 *
 * Lo que a propósito NO se comprueba, porque se midió y era ruido:
 *   · "traducción idéntica al español" → los 15 casos de en y los 15 de fr eran marca o tecnicismos
 *     ("Contact Center", "VUI Designer", "sentiment_score < -0.7"); en pt, 63 de 63 legítimos.
 *   · literales en español dentro de `.ts` → 377 casos, casi todos catálogos de demo
 *     (`repositories/instances/*`); la señal útil se ahoga.
 *   · longitud de la traducción (el francés se alarga y parte botones) → eso lo ve el ojo o una
 *     baseline visual, no una regla de copy.
 *
 * Localizados: el Supervisor (es/en/fr/pt) y sc-docs (es/en; solo el chrome y las páginas clave).
 * agent/cuscare no consumen i18n. Si otra app añade `assets/i18n/`, amplía APPS.
 *
 * Nota: sc-docs sirve estáticos desde `public/` (no `src/assets`), así que sus locales viven
 * en `projects/sc-docs/public/assets/i18n`, servidos en `/assets/i18n/*.json`.
 *
 * Uso: `node scripts/i18n-check.mjs` (en la cadena `verify`).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Apps localizadas: dir de locales + referencia canónica + idiomas objetivo + código que las usa.
const APPS = [
  {
    name: 'supervisor',
    dir: 'projects/supervisor/src/assets/i18n',
    reference: 'es',
    targets: ['en', 'fr', 'pt'],
    code: 'projects/supervisor/src', // habilita B, F y G
  },
  {
    name: 'sc-docs',
    dir: 'projects/sc-docs/public/assets/i18n',
    reference: 'es',
    targets: ['en'],
    // sin `code`: sc-docs está localizado a medias a propósito (chrome + páginas clave), así que
    // exigirle "toda clave existe" y "cero copy a pelo" sería mentira, no calidad.
  },
];

/**
 * Divergencias LEGÍTIMAS del check E: misma frase en español, dos traducciones correctas.
 * Casi siempre concordancia de género con el sustantivo que acompañan (en español el sustantivo
 * no aparece en la cadena, en francés y portugués sí manda). Añadir una entrada aquí es la
 * decisión, y el motivo es la documentación: si no sabes escribir el motivo, es un fallo.
 */
const EXCEPCIONES_DIVERGENCIA = [
  {
    locales: ['fr', 'pt'],
    frases: ['seleccionada', 'seleccionadas', '1 asignada', '{{count}} asignadas'],
    motivo: 'concordancia de género: en es el sustantivo va fuera de la cadena (plantilla/agenda), en fr/pt no',
  },
  {
    locales: ['fr'],
    frases: ['Pausar'],
    motivo: 'botón del reproductor ("Pause", término de audio) vs acción masiva ("Mettre en pause")',
  },
];

const SEP = '─'.repeat(60);
const load = (dir, l) => JSON.parse(readFileSync(resolve(root, dir, `${l}.json`), 'utf8'));

/** Aplana a claves dot-path (las hojas string/number, no los objetos intermedios). */
export const flat = (o, p = '', a = {}) => {
  for (const [k, v] of Object.entries(o)) {
    const kp = p ? `${p}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, kp, a);
    else a[kp] = v;
  }
  return a;
};

/** Ficheros del árbol con una de las extensiones dadas. */
const walk = (dir, exts, out = []) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, exts, out);
    else if (exts.some((x) => e.endsWith(x))) out.push(p);
  }
  return out;
};

/** Variables `{{x}}` de una cadena, normalizadas y ordenadas. */
export const vars = (s) =>
  [...String(s).matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)]
    .map((m) => m[1])
    .sort()
    .join(',');

// Atributos que el usuario LEE (a ojo o por lector de pantalla): su texto debe salir de i18n.
export const ATTR = '(?:attr\\.)?(?:aria-label|ariaLabel|aria-description|placeholder|title|alt)';
const ES_QUOTED = /'([^']*)'/g;
// Clave entera (`memory.rules.title`) o prefijo que el código concatena (`'agents.channel.' + x`).
const KEY_LIKE = /^[\w-]+(?:\.[\w-]+)+$|^[\w-]+(?:\.[\w-]+)*\.$/;
// Operandos de comparación (`trend === 'up'`): son lógica, no texto que lea nadie.
const COMPARACION = /[=!]==?\s*'[^']*'/g;


/** Claves que un fuente (plantilla o .ts) pide a i18n de forma literal. */
export function clavesPedidas(src) {
  const out = new Set();
  for (const m of src.matchAll(/['"`]([\w-]+(?:\.[\w-]+)+)['"`]\s*\|\s*translate/g)) out.add(m[1]);
  for (const m of src.matchAll(
    /\btranslate\.(?:instant|get|stream)\(\s*['"`]([\w-]+(?:\.[\w-]+)+)['"`]\s*[,)]/g,
  ))
    out.add(m[1]);
  return out;
}

/** Atributos visibles de una plantilla con texto escrito a pelo en vez de una clave. */
export function copyAPelo(html) {
  const src = html.replace(/<!--[\s\S]*?-->/g, '');
  const out = [];
  for (const m of src.matchAll(new RegExp(`\\s${ATTR}="([^"{}]*[A-Za-zÁ-ú][^"{}]*)"`, 'g')))
    out.push(m[0].trim());
  for (const m of src.matchAll(new RegExp(`\\[${ATTR}\\]="([^"]*)"`, 'g'))) {
    const lits = [...m[1].replace(COMPARACION, '').matchAll(ES_QUOTED)].map((x) => x[1]);
    const copy = lits.filter((l) => /[A-Za-zÁ-ú]/.test(l) && !KEY_LIKE.test(l));
    if (copy.length) out.push(copy.map((c) => `'${c}'`).join(' '));
  }
  return out;
}

/** Formatos de fecha/número clavados a un idioma concreto. */
export function localesClavados(ts) {
  return [...ts.matchAll(/toLocale\w*\(\s*['"]([a-z]{2}-[A-Z]{2})['"]/g)].map((m) => m[1]);
}

/** Frases de la referencia que un locale traduce de dos maneras distintas. */
export function divergencias(ref, target, locale, excepciones = EXCEPCIONES_DIVERGENCIA) {
  const porFrase = new Map();
  for (const k of Object.keys(ref)) {
    const frase = String(ref[k]).trim();
    if (frase.length < 3 || !(k in target)) continue;
    if (excepciones.some((e) => e.locales.includes(locale) && e.frases.includes(frase))) continue;
    if (!porFrase.has(frase)) porFrase.set(frase, new Map());
    const v = String(target[k]).trim();
    const m = porFrase.get(frase);
    m.set(v, [...(m.get(v) ?? []), k]);
  }
  return [...porFrase].filter(([, m]) => m.size > 1);
}

// ── runner ────────────────────────────────────────────────────────────────
// Solo al invocarlo directamente: el test importa las funciones puras de arriba y no quiere
// que el gate entero se ejecute (ni que llame a `process.exit`) al hacer el import.
if (process.argv[1] && process.argv[1].endsWith('i18n-check.mjs')) {
  let problems = 0;
  const fail = (msg, detalle = []) => {
    problems += 1;
    console.log(`  ✗ ${msg}`);
    for (const d of detalle.slice(0, 12)) console.log(`      ${d}`);
    if (detalle.length > 12) console.log(`      …y ${detalle.length - 12} más`);
  };

  console.log('\n=== i18n:check · cobertura y coherencia de los locales ===');

  for (const app of APPS) {
    const ref = flat(load(app.dir, app.reference));
    const refKeys = new Set(Object.keys(ref));
    console.log(`\n${app.name} (referencia: ${app.reference} · ${refKeys.size} claves)`);

    // ── A. paridad de claves ────────────────────────────────────────────────
    const locales = {};
    for (const locale of app.targets) {
      const t = flat(load(app.dir, locale));
      locales[locale] = t;
      const keys = new Set(Object.keys(t));
      const missing = [...refKeys].filter((k) => !keys.has(k));
      const orphan = [...keys].filter((k) => !refKeys.has(k));
      if (missing.length || orphan.length) {
        problems += missing.length + orphan.length;
        console.log(`  ✗ ${locale}: ${missing.length} sin traducir · ${orphan.length} huérfana(s)`);
        for (const k of missing.slice(0, 25)) console.log(`      falta: ${k}`);
        if (missing.length > 25) console.log(`      …y ${missing.length - 25} más`);
        for (const k of orphan.slice(0, 25)) console.log(`      sobra: ${k}`);
      } else {
        console.log(`  ✓ ${locale}: ${keys.size} claves, 1:1 con ${app.reference}`);
      }
    }

    // ── C. variables · D. vacíos ────────────────────────────────────────────
    for (const locale of [app.reference, ...app.targets]) {
      const t = locale === app.reference ? ref : locales[locale];
      const varsKo = [];
      const vacios = [];
      for (const k of refKeys) {
        if (!(k in t)) continue; // ya lo canta A
        if (!String(t[k]).trim()) vacios.push(k);
        if (locale !== app.reference && vars(ref[k]) !== vars(t[k]))
          varsKo.push(`${k}: es {{${vars(ref[k]) || '—'}}} vs ${locale} {{${vars(t[k]) || '—'}}}`);
      }
      if (varsKo.length) fail(`${locale}: ${varsKo.length} clave(s) pierden o cambian variables`, varsKo);
      if (vacios.length) fail(`${locale}: ${vacios.length} valor(es) vacíos`, vacios);
    }

    // ── E. misma frase, dos traducciones ────────────────────────────────────
    for (const locale of app.targets) {
      const divergentes = divergencias(ref, locales[locale], locale);
      if (divergentes.length)
        fail(
          `${locale}: ${divergentes.length} frase(s) de ${app.reference} con dos traducciones`,
          divergentes.map(
            ([frase, m]) =>
              `"${frase}" → ${[...m].map(([v, ks]) => `"${v}" (${ks[0]}${ks.length > 1 ? ` +${ks.length - 1}` : ''})`).join('  vs  ')}`,
          ),
        );
    }

    if (!app.code) continue;
    const srcDir = resolve(root, app.code);
    const htmls = walk(srcDir, ['.html']);
    const tss = walk(srcDir, ['.ts']);

    // ── B. claves pedidas por el código que no existen ──────────────────────
    const pedidas = new Map();
    for (const f of [...htmls, ...tss])
      for (const k of clavesPedidas(readFileSync(f, 'utf8'))) pedidas.set(k, f);
    const inexistentes = [...pedidas].filter(([k]) => !refKeys.has(k));
    if (inexistentes.length)
      fail(
        `${inexistentes.length} clave(s) que el código pide y ${app.reference}.json no tiene`,
        inexistentes.map(([k, f]) => `${k}  ←  ${relative(root, f)}`),
      );
    else console.log(`  ✓ código: ${pedidas.size} claves literales, todas existen`);

    // ── F. copy a pelo en plantillas ────────────────────────────────────────
    const aPelo = [];
    for (const f of htmls)
      for (const hit of copyAPelo(readFileSync(f, 'utf8')))
        aPelo.push(`${relative(root, f)}  →  ${hit.slice(0, 70)}`);
    if (aPelo.length)
      fail(`${aPelo.length} atributo(s) con copy escrito a pelo (no pasan por i18n)`, aPelo);
    else console.log(`  ✓ plantillas: ${htmls.length} sin copy a pelo en atributos visibles`);

    // ── G. locale clavado ───────────────────────────────────────────────────
    const clavados = [];
    for (const f of tss)
      for (const tag of localesClavados(readFileSync(f, 'utf8')))
        clavados.push(`${relative(root, f)}  →  toLocale…('${tag}')`);
    if (clavados.length)
      fail(
        `${clavados.length} formato(s) de fecha/número clavados a un idioma (usa LanguageService.locale())`,
        clavados,
      );
    else console.log(`  ✓ fechas y números: ninguno clavado a un idioma`);
  }

  console.log(`\n${SEP}`);
  if (problems) {
    console.log(`✗ i18n:check — ${problems} problema(s). La app no es multiidioma del todo.`);
    process.exit(1);
  }
  console.log('✓ i18n:check OK — locales 1:1, sin copy suelto y sin formatos clavados.');
}
