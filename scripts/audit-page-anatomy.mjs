#!/usr/bin/env node
/**
 * AUDIT · anatomía de página — que el molde compartido siga siendo UNO.
 *
 * Los anchos de página del Supervisor viven en `projects/supervisor/src/styles/_page.scss`
 * (`.page__inner` + arquetipo) y el molde del formulario con rail en ese mismo fichero
 * y en `_forms.scss` (`.page__form`, `.ipanel`). Son reglas GLOBALES, y ahí está la
 * trampa que este gate vigila: una regla encapsulada de componente tiene más
 * especificidad que una global, así que un `max-width` suelto en el SCSS de una página
 * gana en silencio y esa página se desvía del molde sin que nada avise.
 *
 * Ya pasó dos veces, medido el 2026-09-06 (DD-53): la Ola 3 declaró cerrada la deriva
 * de siete anchos y cerró cinco. `1100` seguía vivo declarado tres veces byte a byte en
 * los formularios de agente, grupo y usuario; `78rem` seguía vivo en el constructor de
 * reglas, que además no declaraba arquetipo ninguno.
 *
 * Gatea CUATRO cosas:
 *
 * 1. TODA página declara su arquetipo en la plantilla (`page__inner`, con o sin
 *    modificador). Sin declararlo, el ancho vuelve a ser un número suelto en vez de una
 *    afirmación sobre el tipo de página. Las excepciones van en `EXENTAS`, con su motivo
 *    escrito — una divergencia sin motivo la borra la siguiente pasada de uniformar
 *    (DD-36).
 * 2. El modificador es uno de los que existen, y solo uno.
 * 3. Ninguna página RE-DECLARA el molde compartido (`--with-panel`, `.page__form`,
 *    `.ipanel`) ni pisa el `max-width` de su propio `page__inner`.
 * 4. Los anchos sueltos grandes (≥600px o ≥40rem) fuera del molde son un TRINQUETE por
 *    conteo: la lista solo puede menguar, y muerde en las dos direcciones.
 *
 * NO vigila `.page__heading`: cuatro páginas anulan su margen a propósito y con su
 * medición escrita al lado. Su tamaño ya lo cubre `e2e/supervisor/page-identity.spec.ts`.
 *
 * QUÉ HACER SI SE PONE ROJO:
 *   · «no declara arquetipo» → añade `page__inner` (+ modificador) en la plantilla, o
 *     exímela en `EXENTAS` explicando POR QUÉ es distinta.
 *   · «re-declara el molde» → borra el bloque; vive en `_page.scss` / `_forms.scss`.
 *   · «ancho suelto» → si es el ancho de la página, usa un arquetipo; si es de un
 *     elemento interior, baja de 600px o entra al trinquete con su motivo.
 *
 * ES ESTÁTICO y PURO respecto al texto (funciones exportadas → testeable).
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { sinComentarios } from './audit-api-era.mjs';

const log = (s = '') => process.stdout.write(s + '\n');
const sh = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
};

/** Los arquetipos que existen. Sin modificador = el editor por defecto (1200). */
export const ARQUETIPOS = ['list', 'hub', 'reading', 'with-panel'];

/**
 * Páginas que NO declaran arquetipo, con su motivo. Entrada muerta (el fichero ya no
 * existe, o ya declara arquetipo) = rojo: el gate no guarda excepciones caducadas.
 */
export const EXENTAS = {
  'projects/supervisor/src/app/core/layout/placeholder-page/placeholder-page.component.html':
    'stub de ruta sin contenido: no pinta página, solo ocupa el sitio de una que vendrá',
};

/** Anchos sueltos ≥600px/40rem que quedan fuera del molde (fichero → nº). Solo mengua. */
export const ANCHOS_PENDIENTES = {};

const sinComentariosHtml = (html) => html.replace(/<!--[\s\S]*?-->/g, '');

/** ¿Declara la plantilla su arquetipo, y cuál? */
export function arquetipoDe(html) {
  const limpio = sinComentariosHtml(html);
  const tiene = /\bpage__inner\b/.test(limpio);
  const modificadores = [...new Set([...limpio.matchAll(/\bpage__inner--([a-z-]+)/g)].map((m) => m[1]))];
  return { tiene, modificadores };
}

/** Cuerpo de un bloque `selector { … }` a partir del índice de su llave de apertura. */
function cuerpo(texto, desde) {
  let nivel = 0;
  for (let i = desde; i < texto.length; i += 1) {
    if (texto[i] === '{') nivel += 1;
    else if (texto[i] === '}') {
      nivel -= 1;
      if (nivel === 0) return texto.slice(desde, i);
    }
  }
  return texto.slice(desde);
}

/** Piezas del molde compartido que una página no debe volver a declarar. */
export function redeclaraMolde(scss) {
  const limpio = sinComentarios(scss);
  const encontrados = [];
  if (/&--with-panel\s*\{|\.page__inner--with-panel\s*\{/.test(limpio)) encontrados.push('--with-panel');
  if (/\.page__form\s*\{/.test(limpio)) encontrados.push('.page__form');
  if (/^\s*&__form\s*\{/m.test(limpio) && /\.page\s*\{/.test(limpio)) encontrados.push('.page__form');
  if (/\.ipanel\s*\{/.test(limpio)) encontrados.push('.ipanel');
  return [...new Set(encontrados)];
}

/** `max-width` declarado DENTRO del `page__inner` de una página (pisa su arquetipo). */
export function maxWidthEnInner(scss) {
  const limpio = sinComentarios(scss);
  let n = 0;
  for (const m of limpio.matchAll(/(?:&__inner|\.page__inner)[^{]*\{/g)) {
    const bloque = cuerpo(limpio, m.index + m[0].length - 1);
    n += (bloque.match(/max-width\s*:/g) || []).length;
  }
  return n;
}

/** Anchos grandes sueltos: ≥600px o ≥40rem, fuera de una condición de media query. */
export function anchosSueltos(scss) {
  const limpio = sinComentarios(scss);
  let n = 0;
  for (const linea of limpio.split('\n')) {
    if (linea.includes('@media')) continue;
    const m = linea.match(/max-width\s*:\s*([\d.]+)(px|rem)/);
    if (!m) continue;
    const valor = Number(m[1]);
    if ((m[2] === 'px' && valor >= 600) || (m[2] === 'rem' && valor >= 40)) n += 1;
  }
  return n;
}

/** Revisa UNA página. `scss` puede ser null (plantilla sin hoja hermana). */
export function revisarPagina(ruta, html, scss) {
  const problemas = [];
  const { tiene, modificadores } = arquetipoDe(html);
  const exenta = ruta in EXENTAS;

  if (!tiene && !exenta) {
    problemas.push([
      `${ruta}: no declara arquetipo de página.`,
      '      → añade `page__inner` (+ modificador) en la plantilla, o exímela en EXENTAS con su motivo.',
    ]);
  }
  if (tiene && exenta) {
    problemas.push([
      `${ruta}: está en EXENTAS pero YA declara arquetipo.`,
      '      → quita su entrada de EXENTAS (la excepción caducó).',
    ]);
  }
  for (const mod of modificadores) {
    if (!ARQUETIPOS.includes(mod)) {
      problemas.push([
        `${ruta}: arquetipo desconocido \`page__inner--${mod}\`.`,
        `      → usa uno de: ${ARQUETIPOS.join(' · ')}, o ninguno (editor). Si hace falta otro, nace en _page.scss.`,
      ]);
    }
  }
  if (modificadores.length > 1) {
    problemas.push([
      `${ruta}: declara ${modificadores.length} arquetipos a la vez (${modificadores.join(', ')}).`,
      '      → una página es de UN tipo; elige.',
    ]);
  }
  if (scss) {
    for (const pieza of redeclaraMolde(scss)) {
      problemas.push([
        `${ruta}: re-declara \`${pieza}\`, que es del molde compartido.`,
        '      → bórralo; vive en styles/_page.scss y styles/_forms.scss. Lo scoped le gana a lo global.',
      ]);
    }
    const pisa = maxWidthEnInner(scss);
    if (pisa > 0) {
      problemas.push([
        `${ruta}: ${pisa} \`max-width\` dentro de su propio \`page__inner\`, pisando el arquetipo.`,
        '      → quítalo y declara el arquetipo que corresponda en la plantilla.',
      ]);
    }
  }
  return problemas;
}

/* ── main ──────────────────────────────────────────────────────────────────── */
if (process.argv[1] && process.argv[1].endsWith('audit-page-anatomy.mjs')) {
  const plantillas = sh(
    "find projects/supervisor/src/app/features projects/supervisor/src/app/core/layout " +
      "-name '*-page.component.html' -not -path '*/node_modules/*'",
  )
    .split('\n')
    .filter(Boolean)
    .sort();

  if (!plantillas.length) {
    log('✗ audit:page-anatomy: no encuentro páginas — ¿estás en la raíz del repo?');
    process.exit(1);
  }

  const problemas = [];
  const anchos = {};
  const censo = { editor: 0, exentas: 0 };
  for (const mod of ARQUETIPOS) censo[mod] = 0;

  for (const ruta of plantillas) {
    const html = readFileSync(ruta, 'utf8');
    const rutaScss = ruta.replace(/\.html$/, '.scss');
    let scss = null;
    try {
      scss = readFileSync(rutaScss, 'utf8');
    } catch {
      /* una plantilla puede no tener hoja hermana; no es un problema en sí */
    }

    problemas.push(...revisarPagina(ruta, html, scss));

    const { tiene, modificadores } = arquetipoDe(html);
    if (!tiene) censo.exentas += 1;
    else if (!modificadores.length) censo.editor += 1;
    else if (censo[modificadores[0]] !== undefined) censo[modificadores[0]] += 1;

    if (scss) {
      const sueltos = anchosSueltos(scss);
      if (sueltos > 0) anchos[rutaScss] = sueltos;
    }
  }

  // El trinquete de anchos vive en `audit-screen-hygiene.mjs`, que ya lo tiene probado.
  const { chequearTrinquete } = await import('./audit-screen-hygiene.mjs');
  problemas.push(
    ...chequearTrinquete(
      anchos,
      ANCHOS_PENDIENTES,
      'ancho suelto ≥600px',
      'usa un arquetipo de página en vez de un ancho a mano.',
    ),
  );

  for (const [ruta, motivo] of Object.entries(EXENTAS)) {
    if (!plantillas.includes(ruta)) {
      problemas.push([
        `${ruta}: EXENTAS la cita ("${motivo}") pero el fichero ya no existe.`,
        '      → quita su entrada de EXENTAS.',
      ]);
    }
  }

  log(
    `audit:page-anatomy — ${plantillas.length} página(s): list ${censo.list} · editor ${censo.editor} · ` +
      `hub ${censo.hub} · reading ${censo.reading} · with-panel ${censo['with-panel']} · ` +
      `exentas ${censo.exentas} (trinquete de anchos sueltos: ${Object.keys(ANCHOS_PENDIENTES).length})\n`,
  );

  if (!problemas.length) {
    log(
      '✓ audit:page-anatomy OK — toda página declara su arquetipo, y ninguna re-declara el molde compartido.',
    );
    process.exit(0);
  }

  log('✗ audit:page-anatomy — anatomía de página:');
  for (const [linea, fix] of problemas) {
    log(`  · ${linea}`);
    log(fix);
  }
  process.exit(1);
}
