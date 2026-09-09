#!/usr/bin/env node
/**
 * Comprueba que los cinco proyectos de Cloudflare Pages siguen configurados como el repo espera.
 *
 * Cuatro ajustes viven SOLO en el dashboard de Cloudflare y ningún gate del repo los ve: el
 * comando de build, el directorio de salida, la rama de producción y la variable
 * `NODE_VERSION`. Cualquiera de ellos rompe todos los commits por igual y en silencio. El caso
 * que motivó esto (2026-09-09): el comando de supervisor era un `ng build` suelto en vez de
 * `npm run build:supervisor`, así que nunca escribía `build.json` y `deploy-record` lo marcaba
 * en rojo aunque el sitio sirviera el commit correcto. Ver DD-59.
 *
 * Token: `CLOUDFLARE_API_TOKEN` (CI) o, en local, el OAuth de wrangler
 * (`~/.wrangler/config/default.toml`). Sin ninguno de los dos NO se afirma nada: sale con 2 y
 * lo dice, para que quien lo lea no confunda «no comprobado» con «bien».
 *
 * Uso: node scripts/audit-cf-config.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const API = 'https://api.cloudflare.com/client/v4';

/**
 * app del repo → proyecto en Cloudflare → script de package.json que la construye. Ni los
 * proyectos ni los scripts siguen un patrón (sc-docs se construye con `build:docs`), así que el
 * mapa es explícito y el test comprueba que cada script existe.
 */
export const PROYECTOS = [
  { app: 'sc-docs', proyecto: 'sc-doc', script: 'build:docs' },
  { app: 'supervisor', proyecto: 'sc-supervisor', script: 'build:supervisor' },
  { app: 'agent', proyecto: 'sc-agent', script: 'build:agent' },
  { app: 'cuscare', proyecto: 'sc-cuscare', script: 'build:cuscare' },
  { app: 'agent-mini', proyecto: 'agent-mini', script: 'build:agent-mini' },
];

/** Lo que el repo espera de cada proyecto. Todos los `build:*` terminan en `stamp-build.mjs`. */
export function esperado({ app, script }) {
  return {
    build_command: `npm run ${script}`,
    destination_dir: `dist/${app}/browser`,
    production_branch: 'main',
  };
}

/**
 * Compara un proyecto (tal como lo devuelve la API) con lo esperado. Devuelve una lista de
 * desviaciones legibles; vacía = bien. Función pura: es lo que se prueba.
 */
export function evaluar(entrada, proyecto) {
  const e = esperado(entrada);
  const fallos = [];
  const bc = proyecto?.build_config ?? {};
  if (bc.build_command !== e.build_command) {
    fallos.push(
      `build command es «${bc.build_command ?? '(vacío)'}», debe ser «${e.build_command}» ` +
        `(sin él no hay build.json y deploy-record lo marca en rojo)`,
    );
  }
  if (bc.destination_dir !== e.destination_dir) {
    fallos.push(`output dir es «${bc.destination_dir ?? '(vacío)'}», debe ser «${e.destination_dir}»`);
  }
  if (proyecto?.production_branch !== e.production_branch) {
    fallos.push(
      `production branch es «${proyecto?.production_branch ?? '(vacío)'}», debe ser «main» ` +
        `(una rama de feature se borra al fundir y el proyecto queda huérfano)`,
    );
  }
  const env = proyecto?.deployment_configs?.production?.env_vars ?? {};
  if (env && Object.prototype.hasOwnProperty.call(env, 'NODE_VERSION')) {
    fallos.push(
      `tiene la variable NODE_VERSION («${env.NODE_VERSION?.value ?? '?'}»), y pisa .node-version del repo`,
    );
  }
  return fallos;
}

function tokenLocal() {
  const f = resolve(homedir(), '.wrangler/config/default.toml');
  if (!existsSync(f)) return '';
  const m = readFileSync(f, 'utf8').match(/^(?:oauth_token|api_token)\s*=\s*"([^"]+)"/m);
  return m?.[1] ?? '';
}

async function cf(ruta, token) {
  const r = await fetch(`${API}${ruta}`, { headers: { authorization: `Bearer ${token}` } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.success) {
    throw new Error(`${ruta} → ${r.status} ${JSON.stringify(d.errors ?? [])}`);
  }
  return d.result;
}

async function main() {
  const token = process.env.CLOUDFLARE_API_TOKEN || tokenLocal();
  if (!token) {
    console.error('✗ Sin token de Cloudflare (CLOUDFLARE_API_TOKEN o ~/.wrangler/config): NO comprobado.');
    process.exit(2);
  }
  const cuentas = await cf('/accounts', token).catch((e) => {
    // El OAuth de wrangler caduca en una hora y solo se refresca al usar wrangler.
    if (!process.env.CLOUDFLARE_API_TOKEN && /403|9109/.test(e.message)) {
      throw new Error(`${e.message}\n  El token local de wrangler ha caducado: corre «npx wrangler whoami» y repite.`);
    }
    throw e;
  });
  const cuenta = process.env.CLOUDFLARE_ACCOUNT_ID || cuentas[0]?.id;
  if (!cuenta) throw new Error('El token no ve ninguna cuenta.');

  let total = 0;
  for (const entrada of PROYECTOS) {
    const { proyecto } = entrada;
    const p = await cf(`/accounts/${cuenta}/pages/projects/${proyecto}`, token);
    const fallos = evaluar(entrada, p);
    total += fallos.length;
    if (fallos.length === 0) console.log(`✓ ${proyecto}`);
    for (const f of fallos) console.log(`✗ ${proyecto}: ${f}`);
  }
  if (total) {
    console.error(`\n${total} desviación(es) en el dashboard de Cloudflare. Se corrige allí o por API (PATCH pages/projects/<proyecto>).`);
    process.exit(1);
  }
  console.log('\n✓ Los 5 proyectos de Cloudflare están como el repo espera.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`✗ ${e.message}`);
    process.exit(2);
  });
}
