#!/usr/bin/env node
/**
 * Pone en cada proyecto de Cloudflare Pages las rutas que vigila (`path_includes: ['*']` y los
 * `excluye` de `cf-sites.mjs`, DD-117), para que un cambio que no toca un sitio no lo redespliegue
 * ni deje un comentario en el PR. `audit:cf-config` comprueba después que el dashboard coincide.
 *
 * Sin `--aplicar` solo enseña qué cambiaría. Token: `CLOUDFLARE_API_TOKEN` o el OAuth local de
 * wrangler (caduca en una hora: `npx wrangler whoami` lo renueva).
 *
 * Uso:  node scripts/cf-watch-paths.mjs            (en seco)
 *       node scripts/cf-watch-paths.mjs --aplicar
 */
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

import { CUENTA, esperado } from './audit-cf-config.mjs';
import { SITIOS } from './cf-sites.mjs';

const API = 'https://api.cloudflare.com/client/v4';

function token() {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
  const f = resolve(homedir(), '.wrangler/config/default.toml');
  if (!existsSync(f)) return '';
  return readFileSync(f, 'utf8').match(/^(?:oauth_token|api_token)\s*=\s*"([^"]+)"/m)?.[1] ?? '';
}

async function cf(ruta, t, opciones = {}) {
  const r = await fetch(`${API}${ruta}`, {
    ...opciones,
    headers: { authorization: `Bearer ${t}`, 'content-type': 'application/json' },
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.success) throw new Error(`${opciones.method ?? 'GET'} ${ruta} → ${r.status} ${JSON.stringify(d.errors ?? [])}`);
  return d.result;
}

const t = token();
if (!t) {
  console.error('✗ Sin token de Cloudflare (CLOUDFLARE_API_TOKEN o ~/.wrangler/config).');
  process.exit(2);
}
const aplicar = process.argv.includes('--aplicar');
const cuenta = process.env.CLOUDFLARE_ACCOUNT_ID || CUENTA;

for (const sitio of SITIOS) {
  const ruta = `/accounts/${cuenta}/pages/projects/${sitio.proyecto}`;
  const p = await cf(ruta, t);
  const { path_includes, path_excludes } = esperado(sitio);
  const actual = p.source?.config ?? {};
  const igual =
    JSON.stringify([...(actual.path_includes ?? [])].sort()) === JSON.stringify(path_includes) &&
    JSON.stringify([...(actual.path_excludes ?? [])].sort()) === JSON.stringify(path_excludes);
  if (igual) {
    console.log(`✓ ${sitio.proyecto}: ya vigila lo que toca`);
    continue;
  }
  console.log(`${aplicar ? '→' : '·'} ${sitio.proyecto}: ${path_excludes.length} exclusiones (hoy ${actual.path_excludes?.length ?? 0})`);
  if (!aplicar) continue;
  // La configuración de Git se manda ENTERA: rama de producción, comentarios en PR, previews…
  // se conservan tal cual y solo cambian las dos listas.
  const r = await cf(ruta, t, {
    method: 'PATCH',
    body: JSON.stringify({ source: { type: p.source.type, config: { ...actual, path_includes, path_excludes } } }),
  });
  const nuevo = r.source?.config ?? {};
  const ok = JSON.stringify([...(nuevo.path_excludes ?? [])].sort()) === JSON.stringify(path_excludes);
  console.log(`  ${ok ? '✓ aplicado' : '✗ Cloudflare devolvió otra cosa'}`);
  if (!ok) process.exitCode = 1;
}
if (!aplicar) console.log('\nEn seco: nada escrito. Con --aplicar se escribe.');
