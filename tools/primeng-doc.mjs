#!/usr/bin/env node
/**
 * primeng-doc — la documentación ENTERA de un componente de primeng.dev, antes de meterlo.
 *
 * La regla de Rafa (2026-09-15, DD-113): cuando pide un componente de primeng.dev, se mete el
 * NATIVO tal cual sale en la documentación, con su comportamiento y su movimiento, y solo se adapta
 * con nuestros tokens. Para eso hay que haber leído la documentación completa —capacidades,
 * propiedades, diferencias entre variantes— y no un ejemplo suelto. primeng.dev pinta sus ejemplos
 * con JavaScript, así que leer la web no trae el código: esto lo junta de las fuentes que sí lo tienen.
 *
 *   1. Ejemplos y texto de cada sección: `apps/showcase/doc/<componente>/*.ts` del repo de PrimeNG
 *      (rama principal, por `gh`). Ojo: pueden ir por delante de la versión instalada.
 *   2. API de la versión INSTALADA: `node_modules/primeng/types/primeng-<componente>.d.ts`, con su
 *      descripción, valor por defecto y lo OBSOLETO (un `@deprecated` se usa sin darse cuenta).
 *   3. Movimiento y lo que se oculta o transforma: la hoja del componente (`@primeuix/styles`).
 *   4. Nuestra capa sobre Aura: `tools/aura-diff.mjs <componente>`.
 *
 * Uso:
 *   node tools/primeng-doc.mjs tabs                  # a la salida estándar
 *   node tools/primeng-doc.mjs tabs --out tabs.md    # a un fichero
 *
 * Lo que hacer con ello está en AGENTS.md, «Componentes de primeng.dev». Lo que no se puede
 * saltar sin que se note lo vigila `audit:primeng-coupling` (sección F).
 * Las funciones puras se exportan para su test: `scripts/__tests__/primeng-doc.test.mjs`.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = 'primefaces/primeng';

/** Texto de la sección y código del ejemplo de un `*-doc.ts` del showcase. */
export function seccionDeDoc(ts) {
  const m = ts.match(/template:\s*`([\s\S]*?)`\s*,?\s*\n\s*(?:providers|imports|standalone|changeDetection|\}\))/);
  const plantilla = m ? m[1] : '';
  const texto = [...plantilla.matchAll(/<app-docsectiontext>([\s\S]*?)<\/app-docsectiontext>/g)]
    .map((t) => t[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .join(' ');
  const codigo = plantilla
    .replace(/<app-docsectiontext>[\s\S]*?<\/app-docsectiontext>/g, '')
    .replace(/<app-code[^>]*>\s*<\/app-code>|<app-code[^>]*\/>/g, '')
    .replace(/^\s*\n/gm, '')
    .trimEnd();
  const clase = ts.match(/export class (\w+)\s*\{([\s\S]*)\}\s*$/);
  return { texto, codigo, clase: clase ? clase[2].trim() : '' };
}

/**
 * API de un `.d.ts` de PrimeNG: por cada clase de componente, sus props documentadas
 * (`@group Props`) con descripción, valor por defecto y si está obsoleta, y sus salidas.
 */
export function apiDeTipos(dts) {
  const out = [];
  for (const m of dts.matchAll(/declare class (\w+) extends BaseComponent[^{]*\{([\s\S]*?)\n\}/g)) {
    const [, nombre, cuerpo] = m;
    const props = [];
    for (const p of cuerpo.matchAll(/\/\*\*([\s\S]*?)\*\/\s*\n\s*(?:readonly\s+)?(\w+)\s*:\s*([^;]+);/g)) {
      const [, doc, prop, tipo] = p;
      if (!/@group Props/.test(doc)) continue;
      const lineas = doc.split('\n').map((l) => l.replace(/^\s*\*\s?/, '').trim()).filter(Boolean);
      props.push({
        prop,
        descripcion: lineas.filter((l) => !l.startsWith('@')).join(' '),
        porDefecto: (lineas.find((l) => l.startsWith('@defaultValue')) ?? '').replace('@defaultValue', '').trim(),
        obsoleta: (lineas.find((l) => l.startsWith('@deprecated')) ?? '').replace('@deprecated', '').trim() || null,
        modelo: /ModelSignal/.test(tipo),
      });
    }
    const sel = cuerpo.match(/ɵɵComponentDeclaration<\w+, "([^"]+)"/);
    const salidas = [...(cuerpo.match(/ɵɵComponentDeclaration<[^>]*?\}, \{([^}]*)\}/)?.[1] ?? '').matchAll(/"(\w+)":\s*"(\w+)"/g)].map((s) => s[2]);
    out.push({ nombre, selector: sel ? sel[1] : '', props, salidas });
  }
  return out;
}

/** Líneas de la hoja que dan MOVIMIENTO o ocultan/transforman, con su selector. */
export function movimientoDeEstilo(css) {
  const out = [];
  for (const m of String(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = m[1].replace(/\s+/g, ' ').trim();
    for (const d of m[2].split(';')) {
      const decl = d.replace(/\s+/g, ' ').trim();
      if (/^(transition|animation|transform)\b|display:\s*none|visibility:\s*hidden/.test(decl)) out.push({ selector, decl });
    }
  }
  return out;
}

const gh = (ruta) => JSON.parse(execFileSync('gh', ['api', ruta], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }));

async function main() {
  const [comp] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const iOut = process.argv.indexOf('--out');
  if (!comp) {
    process.stderr.write('Uso: node tools/primeng-doc.mjs <componente> [--out fichero.md]\n');
    process.exit(2);
  }
  const l = [];
  const version = (readFileSync(resolve(ROOT, `node_modules/primeng/fesm2022/primeng-${comp}.mjs`), 'utf8').match(/version: "([\d.]+)"/) ?? [])[1];
  const sha = gh(`repos/${REPO}/commits/master`).sha.slice(0, 7);
  l.push(`# ${comp} — primeng.dev/${comp}, entero`, '');
  l.push(`PrimeNG instalado: ${version ?? '¿?'} · ejemplos de \`${REPO}@${sha}\` (rama principal: pueden ir por delante).`, '');

  l.push('## 1. Secciones de la documentación', '');
  const ficheros = gh(`repos/${REPO}/contents/apps/showcase/doc/${comp}`);
  for (const f of ficheros.filter((x) => x.type === 'file' && x.name.endsWith('-doc.ts'))) {
    const ts = Buffer.from(gh(`repos/${REPO}/contents/apps/showcase/doc/${comp}/${f.name}`).content, 'base64').toString('utf8');
    const s = seccionDeDoc(ts);
    l.push(`### ${f.name.replace('-doc.ts', '')}`, '', s.texto || '(sin texto)', '');
    if (s.codigo.trim()) l.push('```html', s.codigo, '```', '');
    if (s.clase) l.push('```ts', s.clase, '```', '');
  }
  if (ficheros.some((x) => x.type === 'dir' && x.name === 'pt')) l.push('(Tiene sección de pass-through: `apps/showcase/doc/' + comp + '/pt`.)', '');

  l.push('## 2. API de la versión instalada', '');
  const dts = resolve(ROOT, `node_modules/primeng/types/primeng-${comp}.d.ts`);
  if (existsSync(dts)) {
    for (const c of apiDeTipos(readFileSync(dts, 'utf8'))) {
      l.push(`### \`<${c.selector}>\` (${c.nombre})`, '', '| prop | por defecto | qué hace |', '|---|---|---|');
      for (const p of c.props)
        l.push(`| \`${p.prop}\`${p.modelo ? ' (model)' : ''} | ${p.porDefecto || '—'} | ${p.obsoleta ? '⚠️ OBSOLETA: ' + p.obsoleta + ' — ' : ''}${p.descripcion} |`);
      if (c.salidas.length) l.push('', `Salidas: ${c.salidas.map((s) => '`' + s + '`').join(', ')}`);
      l.push('');
    }
  } else l.push(`(no hay ${dts})`, '');

  l.push('## 3. Movimiento y lo que se oculta (hoja del componente)', '');
  try {
    const mod = await import(pathToFileURL(resolve(ROOT, `node_modules/@primeuix/styles/dist/${comp}/index.mjs`)).href);
    const estilo = typeof mod.style === 'function' ? mod.style({ dt: (k) => `dt(${k})` }) : mod.style ?? '';
    const mov = movimientoDeEstilo(estilo);
    for (const m of mov) l.push(`- \`${m.selector}\` → \`${m.decl}\``);
    if (!mov.length) l.push('(sin transiciones ni animaciones propias)');
  } catch (e) {
    l.push(`(no se pudo leer @primeuix/styles/${comp}: ${e.message})`);
  }
  l.push('');

  l.push('## 4. Nuestra capa sobre Aura', '');
  try {
    l.push('```', execFileSync('node', [resolve(ROOT, 'tools/aura-diff.mjs'), comp], { encoding: 'utf8', cwd: ROOT }).trim(), '```', '');
  } catch (e) {
    l.push(`(aura-diff no lo conoce: ${String(e.message).split('\n')[0]})`, '');
  }

  l.push('## Antes de escribir', '');
  l.push('- El nativo tal cual: la plantilla y las props de la sección 1, con el movimiento de la sección 3.');
  l.push('- Ninguna prop OBSOLETA de la sección 2.');
  l.push('- Nuestra capa solo en tokens (sección 4). Un desvío de comportamiento lo para `audit:primeng-coupling` §F.');
  l.push('- Mídelo contra primeng.dev en el navegador (espaciado, estados y movimiento) antes de enseñarlo.');

  const texto = l.join('\n') + '\n';
  if (iOut > 0 && process.argv[iOut + 1]) {
    writeFileSync(process.argv[iOut + 1], texto);
    process.stdout.write(`primeng-doc: ${comp} → ${process.argv[iOut + 1]}\n`);
  } else process.stdout.write(texto);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
