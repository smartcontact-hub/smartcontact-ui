#!/usr/bin/env node
/**
 * AUDIT · higiene de pantalla — dos reglas de la página «Fundamentos → Patrones»
 * que hasta ahora SOLO vivían en la doc (AGENTS.md §UX de pantalla). Un principio
 * que no tiene gate se pudre: esto lo convierte en un chequeo.
 *
 * Gatea DOS cosas, ambas como TRINQUETE por conteo (el mismo patrón que
 * `audit:api-era`: la lista solo puede MENGUAR, y muerde en las dos direcciones):
 *
 * 1. EMOJIS EN LA INTERFAZ. Los iconos salen de `<sc-icon>` (Material Symbols); un
 *    emoji suelto rompe ese único idioma visual. Se marcan solo los del PLANO ASTRAL
 *    pictográfico (U+1F000–U+1FAFF) y el selector de presentación emoji (U+FE0F):
 *    ahí viven las caras, banderas, objetos y símbolos "de emoji". Se EXCLUYEN a
 *    propósito las flechas (→ ← ↑ ↓, U+2190–21FF) y los signos BMP (✓ ⚠ ★ ☑…): son
 *    tipografía/estructura, este repo los usa a mansalva en comentarios y logs, y
 *    meterlos daría cientos de falsos positivos. Los comentarios se quitan antes de
 *    mirar (un `🎭 DEMO-ONLY` en una cabecera no es interfaz).
 *
 * 2. IMÁGENES SIN DIMENSIONES. `<img>` / `<iframe>` sin `width`+`height` ni
 *    `aspect-ratio` dejan que el navegador calcule el hueco AL cargar → salto de
 *    layout (CLS). La regla pide reservar el hueco antes: dimensiones explícitas o
 *    `aspect-ratio` (bindings incluidos). CSS/SCSS no cuenta: no reserva alto antes
 *    de que cargue la imagen, que es justo lo que causa el salto.
 *
 * QUÉ HACER SI SE PONE ROJO:
 *   · «nuevo incumplimiento» → arréglalo (usa `<sc-icon>` en vez del emoji; añade
 *     `width`/`height` o `aspect-ratio` a la imagen). NO lo añadas al trinquete.
 *   · «bajó a N» → enhorabuena, arreglaste uno: actualiza el número en la lista de
 *     abajo (el trinquete avanza).
 *   · «ya está a 0» → quita la entrada del trinquete.
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

/**
 * Emoji pictográfico: plano astral + selector de presentación emoji. NO flechas ni signos BMP.
 * FE0F va en una alternación (no dentro de `[...]`): es un carácter combinante y meterlo en una
 * clase es ambiguo (regla `no-misleading-character-class`); suelto cuenta la secuencia de emoji.
 */
export const EMOJI_RE = /[\u{1F000}-\u{1FAFF}]|\u{FE0F}/gu;

const sinComentariosHtml = (html) => html.replace(/<!--[\s\S]*?-->/g, '');

/** Cuenta emojis (astral) en el TEXTO RENDERIZABLE de un fichero (sin comentarios). */
export function contarEmojis(texto, esHtml) {
  const limpio = esHtml ? sinComentariosHtml(texto) : sinComentarios(texto);
  const m = limpio.match(EMOJI_RE);
  return m ? m.length : 0;
}

/** Cuenta `<img>`/`<iframe>` sin dimensiones explícitas ni aspect-ratio. */
export function contarImgSinDims(texto) {
  let malas = 0;
  for (const tag of ['img', 'iframe']) {
    const re = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
    let m;
    while ((m = re.exec(texto))) {
      const t = m[0];
      const hasWH = /\bwidth\s*=/.test(t) && /\bheight\s*=/.test(t);
      const hasBind = /\[(?:style\.|attr\.)?width\]/.test(t) && /\[(?:style\.|attr\.)?height\]/.test(t);
      const hasAR = /aspect-ratio/.test(t);
      if (!(hasWH || hasBind || hasAR)) malas++;
    }
  }
  return malas;
}

/**
 * TRINQUETE de emojis (fichero → nº de emojis astral que renderiza HOY). Solo mengua.
 * Todo lo que hay son BANDERAS de idioma; la solución definitiva es un flag SVG
 * (el propio seed de cuscare ya trae `src: 'icons/flags/*.svg'` al lado).
 */
export const EMOJI_PENDIENTES = {
  // Banderas de idioma (regional indicators: cada 🇪🇸 son 2 codepoints). Deuda real:
  // sustituir por flag SVG (el seed de cuscare ya trae `src: 'icons/flags/*.svg'`).
  'projects/cuscare/src/app/data/seed.ts': 20,
  'projects/supervisor/src/app/features/config/pages/sistema-page.component.ts': 8,
  // (Los 2 emoji decorativos que había —⚠️ en un demo y ⏸️ en un modal— ya se
  //  sustituyeron por <sc-icon> / se quitaron; por eso el trinquete bajó a 2 ficheros.)
};

/** TRINQUETE de imágenes sin dimensiones (fichero → nº). Solo mengua. */
export const IMG_PENDIENTES = {
  'projects/agent/src/app/components/agent-header/agent-header.component.ts': 1,
  'projects/agent/src/app/components/profile-card/profile-card.component.ts': 1,
  'projects/cuscare/src/app/core/layout/app-shell/nav-icon.component.ts': 1,
  'projects/sc-docs/src/app/pages/lab/lab.component.html': 2,
  'projects/sc-docs/src/app/pages/reglas/rules-walkthrough.component.html': 7,
  'projects/sc-docs/src/app/pages/uso/usage-gallery.component.html': 2,
  'projects/supervisor/src/app/core/layout/sidebar/sidebar.component.html': 1,
  'projects/supervisor/src/app/shared/components/illustrated-avatar/illustrated-avatar.component.html': 2,
  'projects/ui-smartcontact/src/lib/components/avatar/sc-avatar.component.ts': 1,
  'projects/ui-smartcontact/src/lib/components/photo-upload/sc-photo-upload.component.html': 2,
};

/** Compara el estado medido contra un trinquete. Devuelve la lista de problemas. */
export function chequearTrinquete(actual, congelado, etiqueta, comoArreglar) {
  const problemas = [];
  for (const [file, n] of Object.entries(actual)) {
    const base = congelado[file] ?? 0;
    if (n > base) {
      problemas.push([
        `${file}: ${n} ${etiqueta} (congelado ${base}). Nuevo(s) incumplimiento(s).`,
        `      → ${comoArreglar} La lista NO crece.`,
      ]);
    } else if (n < base) {
      problemas.push([
        `${file}: bajó a ${n} ${etiqueta} (congelado ${base}).`,
        `      → actualiza el número en el trinquete (avanza).`,
      ]);
    }
  }
  for (const [file, base] of Object.entries(congelado)) {
    if (!(file in actual) && base > 0) {
      problemas.push([
        `${file}: el trinquete cita ${base} ${etiqueta}, pero ya no hay ninguno.`,
        `      → quita su entrada del trinquete.`,
      ]);
    }
  }
  return problemas;
}

/* ── main ──────────────────────────────────────────────────────────────────── */
if (process.argv[1] && process.argv[1].endsWith('audit-screen-hygiene.mjs')) {
  const ficheros = sh(
    "find projects -path '*/src/*' \\( -name '*.html' -o -name '*.ts' \\) -not -path '*/node_modules/*'",
  )
    .split('\n')
    .filter(Boolean)
    .sort();

  if (!ficheros.length) {
    log('✗ audit:screen-hygiene: no encuentro plantillas — ¿estás en la raíz del repo?');
    process.exit(1);
  }

  const emojis = {};
  const imgs = {};
  for (const f of ficheros) {
    const src = readFileSync(f, 'utf8');
    const e = contarEmojis(src, f.endsWith('.html'));
    if (e > 0) emojis[f] = e;
    const i = contarImgSinDims(src);
    if (i > 0) imgs[f] = i;
  }

  const problemas = [
    ...chequearTrinquete(emojis, EMOJI_PENDIENTES, 'emoji', 'usa <sc-icon> (o un flag SVG) en vez del emoji.'),
    ...chequearTrinquete(imgs, IMG_PENDIENTES, 'img/iframe sin dims', 'añade width+height o aspect-ratio.'),
  ];

  const totEmoji = Object.values(emojis).reduce((a, b) => a + b, 0);
  const totImg = Object.values(imgs).reduce((a, b) => a + b, 0);
  log(
    `audit:screen-hygiene — ${ficheros.length} plantilla(s): ${totEmoji} emoji astral en ` +
      `${Object.keys(emojis).length} fichero(s), ${totImg} img/iframe sin dims en ${Object.keys(imgs).length} ` +
      `(trinquetes: emoji ${Object.keys(EMOJI_PENDIENTES).length}, img ${Object.keys(IMG_PENDIENTES).length})\n`,
  );

  if (!problemas.length) {
    log('✓ audit:screen-hygiene OK — sin emojis nuevos en la interfaz y ninguna imagen nueva sin reservar su hueco.');
    process.exit(0);
  }

  log('✗ audit:screen-hygiene — higiene de pantalla:');
  for (const [linea, fix] of problemas) {
    log(`  · ${linea}`);
    log(fix);
  }
  process.exit(1);
}
