#!/usr/bin/env node
/**
 * LA RED QUE HAY QUE MONTAR ANTES DE TOCAR TIPOGRAFÍA (LEARNINGS #16).
 *
 * Recorre una app servida, abre cada ruta que encuentre y anota, por cada elemento con texto
 * PROPIO, los ejes que un barrido de tipografía puede mover sin querer: tamaño, interlineado,
 * peso, familia, tracking, márgenes y caja. Después se comparan las dos pasadas y el barrido
 * tiene que salir con las diferencias que predijo, ni una más.
 *
 * POR QUÉ VIVE AQUÍ Y NO EN EL SCRATCHPAD. Se ha reescrito al menos tres veces (el barrido del
 * #111, el del #115 y el de sc-docs), cada vez desde cero y cada vez con sus propios sesgos. Un
 * instrumento que se reinventa en cada sesión no acumula las lecciones de la anterior.
 *
 * ⚠️ Lo que hace fiable la comparación:
 *   · **texto PROPIO, no `textContent`**: un contenedor repite el texto de sus hijos y un cambio
 *     saldría contado N veces;
 *   · **clave estable por (ruta, selector, texto, ordinal)**: sin el ordinal, dos filas iguales
 *     de una tabla se pisan y el diff miente;
 *   · **el selector ignora `ng-*` y `sc-text-*`**: si llevara la clase migrada, TODO cambiaría de
 *     clave y el diff saldría vacío por construcción — un verde falso de manual;
 *   · **mide el ruido primero**: dos pasadas sobre el MISMO build tienen que dar 0 diferencias.
 *     Si no, lo que sobra es el instrumento y no hay nada que medir.
 *
 * Uso:
 *   node tools/text-census.mjs antes.json --url http://localhost:4288 [--hash] [--max 70]
 *   node tools/text-census.mjs --diff antes.json despues.json
 *
 * `--hash` para apps que enrutan por `#/` (sc-docs). Sin él, rutas por path (supervisor).
 */
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const flag = (n, d) => {
  const i = argv.indexOf(n);
  return i >= 0 ? argv[i + 1] : d;
};

/** Los ejes que se comparan. Un barrido de tipografía puede mover cualquiera de ellos. */
const EJES = ['fontSize', 'lineHeight', 'fontWeight', 'fontFamily', 'letterSpacing', 'mt', 'mb', 'x', 'y', 'w', 'h'];

if (argv[0] === '--diff') {
  const [a, b] = [argv[1], argv[2]].map((p) => JSON.parse(readFileSync(p, 'utf8')));
  const A = new Map(a.map((r) => [r.key, r]));
  const B = new Map(b.map((r) => [r.key, r]));
  const cambios = [];
  for (const [k, ra] of A) {
    const rb = B.get(k);
    if (!rb) { cambios.push({ que: 'DESAPARECE', key: k, ruta: ra.ruta, sel: ra.sel, texto: ra.texto }); continue; }
    const d = {};
    for (const e of EJES) if (String(ra[e]) !== String(rb[e])) d[e] = [ra[e], rb[e]];
    if (Object.keys(d).length) cambios.push({ que: 'CAMBIA', ruta: ra.ruta, sel: ra.sel, texto: ra.texto, delta: d });
  }
  for (const k of B.keys()) if (!A.has(k)) cambios.push({ que: 'NUEVO', key: k });
  const porEje = {};
  for (const c of cambios) for (const e of Object.keys(c.delta ?? {})) porEje[e] = (porEje[e] ?? 0) + 1;
  console.log(`A ${a.length} textos · B ${b.length} · ${cambios.length} diferencia(s) · por eje ${JSON.stringify(porEje)}`);
  for (const c of cambios.slice(0, 600)) {
    console.log(c.que === 'CAMBIA' ? `  ${c.ruta} ${c.sel} «${c.texto}» ${JSON.stringify(c.delta)}` : `  ${c.que} ${c.ruta ?? c.key} ${c.sel ?? ''} «${c.texto ?? ''}»`);
  }
  process.exit(0);
}

const salida = argv[0];
if (!salida || salida.startsWith('--')) {
  console.error('Uso: node tools/text-census.mjs <salida.json> --url <base> [--hash] [--max N]');
  process.exit(1);
}
const base = flag('--url', process.env.SC_DOCS_URL ?? 'http://localhost:4288').replace(/\/$/, '');
const hash = argv.includes('--hash');
const MAX = Number(flag('--max', '70'));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await ctx.addInitScript(() => {
  try { localStorage.setItem('sc-theme', 'light'); } catch { /* modo privado */ }
  const s = document.createElement('style');
  s.textContent = '*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important;}';
  document.addEventListener('DOMContentLoaded', () => document.head.append(s));
});
const page = await ctx.newPage();
const filas = [];
const vistas = new Set();
const cola = [hash ? '#/' : '/'];

const censar = async (ruta) => {
  const rows = await page.evaluate(() => {
    const out = [];
    const sel = (el) => {
      const p = [];
      let e = el;
      while (e && e !== document.body && p.length < 5) {
        const cls = [...e.classList].filter((c) => !/^(ng-|sc-text-)/.test(c)).slice(0, 2).join('.');
        p.unshift(e.tagName.toLowerCase() + (cls ? `.${cls}` : ''));
        e = e.parentElement;
      }
      return p.join('>');
    };
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let el;
    while ((el = w.nextNode())) {
      const propio = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').replace(/\s+/g, ' ').trim();
      if (!propio) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) continue;
      out.push({
        sel: sel(el), texto: propio.slice(0, 36),
        fontSize: cs.fontSize, lineHeight: cs.lineHeight, fontWeight: cs.fontWeight,
        fontFamily: cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(), letterSpacing: cs.letterSpacing,
        mt: cs.marginTop, mb: cs.marginBottom,
        x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
      });
    }
    return out;
  });
  const n = new Map();
  for (const r of rows) {
    const k0 = `${ruta}|${r.sel}|${r.texto}`;
    const c = (n.get(k0) ?? 0) + 1;
    n.set(k0, c);
    filas.push({ key: `${k0}#${c}`, ruta, ...r });
  }
  return rows.length;
};

while (cola.length && vistas.size < MAX) {
  const r = cola.shift();
  if (vistas.has(r)) continue;
  vistas.add(r);
  try {
    await page.goto(hash ? `${base}/${r}` : `${base}${r}`, { waitUntil: 'load' });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => undefined);
    await page.mouse.move(720, 8); // fuera de la barra lateral, que se expande al hover
    await page.waitForTimeout(350);
    const n = await censar(r);
    process.stderr.write(`  ${r}  ${n}\n`);
    const hrefs = await page.evaluate((conHash) =>
      [...document.querySelectorAll('a[href]')]
        .map((a) => a.getAttribute('href'))
        .filter((h) => h && (conHash ? h.startsWith('#/') : h.startsWith('/') && !h.startsWith('//'))),
      hash,
    );
    for (const h of hrefs) if (!vistas.has(h)) cola.push(h);
  } catch (e) {
    process.stderr.write(`  ✗ ${r}: ${e.message.split('\n')[0]}\n`);
  }
}
await browser.close();
writeFileSync(salida, JSON.stringify(filas, null, 1));
console.log(`${vistas.size} rutas · ${filas.length} textos → ${salida}`);
