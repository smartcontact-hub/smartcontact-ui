#!/usr/bin/env node
/**
 * aura-diff — nuestra capa sobre Aura, componente a componente y clave a clave.
 *
 * La pregunta que contesta: «si instalas PrimeNG con Aura tal cual (primeng.dev) y le aplicas
 * lo nuestro, ¿qué cambia en `<p-x>`?». Contra Aura PURO, no contra el DS de nadie.
 *
 * Método, y por qué este y no otro (medido 2026-09-13):
 *   1. esbuild empaqueta `@primeuix/themes/aura` y `sc-preset/index.ts` (que ya es Aura +
 *      lo nuestro fusionado con `definePreset`).
 *   2. `Theme.setTheme` + `Theme.getComponent(nombre)` de `@primeuix/styled` dan el CSS de
 *      variables EXACTO que PrimeNG inyecta. Comparar el ÁRBOL de los objetos engaña: Aura
 *      trae `light-dark()` en la raíz y nosotros `colorScheme`, y en el CSS gana lo nuestro
 *      porque va DESPUÉS en el mismo bloque. Aquí se respeta ese orden.
 *   3. Cada variable se resuelve hasta su valor final, en claro y en oscuro, pasando por la
 *      semántica del preset y por los `--sc-*` de `design-tokens` (capas 01-07).
 *   4. ⚠️ Un token que el tema NO define no es «sin estilo», es HERENCIA: `font-size:
 *      var(--p-x)` con `--p-x` ausente es inválido y el elemento hereda de su página. Por
 *      eso se leen también las variables que CONSUME la hoja del componente
 *      (`@primeuix/styles/<nombre>`), no solo las que el tema declara.
 *   5. El porqué de cada diferencia sale de dos fuentes que no son opinión: el export del
 *      Kit de Figma (`kit-export-dtcg.json`) y el comentario que lleva la clave en nuestro
 *      preset. Si ninguna de las dos lo explica, la fila sale «sin motivo claro».
 *
 * Uso:
 *   node tools/aura-diff.mjs button                # resumen legible
 *   node tools/aura-diff.mjs button --json out.json
 *   node tools/aura-diff.mjs --list                # componentes con tema en Aura
 *
 * Las funciones puras (parseo, resolución, normalización) se exportan para su test:
 * `scripts/__tests__/aura-diff.test.mjs`.
 */
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');
const PRESET_DIR = 'projects/ui-smartcontact/src/lib/theme/sc-preset';
const TOKEN_LAYERS = ['01-primitive', '02-semantic', '03-palette', '04-component', '05-extensions', '07-dark']
    .map((f) => `projects/design-tokens/src/lib/styles/tokens/layers/${f}.css`);
const KIT_EXPORT = 'projects/design-tokens/scripts/kit-export-dtcg.json';
/* PrimeOne 4.0.0 (Figma de PrimeTek, fichero `bJ01Ym4NrCvxFm7dJXvhqp`) volcado con el bridge y
 * pasado a la forma del Kit por `kitFromFigmaConsoleDtcg`. Es el eslabón entre Aura en código y
 * nuestro Kit: sin él no se distingue lo que heredamos de PrimeTek de lo que cambiamos nosotros. */
const PRIMEONE_SNAPSHOT = 'tools/reference/primeone-4.0.0.json';
/* Las mismas opciones que `provideSmartContactUi`: sin ellas el bloque oscuro sale con otro selector. */
export const THEME_OPTIONS = { prefix: 'p', darkModeSelector: '.sc-dark' };
const DARK_SELECTOR = '.sc-dark';
/* Tamaño de fuente raíz del navegador: los `rem` del CSS se leen contra él. */
const ROOT_PX = 16;

// ── Texto CSS ────────────────────────────────────────────────────────────────────────────────

/** Índice del paréntesis que cierra el que abre en `open`. -1 si no cierra. */
function matchParen(text, open) {
    let depth = 0;
    for (let i = open; i < text.length; i++) {
        if (text[i] === '(') depth++;
        else if (text[i] === ')' && --depth === 0) return i;
    }
    return -1;
}

/** Parte por la primera coma de nivel 0. */
function splitTopComma(text) {
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '(') depth++;
        else if (text[i] === ')') depth--;
        else if (text[i] === ',' && depth === 0) return [text.slice(0, i), text.slice(i + 1)];
    }
    return [text, null];
}

/** Sustituye cada `fn(...)` (con paréntesis anidados) por lo que devuelva `replacer(args)`. */
function replaceFn(text, fn, replacer) {
    let out = '';
    let i = 0;
    const needle = `${fn}(`;
    while (i < text.length) {
        const at = text.indexOf(needle, i);
        const boundary = at > 0 ? text[at - 1] : '';
        if (at === -1) {
            out += text.slice(i);
            break;
        }
        if (/[\w-]/.test(boundary)) {
            out += text.slice(i, at + needle.length);
            i = at + needle.length;
            continue;
        }
        const close = matchParen(text, at + fn.length);
        if (close === -1) {
            out += text.slice(i);
            break;
        }
        out += text.slice(i, at) + replacer(text.slice(at + needle.length, close));
        i = close + 1;
    }
    return out;
}

export const pickLightDark = (value, scheme) =>
    replaceFn(value, 'light-dark', (args) => {
        const [light, dark] = splitTopComma(args);
        return pickLightDark((scheme === 'dark' ? dark ?? light : light).trim(), scheme);
    });

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * Declaraciones `--x` de un CSS plano en orden de cascada, separando `:root` (claro) del
 * selector oscuro. Solo reglas de primer nivel: es la forma que emiten `@primeuix/styled`
 * y las capas de tokens (medido; si algún día llega un `@media`, se ignora y se ve en el
 * test de forma).
 */
export function parseVarBlocks(css) {
    const blocks = { light: new Map(), dark: new Map() };
    const text = stripComments(css);
    const rule = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = rule.exec(text))) {
        const scope = m[1].includes(DARK_SELECTOR) ? 'dark' : 'light';
        for (const decl of splitDecls(m[2])) {
            const colon = decl.indexOf(':');
            if (colon === -1) continue;
            const name = decl.slice(0, colon).trim();
            if (!name.startsWith('--')) continue;
            blocks[scope].set(name, decl.slice(colon + 1).trim());
        }
    }
    return blocks;
}

function splitDecls(body) {
    const out = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < body.length; i++) {
        if (body[i] === '(') depth++;
        else if (body[i] === ')') depth--;
        else if (body[i] === ';' && depth === 0) {
            out.push(body.slice(start, i));
            start = i + 1;
        }
    }
    out.push(body.slice(start));
    return out.filter((d) => d.trim());
}

/**
 * Buscador de variables por esquema a partir de varias fuentes, en orden de prioridad.
 * En oscuro manda el bloque `.sc-dark` y, si no la redeclara, la de `:root`.
 */
export function makeLookup(...sources) {
    return (name, scheme) => {
        for (const blocks of sources) {
            if (scheme === 'dark' && blocks.dark.has(name)) return blocks.dark.get(name);
            if (blocks.light.has(name)) return blocks.light.get(name);
        }
        return undefined;
    };
}

export const UNSET = 'sin definir';

/**
 * Valor final de una expresión CSS en un esquema. Una variable ausente sin fallback deja
 * la marca `sin definir(--x)`: en el navegador eso es herencia.
 */
export function resolveValue(value, scheme, lookup, seen = new Set()) {
    if (value == null) return undefined;
    const picked = pickLightDark(String(value), scheme);
    const replaced = replaceFn(picked, 'var', (args) => {
        const [rawName, fallback] = splitTopComma(args);
        const name = rawName.trim();
        if (seen.has(name)) return `ciclo(${name})`;
        const def = lookup(name, scheme);
        if (def === undefined) {
            return fallback != null ? resolveValue(fallback.trim(), scheme, lookup, seen) : `${UNSET}(${name})`;
        }
        return resolveValue(def, scheme, lookup, new Set([...seen, name]));
    });
    return normalizeValue(replaced);
}

/** Cadena de variables que recorre una clave hasta su valor: [[nombre, definición], ...]. */
export function traceVar(name, scheme, lookup) {
    const chain = [];
    const seen = new Set();
    let current = name;
    while (current && !seen.has(current)) {
        seen.add(current);
        const def = lookup(current, scheme);
        chain.push([current, def === undefined ? undefined : pickLightDark(def, scheme)]);
        if (def === undefined) break;
        const only = /^var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)$/.exec(pickLightDark(def, scheme).trim());
        current = only ? only[1] : null;
    }
    return chain;
}

const round = (n) => Number(n.toFixed(2));

const hex2 = (n) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');

/** `transparent` mezclado en srgb solo aporta alfa: `color-mix(in srgb, #abc 16%, transparent)` = `#aabbcc29`. */
function colorMixTransparent(args) {
    const parts = [];
    let rest = args;
    while (rest != null) {
        const [head, tail] = splitTopComma(rest);
        parts.push(head.trim());
        rest = tail;
    }
    if (parts.length !== 3 || !/^in srgb$/i.test(parts[0])) return null;
    const parse = (p) => {
        const m = /^(\S+)(?:\s+(\d*\.?\d+)%)?$/.exec(p);
        return m ? { color: m[1], pct: m[2] != null ? Number(m[2]) : null } : null;
    };
    const a = parse(parts[1]);
    const b = parse(parts[2]);
    if (!a || !b) return null;
    const [solid, clear] = a.color === 'transparent' ? [b, a] : [a, b];
    if (clear.color !== 'transparent' || !/^#[0-9a-f]{6}$/i.test(solid.color)) return null;
    const pct = solid.pct ?? (clear.pct != null ? 100 - clear.pct : 50);
    return `${solid.color.toLowerCase()}${hex2((pct / 100) * 255)}`;
}

/** Forma comparable: rem→px, colores a hex, ms→s, espacios, `calc` de números puros. */
export function normalizeValue(value) {
    if (value == null) return value;
    let v = String(value).replace(/\s+/g, ' ').trim();
    v = v.replace(/(^|[^\w.-])(-?\d*\.?\d+)rem\b/g, (_, pre, n) => `${pre}${round(Number(n) * ROOT_PX)}px`);
    v = v.replace(/(^|[^\w.-])(\d*\.?\d+)ms\b/g, (_, pre, n) => `${pre}${round(Number(n) / 1000)}s`);
    v = v.replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?\)/gi, (_, r, g, b, a) =>
        `#${hex2(+r)}${hex2(+g)}${hex2(+b)}${a != null && Number(a) < 1 ? hex2(Number(a) * 255) : ''}`);
    v = v.replace(/#[0-9a-f]{3,8}\b/gi, (h) => h.toLowerCase());
    v = replaceFn(v, 'color-mix', (args) => colorMixTransparent(args) ?? `color-mix(${args})`);
    v = v.replace(/#([0-9a-f]{6})ff\b/g, '#$1');
    v = v.replace(/(^|[\s(,])0px\b/g, '$10');
    v = replaceFn(v, 'calc', (expr) => {
        const e = expr.trim();
        if (!/^[\d.\spx+*/()-]+$/.test(e)) return `calc(${e})`;
        const units = new Set(e.match(/px/g) ?? []);
        try {
            // Solo números, px y operadores (lo garantiza la regex): evaluar es seguro.
            const n = Function(`return (${e.replace(/px/g, '')})`)();
            return Number.isFinite(n) ? `${round(n)}${units.size ? 'px' : ''}` : `calc(${e})`;
        } catch {
            return `calc(${e})`;
        }
    });
    // Abreviatura de lados: «3.5px 3.5px» y «3.5px» son el mismo relleno. Sin esto, el Kit (que guarda
    // y/x por separado) y el código (que escribe un valor) salían como diferencia falsa (medido 2026-09-14
    // en las listas de select, multiselect y menu).
    const lados = v.split(' ');
    if (lados.length >= 2 && lados.length <= 4 && lados.every((x) => /^-?\d*\.?\d+(px)?$|^0$/.test(x))) {
        const [t, r = t, b = t, l = r] = lados;
        if (l === r) {
            if (b === t) return r === t ? t : `${t} ${r}`;
            return `${t} ${r} ${b}`;
        }
    }
    return v;
}

/** Variables `--p-*` que lee la hoja de un componente, con dónde las pinta. */
export function styleTokenUses(style) {
    const uses = new Map();
    if (!style) return uses;
    const text = stripComments(style.replace(/dt\('([^']+)'\)/g, (_, key) => `var(--p-${key.replace(/\./g, '-')})`));
    const rule = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = rule.exec(text))) {
        const selector = m[1].replace(/\s+/g, ' ').trim().replace(/^.*[;}]\s*/, '');
        for (const decl of splitDecls(m[2])) {
            const colon = decl.indexOf(':');
            if (colon === -1) continue;
            const prop = decl.slice(0, colon).trim();
            for (const [, name] of decl.slice(colon + 1).matchAll(/var\((--p-[\w-]+)/g)) {
                if (!uses.has(name)) uses.set(name, []);
                uses.get(name).push(`${selector} { ${prop} }`);
            }
        }
    }
    return uses;
}

/** Qué tipo de cosa es una clave, por su nombre. */
export function categoryOf(name) {
    if (/(^|-)(font|line-height|letter-spacing|text-transform)(-|$)/.test(name)) return 'letra';
    if (/radius/.test(name)) return 'radio';
    if (/color|background|shadow|outline|opacity/.test(name)) return 'color';
    if (/padding|gap|width|height|size|offset|margin|inset/.test(name)) return 'medida';
    return 'otros';
}

// ── Kit de Figma ─────────────────────────────────────────────────────────────────────────────

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/** Índice del export del Kit: ruta con puntos → [{set, value, type}]. */
export function indexKit(kit) {
    const byPath = new Map();
    const add = (path, entry) => {
        if (!byPath.has(path)) byPath.set(path, []);
        byPath.get(path).push(entry);
    };
    const walk = (node, path, set) => {
        if (node && typeof node === 'object' && '$value' in node) {
            const entry = { set, value: node.$value, type: node.$type };
            add(path, entry);
            // `aura/custom` cuelga todo de primitive./semantic./component./app.
            if (set === 'aura/custom' && /^(semantic|component)\./.test(path)) add(path.replace(/^\w+\./, ''), entry);
            return;
        }
        if (node && typeof node === 'object') {
            for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k, set);
        }
    };
    for (const [set, tree] of Object.entries(kit)) if (set !== 'source') walk(tree, '', set);
    return byPath;
}

const KIT_ORDER = (scheme) => [
    `aura/component/${scheme}`, 'aura/component/common', 'aura/custom', `aura/semantic/${scheme}`,
    'aura/semantic/common', 'aura/primitive', 'aura/effects', 'aura/app'
];

function kitEntry(byPath, path, scheme) {
    const entries = byPath.get(path);
    if (!entries) return undefined;
    for (const set of KIT_ORDER(scheme)) {
        const hit = entries.find((e) => e.set === set);
        if (hit) return hit;
    }
    return entries[0];
}

/** Valor del Kit para una ruta, resolviendo `{referencias}`. Números = px salvo pesos y opacidades. */
export function kitValue(byPath, path, scheme, seen = new Set()) {
    const entry = kitEntry(byPath, path, scheme);
    if (!entry || seen.has(path)) return undefined;
    const unitless = /weight|opacity|z-?index/i.test(path);
    const px = (n) => (Number(n) === 0 ? '0' : `${n}px`);
    // Sombras del plugin: {x, y, blur, spread, color} o una lista. Todo a cero y transparente = none.
    const shadow = (s) => (Number(s.x) || Number(s.y) || Number(s.blur) || Number(s.spread) || !/^#[0-9a-f]{6}00$/i.test(s.color)
        ? `${px(s.x)} ${px(s.y)} ${px(s.blur)} ${px(s.spread)} ${s.color}`
        : 'none');
    const render = (v) => {
        if (typeof v === 'number') return unitless ? String(v) : `${v}px`;
        if (Array.isArray(v)) return v.map(shadow).join(', ');
        if (v && typeof v === 'object') return shadow(v);
        return String(v);
    };
    const raw = render(entry.value);
    const out = raw.replace(/\{([^}]+)\}/g, (whole, ref) => kitValue(byPath, ref, scheme, new Set([...seen, path])) ?? whole);
    return normalizeValue(out);
}

/*
 * PrimeOne (el Figma oficial de PrimeTek) volcado con `figma_export_tokens` del bridge: DTCG
 * con la colección como primer segmento y los modos en `$extensions`. Se pasa a la forma del
 * export de nuestro Kit (`aura/component/light`…) para que las dos se lean con el mismo
 * resolvedor. Las referencias pierden el prefijo de colección: `{primitive.scale.0-5}` →
 * `{scale.0-5}`, igual que las escribe el plugin del Theme Designer.
 */
const PRIMEONE_SETS = {
    'component-color-scheme': { Light: 'aura/component/light', Dark: 'aura/component/dark' },
    'semantic-color-scheme': { Light: 'aura/semantic/light', Dark: 'aura/semantic/dark' },
    'component-common': { 'Mode 1': 'aura/component/common' },
    'semantic-common': { 'Mode 1': 'aura/semantic/common' },
    primitive: { 'Mode 1': 'aura/primitive' },
    app: { 'Mode 1': 'aura/app' },
    custom: { 'Mode 1': 'aura/custom' }
};

export function kitFromFigmaConsoleDtcg(dtcg) {
    const out = { source: 'figma-console-mcp export' };
    const strip = (ref) => ref.replace(/\{(?:component-color-scheme|semantic-color-scheme|component-common|semantic-common|primitive|app|custom)\./g, '{');
    const put = (set, path, token) => {
        let node = (out[set] ??= {});
        const parts = path.split('.');
        for (const p of parts.slice(0, -1)) node = node[p] ??= {};
        node[parts.at(-1)] = token;
    };
    for (const [collection, modes] of Object.entries(PRIMEONE_SETS)) {
        const walk = (node, path) => {
            if (node && typeof node === 'object' && '$value' in node) {
                const synced = node.$extensions?.['figma-console-mcp']?.lastSyncedValue ?? {};
                for (const [mode, set] of Object.entries(modes)) {
                    const v = synced[mode];
                    if (!v) continue;
                    const value = 'reference' in v ? strip(v.reference) : v.literal;
                    put(set, path, { $type: node.$type === 'dimension' ? 'number' : node.$type, $value: typeof value === 'string' && /^#[0-9a-f]{8}$/i.test(value) ? value.toLowerCase() : value });
                }
                return;
            }
            if (node && typeof node === 'object') for (const [k, child] of Object.entries(node)) if (k !== '$extensions') walk(child, path ? `${path}.${k}` : k);
        };
        walk(dtcg[collection], '');
    }
    return out;
}

/**
 * Valor de Figma para una variable del tema. El tema junta en una clave lo que Figma guarda
 * en dos (`tooltip.padding` = `padding.y padding.x`): si la clave entera no existe, se compone.
 */
function figmaValue(byPath, byKebab, key, scheme) {
    const direct = kitPathsFor(key, byKebab)[0];
    if (direct) return kitValue(byPath, direct, scheme);
    const y = kitPathsFor(`${key}-y`, byKebab)[0];
    const x = kitPathsFor(`${key}-x`, byKebab)[0];
    return y && x ? normalizeValue(`${kitValue(byPath, y, scheme)} ${kitValue(byPath, x, scheme)}`) : undefined;
}

/** `--p-button-padding-x` → candidatos de ruta del Kit (`button.padding.x`). */
function kitPathsFor(varName, byKebab) {
    return byKebab.get(varName.replace(/^--p-/, '')) ?? [];
}

function indexKitByKebab(byPath) {
    const map = new Map();
    for (const path of byPath.keys()) {
        const key = path.split('.').map(kebab).join('-');
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(path);
    }
    return map;
}

// ── Comentarios de nuestro preset ───────────────────────────────────────────────────────────

const EXCLUDED_KEY = /^(primitive|semantic|components|directives|variables|colorscheme|light|dark|common|root|states|extend|css)$/i;

/**
 * Comentarios que lleva cada clave en un fichero de preset, incluidos los de sus ancestros
 * (un comentario encima de `danger: {` explica todas sus hojas). Clave del índice:
 * `<esquema>|--p-...`, con esquema `any` fuera de `colorScheme`.
 */
export async function indexPresetComments(file, prefixName) {
    const ts = (await import('typescript')).default;
    const source = readFileSync(join(ROOT, file), 'utf8');
    const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const index = new Map();
    const commentsOf = (node) =>
        (ts.getLeadingCommentRanges(source, node.getFullStart()) ?? [])
            .map((r) => source.slice(r.pos, r.end).replace(/^\/\*+|\*+\/$|^\s*\*\s?|^\/\/\s?/gm, '').trim())
            .filter(Boolean);
    const visit = (obj, parts, scheme, inherited) => {
        for (const prop of obj.properties) {
            if (!ts.isPropertyAssignment(prop)) continue;
            const key = prop.name.getText(sf).replace(/^['"]|['"]$/g, '');
            const own = commentsOf(prop);
            const notes = [...inherited, ...own];
            const nextScheme = key === 'light' || key === 'dark' ? key : scheme;
            const nextParts = EXCLUDED_KEY.test(key) ? parts : [...parts, kebab(key)];
            let init = prop.initializer;
            while (init && (ts.isSatisfiesExpression?.(init) || ts.isAsExpression(init))) init = init.expression;
            if (init && ts.isObjectLiteralExpression(init)) visit(init, nextParts, nextScheme, notes);
            else if (notes.length) {
                const name = `--p-${[prefixName, ...nextParts].filter(Boolean).join('-')}`;
                index.set(`${nextScheme}|${name}`, notes);
            }
        }
    };
    const findObjects = (node, inherited) => {
        if (ts.isObjectLiteralExpression(node)) {
            visit(node, [], 'any', inherited);
            return;
        }
        ts.forEachChild(node, (child) => findObjects(child, ts.isExportAssignment(node) || ts.isVariableStatement(node) ? commentsOf(node) : inherited));
    };
    findObjects(sf, []);
    return index;
}

const lookupNotes = (index, name, scheme) => index.get(`${scheme}|${name}`) ?? index.get(`any|${name}`) ?? [];

/**
 * Comentarios de las capas de tokens: un comentario explica el GRUPO de declaraciones que
 * le sigue, hasta la primera línea en blanco. Los marcadores `@sc-gen` no cuentan como motivo.
 */
export function indexCssComments(css, scheme = 'any', index = new Map()) {
    const token = /\/\*([\s\S]*?)\*\/|(--[\w-]+)\s*:|\n[ \t]*\n/g;
    let pending = null;
    let m;
    while ((m = token.exec(css))) {
        if (m[1] !== undefined) {
            const text = m[1].replace(/^\s*\*\s?/gm, '').trim();
            // Un marcador de bloque generado o un rótulo de sección («---- Color · Blue ----»)
            // nombra, no explica: no cuenta como motivo.
            const header = /^-{3,}\s*([^\n]*?)\s*-{3,}\s*/.exec(text);
            const onlyLabel = header && !text.slice(header[0].length).trim();
            pending = /^@sc-gen/.test(text) || onlyLabel ? null : header ? `${header[1]}. ${text.slice(header[0].length).trim()}` : text;
        } else if (m[2]) {
            if (pending) index.set(`${scheme}|${m[2]}`, [pending]);
        } else {
            pending = null;
        }
    }
    return index;
}

function tokenComments() {
    const index = new Map();
    for (const file of TOKEN_LAYERS) indexCssComments(readFileSync(join(ROOT, file), 'utf8'), file.includes('07-dark') ? 'dark' : 'any', index);
    return index;
}

/**
 * El porqué de una diferencia, por orden de autoridad: el Kit (medido contra su export) y
 * lo que diga el comentario de la clave. Sin ninguna de las dos: sin motivo claro.
 */
export function classifyReason({ scValue, auraValue, kit, primeOne, notes }) {
    const text = notes.join(' ');
    const a11y = /\bAA\b|contraste|accesib|a11y|WCAG|1\.4\.\d+|lector de pantalla/i.test(text);
    // Si nuestro código es lo que dibuja el Kit, la diferencia con Aura nació en FIGMA. Queda
    // saber en qué eslabón: si PrimeOne ya lo traía, lo heredamos de PrimeTek (su Figma no rema
    // igual que su código); si no, es personalización nuestra en el Kit.
    if (kit !== undefined && kit === scValue && kit !== auraValue) {
        if (primeOne !== undefined && primeOne === kit) return { reason: 'primeone', detail: 'PrimeOne ya lo dibuja así; su código Aura no' };
        return { reason: 'kit', detail: primeOne !== undefined ? `PrimeOne dice ${primeOne}` : 'coincide con el export del Kit' };
    }
    if (a11y) return { reason: 'accesibilidad', detail: kit !== undefined && kit !== scValue ? `se aparta del Kit (${kit})` : '' };
    if (kit !== undefined && kit !== scValue) return { reason: 'sin-motivo', detail: `el Kit dice ${kit}` };
    // Un comentario de la capa de tokens (`--sc-x: …`) describe el token, no justifica el
    // desvío; solo cuenta como explicación el que está en el preset, junto a la clave.
    if (notes.some((n) => !n.startsWith('--sc-'))) return { reason: 'comentado', detail: '' };
    return { reason: 'sin-motivo', detail: kit === undefined ? 'el Kit no define esta clave' : '' };
}

// ── Carga real ───────────────────────────────────────────────────────────────────────────────

let presetsCache;
export async function loadPresets() {
    if (presetsCache) return presetsCache;
    const { build } = await import('esbuild');
    const out = mkdtempSync(join(tmpdir(), 'aura-diff-'));
    writeFileSync(join(out, 'aura.entry.mjs'), "export { default } from '@primeuix/themes/aura';\n");
    writeFileSync(join(out, 'sc.entry.mjs'), `export { default } from ${JSON.stringify(join(ROOT, PRESET_DIR, 'index.ts'))};\n`);
    await build({
        entryPoints: { aura: join(out, 'aura.entry.mjs'), sc: join(out, 'sc.entry.mjs') },
        bundle: true,
        format: 'esm',
        platform: 'node',
        outdir: out,
        outExtension: { '.js': '.mjs' },
        nodePaths: [join(ROOT, 'node_modules')],
        logLevel: 'error'
    });
    const aura = (await import(pathToFileURL(join(out, 'aura.mjs')).href)).default;
    const sc = (await import(pathToFileURL(join(out, 'sc.mjs')).href)).default;
    presetsCache = { aura, sc };
    return presetsCache;
}

async function themeCss(preset, name) {
    const { Theme } = await import('@primeuix/styled');
    Theme.setTheme({ preset, options: THEME_OPTIONS });
    const component = Theme.getComponent(name);
    const common = Theme.getCommon(name);
    return {
        component: parseVarBlocks(component.css ?? ''),
        common: parseVarBlocks([common.primitive?.css, common.semantic?.css, common.global?.css].filter(Boolean).join('\n')),
        componentStyle: component.style ?? '',
        globalStyle: common.style ?? ''
    };
}

async function componentStyle(name) {
    const file = join(ROOT, 'node_modules/@primeuix/styles/dist', name, 'index.mjs');
    if (!existsSync(file)) return '';
    const mod = await import(pathToFileURL(file).href);
    return typeof mod.style === 'string' ? mod.style : '';
}

const tokenBlocks = () => parseVarBlocks(TOKEN_LAYERS.map((f) => readFileSync(join(ROOT, f), 'utf8')).join('\n'));

/** Reglas de `css.ts` que tocan el componente, con el comentario de su bloque en el fuente. */
export async function behaviourRules(globalStyle, name, lookup) {
    const postcss = (await import('postcss')).default;
    const own = (sel) => new RegExp(`\\.p-${name}(?![\\w])|\\.p-${name}-`).test(sel);
    const squash = (s) => s.replace(/\s+/g, ' ').trim();
    const rules = [];
    // postcss y no una regex: una regla dentro de `@media (prefers-reduced-motion)` tiene que
    // llevarse su condición, o sale como si aplicara siempre (lo hacía la primera versión).
    postcss.parse(globalStyle).walkRules((rule) => {
        const selectors = rule.selectors.map(squash).filter(own);
        if (!selectors.length) return;
        const media = [];
        for (let p = rule.parent; p && p.type === 'atrule'; p = p.parent) media.unshift(`@${p.name} ${p.params}`);
        const decls = rule.nodes
            .filter((n) => n.type === 'decl')
            .map((d) => ({ prop: d.prop, value: squash(d.value), light: resolveValue(d.value, 'light', lookup), dark: resolveValue(d.value, 'dark', lookup) }));
        rules.push({ selectors, media, decls });
    });
    // De dónde sale cada regla: el bloque de `css.ts` que escribe su selector, con su comentario.
    const ts = (await import('typescript')).default;
    const file = `${PRESET_DIR}/css.ts`;
    const source = readFileSync(join(ROOT, file), 'utf8');
    const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const blocks = [];
    for (const st of sf.statements) {
        if (!ts.isVariableStatement(st)) continue;
        const body = squash(st.getText(sf));
        const decl = st.declarationList.declarations[0];
        const nameNode = decl?.name.getText(sf) ?? null;
        let init = decl?.initializer;
        while (init && (ts.isAsExpression(init) || ts.isSatisfiesExpression?.(init))) init = init.expression;
        const isSelectorList = !!init && ts.isArrayLiteralExpression(init);
        const comments = (ts.getLeadingCommentRanges(source, st.getFullStart()) ?? [])
            .map((r) => source.slice(r.pos, r.end).replace(/^\/\*+|\*+\/$|^\s*\*\s?/gm, '').trim());
        const line = sf.getLineAndCharacterOfPosition(st.getStart(sf)).line + 1;
        blocks.push({ name: nameNode, line, comments, body, isSelectorList });
    }
    for (const rule of rules) {
        // El bloque que escribe el selector ENTERO (`.p-button` no casa dentro de `.p-button-sm`).
        // Si una plantilla lo escribe con sus propiedades, esa; si no, la LISTA de selectores que
        // lo nombra (las alimentan `controlRule`/`rampRule`, que ponen las propiedades aparte).
        const writes = (b, s) => new RegExp(`${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`).test(b.body);
        const candidates = blocks.filter((b) => rule.selectors.some((s) => writes(b, s)));
        const withProps = candidates.filter((b) => rule.decls.every((d) => b.body.includes(`${d.prop}:`)));
        const lists = candidates.filter((b) => b.isSelectorList);
        const hit = (withProps.length ? withProps : lists.length ? lists : candidates).sort((a, b) => a.body.length - b.body.length)[0];
        rule.source = hit ? { file, name: hit.name, line: hit.line, comments: hit.comments } : { file, name: null, line: null, comments: [] };
    }
    return rules;
}

/**
 * Diferencias de tema de un componente. Filas solo donde el valor FINAL cambia en algún
 * esquema, más las claves que la hoja lee y Aura deja sin definir (herencia).
 */
export async function diffComponent(name) {
    const { aura, sc } = await loadPresets();
    const a = await themeCss(aura, name);
    const s = await themeCss(sc, name);
    const tokens = tokenBlocks();
    const auraLookup = makeLookup(a.component, a.common);
    const scLookup = makeLookup(s.component, s.common, tokens);
    const kitByPath = indexKit(JSON.parse(readFileSync(join(ROOT, KIT_EXPORT), 'utf8')));
    const kitByKebab = indexKitByKebab(kitByPath);
    const primeOneByPath = existsSync(join(ROOT, PRIMEONE_SNAPSHOT)) ? indexKit(JSON.parse(readFileSync(join(ROOT, PRIMEONE_SNAPSHOT), 'utf8'))) : null;
    const primeOneByKebab = primeOneByPath ? indexKitByKebab(primeOneByPath) : null;
    const componentFile = `${PRESET_DIR}/${name}.ts`;
    const notesComponent = existsSync(join(ROOT, componentFile)) ? await indexPresetComments(componentFile, name) : new Map();
    const notesBase = await indexPresetComments(`${PRESET_DIR}/base.ts`, '');
    const notesTokens = tokenComments();
    const uses = styleTokenUses(await componentStyle(name));

    const keys = new Set([...a.component.light.keys(), ...a.component.dark.keys(), ...s.component.light.keys(), ...s.component.dark.keys(), ...uses.keys()]);
    const rows = [];
    for (const key of [...keys].sort()) {
        const row = { key, category: categoryOf(key), paints: uses.get(key) ?? [], schemes: {} };
        let differs = false;
        for (const scheme of ['light', 'dark']) {
            const auraValue = resolveValue(`var(${key})`, scheme, auraLookup);
            const scValue = resolveValue(`var(${key})`, scheme, scLookup);
            const scTrace = traceVar(key, scheme, scLookup);
            const auraTrace = traceVar(key, scheme, auraLookup);
            // Dónde empieza la diferencia: la primera variable de nuestra cadena cuya definición no es la de Aura.
            const origin = scTrace.find(([n, def]) => n.startsWith('--p-') && def !== auraLookup(n, scheme) && pickLightDark(auraLookup(n, scheme) ?? '', scheme) !== def)?.[0] ?? null;
            const kitPath = kitPathsFor(key, kitByKebab)[0] ?? null;
            const kit = figmaValue(kitByPath, kitByKebab, key, scheme);
            const primeOne = primeOneByPath ? figmaValue(primeOneByPath, primeOneByKebab, key, scheme) : undefined;
            const presetNotes = origin
                ? origin.startsWith(`--p-${name}-`) || origin === `--p-${name}`
                    ? lookupNotes(notesComponent, origin, scheme)
                    : lookupNotes(notesBase, origin, scheme)
                : [];
            // Y lo que digan los `--sc-*` por los que pasa nuestra cadena (el modo oscuro explica ahí sus desvíos).
            const tokenNotes = origin
                ? scTrace.filter(([n]) => n.startsWith('--sc-')).flatMap(([n]) => lookupNotes(notesTokens, n, scheme).map((t) => `${n}: ${t}`))
                : [];
            const notes = [...presetNotes, ...tokenNotes];
            const same = auraValue === scValue;
            if (!same) differs = true;
            row.schemes[scheme] = {
                aura: auraValue,
                sc: scValue,
                auraTrace,
                scTrace,
                origin,
                originFile: origin ? (origin.startsWith(`--p-${name}-`) ? componentFile : `${PRESET_DIR}/base.ts`) : null,
                kit,
                primeOne,
                kitPath,
                notes,
                ...(same ? { reason: 'igual' } : classifyReason({ scValue, auraValue, kit, primeOne, notes }))
            };
        }
        const unsetAura = ['light', 'dark'].some((sch) => row.schemes[sch].aura?.startsWith(UNSET));
        const unsetSc = ['light', 'dark'].some((sch) => row.schemes[sch].sc?.startsWith(UNSET));
        row.status = !differs ? (unsetAura && uses.has(key) ? 'hereda-en-los-dos' : 'igual') : unsetAura && !unsetSc ? 'aura-hereda-nosotros-definimos' : 'cambia';
        rows.push(row);
    }
    const behaviour = await behaviourRules(s.globalStyle, name, scLookup);
    return { name, rows, behaviour, generatedFrom: { aura: '@primeuix/themes/aura', preset: `${PRESET_DIR}/index.ts`, options: THEME_OPTIONS } };
}

// ── Envoltorio sc-* ─────────────────────────────────────────────────────────────────────────

/** Entradas y salidas públicas de un componente Angular de la era de señales. */
export function scComponentApi(source) {
    const inputs = [...source.matchAll(/readonly\s+(\w+)\s*=\s*(input|model)(?:\.required)?\s*(?:<[^()]*>)?\(([^)]*)\)/g)]
        .map(([, name, kind, args]) => ({ name, kind, default: splitTopComma(args)[0].trim() || null }));
    const outputs = [...source.matchAll(/readonly\s+(\w+)\s*=\s*output\s*(?:<[^()]*>)?\(/g)].map(([, name]) => name);
    return { inputs, outputs };
}

/** Qué pone la plantilla en la etiqueta de PrimeNG: `[x]="expr"`, `(evento)`, atributos fijos. */
export function templateBindings(html, tag) {
    const open = new RegExp(`<${tag}\\b([^>]*)>`).exec(html);
    if (!open) return null;
    const attrs = open[1];
    return {
        inputs: [...attrs.matchAll(/\[(\w+)\]="([^"]*)"/g)].map(([, name, expr]) => ({ name, expr })),
        outputs: [...attrs.matchAll(/\((\w+)\)="([^"]*)"/g)].map(([, name, expr]) => ({ name, expr })),
        static: [...attrs.matchAll(/(?:^|\s)([\w-]+)="([^"]*)"/g)].map(([, name, value]) => ({ name, value }))
    };
}

/** Entradas y salidas del componente de PrimeNG según su declaración `ɵcmp` en los tipos. */
export function primengComponentApi(dts, tag) {
    const at = dts.indexOf(`"${tag}"`);
    if (at === -1) return null;
    const line = dts.slice(at, dts.indexOf('\n', at));
    const inputs = [...line.matchAll(/"(\w+)": \{ "alias": "(\w+)"/g)].map(([, name]) => name);
    const outputsBlock = /\}; \}, \{([^}]*)\}/.exec(line)?.[1] ?? '';
    const outputs = [...outputsBlock.matchAll(/"(\w+)": "\w+"/g)].map(([, name]) => name);
    return { inputs, outputs };
}

export function wrapperDiff(name, { dir = name, tag = `p-${name}` } = {}) {
    const base = `projects/ui-smartcontact/src/lib/components/${dir}/sc-${dir}.component`;
    const dts = `node_modules/primeng/types/primeng-${name}.d.ts`;
    if (!existsSync(join(ROOT, `${base}.ts`)) || !existsSync(join(ROOT, dts))) return null;
    const ts = readFileSync(join(ROOT, `${base}.ts`), 'utf8');
    const html = existsSync(join(ROOT, `${base}.html`)) ? readFileSync(join(ROOT, `${base}.html`), 'utf8') : (/template:\s*`([\s\S]*?)`/.exec(ts)?.[1] ?? '');
    const sc = scComponentApi(ts);
    const bound = templateBindings(html, tag);
    const prime = primengComponentApi(readFileSync(join(ROOT, dts), 'utf8'), tag);
    const boundNames = new Set([...(bound?.inputs ?? []).map((b) => b.name), ...(bound?.static ?? []).map((b) => b.name)]);
    return {
        files: { ts: `${base}.ts`, html: existsSync(join(ROOT, `${base}.html`)) ? `${base}.html` : null, types: dts },
        tag,
        sc,
        bound,
        prime,
        primeInputsNotExposed: (prime?.inputs ?? []).filter((i) => !boundNames.has(i)),
        scInputsWithoutPrimeTwin: sc.inputs.map((i) => i.name).filter((i) => !(prime?.inputs ?? []).includes(i))
    };
}

// ── Resumen para leer ────────────────────────────────────────────────────────────────────────

const VARIANTS = ['primary', 'secondary', 'success', 'info', 'warn', 'help', 'danger', 'contrast', 'plain', 'link'];
/* Peor primero: una clave con un esquema sin motivo cuenta como sin motivo. */
const REASON_RANK = ['sin-motivo', 'accesibilidad', 'comentado', 'kit', 'primeone'];

/** Primer párrafo de un comentario, recortado: la ficha cita, no copia. */
export function excerpt(note, max = 320) {
    const first = note.split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();
    return first.length > max ? `${first.slice(0, max - 1).trimEnd()}…` : first;
}

export function variantOf(key, name) {
    const parts = key.replace(`--p-${name}-`, '').split('-');
    return VARIANTS.find((v) => parts.includes(v)) ?? 'general';
}

const schemeView = (s) => ({ aura: s.aura, primeOne: s.primeOne ?? null, kit: s.kit ?? null, sc: s.sc, reason: s.reason, detail: s.detail ?? '', origin: s.origin, originFile: s.originFile, notes: s.notes.map((n) => excerpt(n)) });

/**
 * Lo que la ficha necesita, sin los rastros completos: filas agrupadas (medidas sueltas,
 * color por variante) y conteos por motivo. Una fila con claro y oscuro idénticos se pliega.
 */
export function summarize(result, wrapper, meta = {}) {
    const changed = result.rows.filter((r) => r.status !== 'igual');
    const rowView = (r) => {
        const light = schemeView(r.schemes.light);
        const dark = schemeView(r.schemes.dark);
        const same = light.aura === dark.aura && light.sc === dark.sc && light.reason === dark.reason;
        return { key: r.key, category: r.category, status: r.status, paints: r.paints, same, light, dark };
    };
    const worst = (row) => REASON_RANK.find((reason) => [row.light, row.dark].some((s) => s.reason === reason)) ?? 'igual';

    const byReason = Object.fromEntries(REASON_RANK.map((r) => [r, 0]));
    const views = changed.map(rowView);
    for (const v of views) byReason[worst(v)]++;

    const colorGroups = new Map();
    for (const v of views.filter((x) => x.category === 'color')) {
        const variant = variantOf(v.key, result.name);
        if (!colorGroups.has(variant)) colorGroups.set(variant, []);
        colorGroups.get(variant).push(v);
    }
    const causes = (rows, scheme) => {
        const map = new Map();
        for (const r of rows) {
            const s = r[scheme];
            if (s.reason === 'igual') continue;
            // El Kit y «sin motivo» se cuentan juntos; lo explicado, por su explicación.
            // Tres tokens hermanos (`--sc-bg-primary`, `-hover`, `-active`) comparten comentario: una causa.
            const plain = (s.notes[0] ?? '').replace(/^--sc-[\w-]+: /, '');
            const bare = s.reason === 'kit' || s.reason === 'primeone' || s.reason === 'sin-motivo';
            const id = bare ? s.reason : `${s.reason}|${plain}`;
            if (!map.has(id)) map.set(id, { reason: s.reason, note: bare ? null : s.notes[0] ?? null, originFile: s.originFile, count: 0, examples: [] });
            const c = map.get(id);
            c.count++;
            const pair = `${s.aura} → ${s.sc}`;
            if (c.examples.length < 3 && !c.examples.some((e) => `${e.aura} → ${e.sc}` === pair)) c.examples.push({ key: r.key, aura: s.aura, primeOne: s.primeOne, kit: s.kit, sc: s.sc });
        }
        return [...map.values()].sort((a, b) => REASON_RANK.indexOf(a.reason) - REASON_RANK.indexOf(b.reason));
    };

    return {
        component: result.name,
        meta,
        totals: { keys: result.rows.length, changed: changed.length, byReason, inheritsInAura: views.filter((v) => v.status === 'aura-hereda-nosotros-definimos').length },
        measures: views.filter((v) => v.category !== 'color'),
        color: [...colorGroups.entries()]
            .sort((a, b) => (VARIANTS.indexOf(a[0]) + 1 || 99) - (VARIANTS.indexOf(b[0]) + 1 || 99))
            .map(([variant, rows]) => ({ variant, count: rows.length, light: causes(rows, 'light'), dark: causes(rows, 'dark'), rows })),
        behaviour: result.behaviour.map((r) => ({ ...r, source: { ...r.source, comments: r.source.comments.map((c) => excerpt(c, 600)) } })),
        wrapper
    };
}

const REASON_LABEL = { primeone: 'Heredado de PrimeOne', kit: 'Nuestro Kit', accesibilidad: 'Accesibilidad', 'sin-motivo': '⚠ Sin motivo claro', comentado: 'Explicado en el código', igual: 'Igual' };

/** La misma ficha en Markdown, para comparar formato con la página de sc-docs. */
export function renderMarkdown(s) {
    const L = [];
    const t = s.totals;
    L.push(`# ${s.component} · nuestra capa sobre Aura`, '');
    L.push(`> Generado con \`tools/aura-diff.mjs\` contra Aura ${s.meta.aura} (PrimeNG ${s.meta.primeng}), preset \`${s.meta.presetCommit}\`, export del Kit del ${s.meta.kitExport}.`, '');
    L.push(`**${t.keys}** variables de Aura · **${t.changed}** cambian · Kit ${t.byReason.kit} · accesibilidad ${t.byReason.accesibilidad} · **sin motivo claro ${t.byReason['sin-motivo']}**`, '');
    L.push('## 1 · Tema: medidas y radios', '', '| Clave | Qué pinta | Aura | Nuestro | Por qué |', '|---|---|---|---|---|');
    for (const m of s.measures) L.push(`| \`${m.key}\` | ${m.paints[0] ?? ''} | ${m.light.aura} | **${m.light.sc}** | ${REASON_LABEL[m.light.reason]} |`);
    L.push('', '## 2 · Tema: color, por variante', '');
    for (const g of s.color) {
        L.push(`### ${g.variant} (${g.count})`, '');
        for (const [name, causes] of [['Claro', g.light], ['Oscuro', g.dark]]) {
            for (const c of causes) {
                const ex = c.examples.map((e) => `\`${e.aura}\` → \`${e.sc}\`${c.reason !== 'kit' && e.kit ? ` (Kit \`${e.kit}\`)` : ''}`).join(', ');
                L.push(`- **${name}** · ${REASON_LABEL[c.reason]} · ${c.count}: ${ex}${c.note ? `  \n  _${c.note}_` : ''}`);
            }
        }
        L.push('');
    }
    L.push('## 3 · CSS de comportamiento (`sc-preset/css.ts`)', '');
    for (const r of s.behaviour) {
        L.push(`- \`${r.media.length ? `${r.media.join(' ')} → ` : ''}${r.selectors.join(', ')}\` { ${r.decls.map((d) => `${d.prop}: ${d.light}`).join('; ')} } · css.ts:${r.source.line} (${r.source.name})`);
    }
    if (s.wrapper) {
        L.push('', `## 4 · El envoltorio`, '', `Entradas de \`${s.wrapper.tag}\` que no pasa: ${s.wrapper.primeInputsNotExposed.map((i) => `\`${i}\``).join(', ')}.`);
    }
    return `${L.join('\n')}\n`;
}

// ── CLI ──────────────────────────────────────────────────────────────────────────────────────

function printSummary(result) {
    const changed = result.rows.filter((r) => r.status !== 'igual');
    console.log(`\n${result.name}: ${result.rows.length} claves, ${changed.length} con diferencia\n`);
    for (const r of changed) {
        const l = r.schemes.light;
        const d = r.schemes.dark;
        const both = l.aura === d.aura && l.sc === d.sc;
        const fmt = (x) => `${x.aura ?? '—'} → ${x.sc ?? '—'}  [${x.reason}${x.detail ? `: ${x.detail}` : ''}]`;
        console.log(`  ${r.status.padEnd(30)} ${r.key}`);
        console.log(`      ${both ? 'claro/oscuro' : 'claro'}: ${fmt(l)}`);
        if (!both) console.log(`      oscuro: ${fmt(d)}`);
    }
    console.log(`\nReglas de comportamiento (css.ts): ${result.behaviour.length}`);
    for (const r of result.behaviour) console.log(`  css.ts:${r.source.line ?? '?'} ${r.source.name ?? ''}  ${r.media.join(' ')} ${r.selectors.join(', ')}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    const args = process.argv.slice(2);
    if (args.includes('--list')) {
        const { aura } = await loadPresets();
        console.log(Object.keys(aura.components ?? {}).sort().join('\n'));
    } else {
        const name = args.find((x) => !x.startsWith('--'));
        if (!name) {
            console.error('Uso: node tools/aura-diff.mjs <componente> [--json fichero]');
            process.exit(2);
        }
        const result = await diffComponent(name);
        const jsonAt = args.indexOf('--json');
        if (jsonAt !== -1) writeFileSync(args[jsonAt + 1], `${JSON.stringify(result, null, 2)}\n`);
        const docsAt = args.indexOf('--docs');
        if (docsAt !== -1) {
            const { execSync } = await import('node:child_process');
            const git = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
            const meta = {
                kitExport: git(`git log -1 --format=%ad --date=short -- ${KIT_EXPORT}`),
                presetCommit: git('git rev-parse --short HEAD'),
                aura: JSON.parse(readFileSync(join(ROOT, 'node_modules/@primeuix/themes/package.json'), 'utf8')).version,
                primeng: JSON.parse(readFileSync(join(ROOT, 'node_modules/primeng/package.json'), 'utf8')).version
            };
            const out = args[docsAt + 1];
            const summary = summarize(result, wrapperDiff(name), meta);
            writeFileSync(out, `${JSON.stringify(summary, null, 2)}\n`);
            console.log(`ficha → ${out}`);
            const mdAt = args.indexOf('--md');
            if (mdAt !== -1) {
                writeFileSync(args[mdAt + 1], renderMarkdown(summary));
                console.log(`markdown → ${args[mdAt + 1]}`);
            }
        }
        printSummary(result);
    }
}
