#!/usr/bin/env node
/**
 * Apunta en GitHub qué está publicado en cada uno de los cinco sitios, DESPUÉS de comprobarlo.
 *
 * El repo ya tuvo una pantalla de *Deployments* mintiendo tres meses (GitHub Pages, retirado en
 * DD-17, seguía figurando como último despliegue). La lección no es "no tengamos la pantalla",
 * es que **un registro que afirma sin medir es peor que no tenerlo**: da una respuesta falsa a
 * quien la pregunta. Por eso esto NO apunta nada al fundir: pide `build.json` a cada sitio
 * (lo deja `stamp-build.mjs`) y espera hasta VER el commit correcto. Si no llega, lo registra
 * como fallo, no como éxito silencioso.
 *
 * Cloudflare despliega por su cuenta al empujar a `main`; esto solo lo observa y lo anota.
 *
 * Uso:  node scripts/record-deploy.mjs <sha>            # comprueba y registra
 *       node scripts/record-deploy.mjs <sha> --dry-run  # solo comprueba, no escribe en GitHub
 */
const REPO = process.env.GITHUB_REPOSITORY ?? 'smartcontact-hub/smartcontact-ui';
const TOKEN = process.env.GITHUB_TOKEN ?? '';
const API = 'https://api.github.com';

const SITIOS = [
  { entorno: 'sc-docs', url: 'https://sc-doc.pages.dev' },
  { entorno: 'supervisor', url: 'https://sc-supervisor.pages.dev' },
  { entorno: 'agent', url: 'https://sc-agent.pages.dev' },
  { entorno: 'cuscare', url: 'https://sc-cuscare.pages.dev' },
  { entorno: 'agent-mini', url: 'https://agent-mini.pages.dev' },
];

// Cloudflare tarda entre uno y varios minutos por sitio, y los construye en paralelo.
const ESPERA_MAX_MS = 20 * 60 * 1000;
const INTERVALO_MS = 30 * 1000;

const sha = process.argv[2];
const dryRun = process.argv.includes('--dry-run');
if (!sha) {
  console.error('Uso: node scripts/record-deploy.mjs <sha> [--dry-run]');
  process.exit(2);
}

async function gh(ruta, opciones = {}) {
  const r = await fetch(`${API}${ruta}`, {
    ...opciones,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${TOKEN}`,
      'content-type': 'application/json',
      ...opciones.headers,
    },
  });
  if (!r.ok) throw new Error(`${opciones.method ?? 'GET'} ${ruta} → ${r.status} ${await r.text()}`);
  return r.json();
}

/** ¿Sirve ya este sitio el commit que buscamos? Devuelve el commit que sirve, o null. */
async function commitServido(url) {
  try {
    // `cache: no-store` + query única: el CDN sirve la marca vieja si se le deja.
    const r = await fetch(`${url}/build.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    return typeof d?.commit === 'string' ? d.commit : null;
  } catch {
    return null; // sitio caído o a medio desplegar: se reintenta
  }
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const pendientes = new Map(SITIOS.map((s) => [s.entorno, s]));
  const resultado = new Map();
  const hasta = Date.now() + ESPERA_MAX_MS;

  console.log(`Esperando a que los ${SITIOS.length} sitios sirvan ${sha.slice(0, 7)}…\n`);
  while (pendientes.size > 0 && Date.now() < hasta) {
    for (const [entorno, sitio] of [...pendientes]) {
      const servido = await commitServido(sitio.url);
      if (servido === sha) {
        console.log(`✓ ${entorno} sirve ${sha.slice(0, 7)}  (${sitio.url})`);
        resultado.set(entorno, { ...sitio, ok: true });
        pendientes.delete(entorno);
      } else if (servido) {
        console.log(`… ${entorno} todavía en ${servido.slice(0, 7)}`);
      } else {
        console.log(`… ${entorno} sin marca legible`);
      }
    }
    if (pendientes.size > 0) await espera(INTERVALO_MS);
  }
  for (const [entorno, sitio] of pendientes) {
    console.log(`✗ ${entorno} NO llegó a servir ${sha.slice(0, 7)} en 20 min`);
    resultado.set(entorno, { ...sitio, ok: false });
  }

  if (dryRun) {
    console.log('\nDry-run: no se escribe nada en GitHub.');
    process.exit([...resultado.values()].every((r) => r.ok) ? 0 : 1);
  }

  for (const [entorno, r] of resultado) {
    const dep = await gh(`/repos/${REPO}/deployments`, {
      method: 'POST',
      body: JSON.stringify({
        ref: sha,
        environment: entorno,
        description: `Cloudflare Pages · ${r.url}`,
        auto_merge: false,
        required_contexts: [], // ya lo comprobamos nosotros, midiendo el sitio
        transient_environment: false,
      }),
    });
    await gh(`/repos/${REPO}/deployments/${dep.id}/statuses`, {
      method: 'POST',
      body: JSON.stringify({
        state: r.ok ? 'success' : 'failure',
        environment_url: r.url,
        description: r.ok ? 'Verificado: el sitio sirve este commit' : 'No sirvió este commit en 20 min',
      }),
    });
    console.log(`${r.ok ? '✓' : '✗'} registrado ${entorno}`);
  }

  const fallos = [...resultado.values()].filter((r) => !r.ok).length;
  if (fallos) {
    console.error(`\n${fallos} sitio(s) sin confirmar. El registro lo dice; no se ha apuntado como bueno.`);
    process.exit(1);
  }
  console.log('\n✓ Los 5 sitios confirmados y registrados.');
}

main().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});
