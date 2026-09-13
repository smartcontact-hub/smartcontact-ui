#!/usr/bin/env node
/**
 * «Cómo se ve», con capturas de antes y después, para la portada del PR del robot de tokens.
 *
 * Por qué existe (2026-09-14): para fundir con un clic hay que poder MIRAR el cambio sin montar
 * nada. `e2e/tokens-sync/capturas.capture.ts` fotografía el Supervisor de `main` y el del export en
 * el mismo runner (los píxeles no cruzan de máquina); este script compara cada pareja con
 * `pixelmatch`, guarda las que cambian y escribe la sección en Markdown con enlaces a las imágenes.
 *
 * Solo se enseñan las pantallas que cambian. Un export que no mueve ningún píxel lo dice.
 *
 * Uso:
 *   node scripts/tokens-sync-capturas.mjs --dir capturas/ --url-base https://…/carpeta [--md salida.md]
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

/** Parejas `<ruta>--<tema>--antes.png` / `--despues.png` de una carpeta. */
export function parejas(ficheros) {
  const out = new Map();
  for (const f of ficheros) {
    const m = /^(.+)--(claro|oscuro)--(antes|despues)\.png$/.exec(f);
    if (!m) continue;
    const key = `${m[1]}--${m[2]}`;
    if (!out.has(key)) out.set(key, { ruta: m[1].replace(/_/g, '/'), tema: m[2] });
    out.get(key)[m[3]] = f;
  }
  return [...out.values()].filter((p) => p.antes && p.despues);
}

/** Píxeles distintos entre dos PNG del mismo tamaño; un tamaño distinto cuenta como cambio total. */
export function comparar(bufAntes, bufDespues) {
  const a = PNG.sync.read(bufAntes);
  const b = PNG.sync.read(bufDespues);
  if (a.width !== b.width || a.height !== b.height) return { distintos: a.width * a.height, total: a.width * a.height, diff: null };
  const diff = new PNG({ width: a.width, height: a.height });
  // threshold 0.1: el antialias de un texto que no cambia no cuenta; un color de marca sí.
  const distintos = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
  return { distintos, total: a.width * a.height, diff: PNG.sync.write(diff) };
}

export function renderMarkdown(resultados, urlBase) {
  const cambian = resultados.filter((r) => r.distintos > 0);
  const L = ['### Cómo se ve', ''];
  if (!resultados.length) return [...L, '_No hay capturas: mira el run._'].join('\n');
  if (!cambian.length) return [...L, `Ninguna de las ${resultados.length} pantallas cambia un solo píxel (Supervisor a 1440, en claro y en oscuro).`].join('\n');
  L.push(`Cambian ${cambian.length} de ${resultados.length} pantallas del Supervisor (1440, claro y oscuro). Antes a la izquierda, después a la derecha.`, '');
  for (const r of cambian) {
    const pct = ((r.distintos / r.total) * 100).toFixed(1);
    L.push(`<details><summary><b>${r.ruta}</b> · ${r.tema} · ${pct} % de la pantalla</summary>`, '');
    L.push('| Antes | Después |', '|---|---|');
    L.push(`| <img src="${urlBase}/${r.antes}" width="480"> | <img src="${urlBase}/${r.despues}" width="480"> |`);
    L.push('', '</details>');
  }
  return L.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (flag) => {
    const i = process.argv.indexOf(flag);
    return i === -1 ? null : process.argv[i + 1];
  };
  const dir = arg('--dir');
  const urlBase = arg('--url-base') ?? '.';
  const resultados = [];
  for (const p of parejas(readdirSync(dir))) {
    const r = comparar(readFileSync(join(dir, p.antes)), readFileSync(join(dir, p.despues)));
    if (r.diff) writeFileSync(join(dir, p.antes.replace('--antes.png', '--diff.png')), r.diff);
    resultados.push({ ...p, distintos: r.distintos, total: r.total });
  }
  const md = renderMarkdown(resultados, urlBase);
  const out = arg('--md');
  if (out) writeFileSync(out, `${md}\n`);
  else process.stdout.write(`${md}\n`);
  writeFileSync(join(dir, 'resumen.json'), `${JSON.stringify(resultados, null, 2)}\n`);
}
