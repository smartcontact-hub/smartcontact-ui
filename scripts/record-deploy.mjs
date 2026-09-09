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
 * Y solo construye el ÚLTIMO commit encolado de cada rama: si entra otro mientras el tuyo
 * espera, el tuyo queda `skipped` y **no se sirve nunca**. Esperarlo 20 minutos y apuntarlo en
 * rojo era exactamente el fallo que este script existe para no cometer: un rojo permanente
 * sobre algo que no está roto. Por eso, antes de concluir, se mira si `main` ya lo ha
 * adelantado (DD-64).
 *
 * Uso:  node scripts/record-deploy.mjs <sha>            # comprueba y registra
 *       node scripts/record-deploy.mjs <sha> --dry-run  # solo comprueba, no escribe en GitHub
 */
import { pathToFileURL } from 'node:url';

const REPO = process.env.GITHUB_REPOSITORY ?? 'smartcontact-hub/smartcontact-ui';
const TOKEN = process.env.GITHUB_TOKEN ?? '';
const API = 'https://api.github.com';

export const SITIOS = [
  { entorno: 'sc-docs', url: 'https://sc-doc.pages.dev' },
  { entorno: 'supervisor', url: 'https://sc-supervisor.pages.dev' },
  { entorno: 'agent', url: 'https://sc-agent.pages.dev' },
  { entorno: 'cuscare', url: 'https://sc-cuscare.pages.dev' },
  { entorno: 'agent-mini', url: 'https://agent-mini.pages.dev' },
];

// Cloudflare NO los construye en paralelo: medido el 2026-09-10 sobre 87 builds seguidos de la
// cuenta, la concurrencia máxima observada fue **1**. Construir cada sitio cuesta ~70 s, pero
// cada empujón encola 5 (uno por sitio) y cada rama de trabajo encola otros 5, así que la
// espera del último sitio la manda la COLA, no el build: mediana de 885 s de cola por
// despliegue ese día, máximo 1.272 s. Con 20 minutos, un empujón con una rama vecina
// construyendo salía rojo sirviendo bien. 35 deja margen sobre lo medido sin tapar una caída.
const ESPERA_MAX_MS = 35 * 60 * 1000;
const INTERVALO_MS = 30 * 1000;
const MINUTOS_ESPERA = Math.round(ESPERA_MAX_MS / 60000);

async function gh(ruta, opciones = {}) {
  const r = await fetch(`${API}${ruta}`, {
    ...opciones,
    headers: {
      accept: 'application/vnd.github+json',
      // Sin token, la cabecera NO se manda: un `Bearer ` vacío es un 401, y la lectura pública
      // (la cabeza de main, en un repo público) funciona sin credenciales. Escribir sí las pide.
      ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
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

/** La cabeza de una rama, o `null` si no se puede leer (sin dato no se concluye nada). */
async function cabezaDe(rama = 'main') {
  try {
    const d = await gh(`/repos/${REPO}/commits/${rama}`);
    return typeof d?.sha === 'string' ? d.sha : null;
  } catch {
    return null;
  }
}

/**
 * Cómo está `cabeza` respecto a `sha`, según GitHub: `ahead` (la cabeza desciende del commit
 * que esperamos), `behind`, `identical` o `diverged`. `null` si no se puede leer.
 */
async function relacionConCabeza(sha, cabeza) {
  try {
    const d = await gh(`/repos/${REPO}/compare/${sha}...${cabeza}`);
    return typeof d?.status === 'string' ? d.status : null;
  } catch {
    return null;
  }
}

/**
 * ¿Se está esperando a un commit que main ya ha adelantado? Devuelve el motivo legible, o
 * `null` si toca seguir esperando. Función pura: es lo que se prueba.
 *
 * El caso que la motiva (2026-09-10): tres commits seguidos a main en 7 minutos
 * (`8cc9bce`, `287f075`, `7812c38`). Cloudflare marcó `skipped` los tres builds de producción
 * al entrar el siguiente, así que ninguno de los cinco sitios llegó a servirlos jamás, y este
 * registro escribió **15 despliegues rojos** que no podían volverse verdes nunca. Un commit
 * adelantado no es un despliegue roto: no se registra, y lo registra la comprobación del que
 * quedó arriba.
 *
 * `relacion` es lo que impide el fallo simétrico, y por eso no basta con comparar los dos shas:
 * este job arranca **segundos** después del empujón, y si la API contestara todavía con el
 * commit anterior, «distinto de la cabeza» significaría «adelantado» y el despliegue bueno se
 * quedaría **sin registrar en silencio**. Solo se concluye con `ahead` (la cabeza desciende de
 * nuestro commit) o `diverged` (nuestro commit ya no está en main: tampoco se va a servir).
 */
export function supersesion(sha, cabeza, relacion) {
  if (!cabeza) return null; // no se pudo leer main: se sigue esperando, no se inventa
  if (cabeza === sha) return null;
  if (relacion !== 'ahead' && relacion !== 'diverged') return null; // sin ancestría, no se afirma
  const causa =
    relacion === 'ahead'
      ? `main ya está en ${cabeza.slice(0, 7)}`
      : `${sha.slice(0, 7)} ya no está en main (la rama divergió; cabeza: ${cabeza.slice(0, 7)})`;
  return (
    `${causa}: Cloudflare deja en «skipped» el build encolado de ${sha.slice(0, 7)}, que por ` +
    `tanto no llegará a servirse. No se registra nada de este commit; lo registra la ` +
    `comprobación de ${cabeza.slice(0, 7)}.`
  );
}

/** Las dos llamadas juntas: la cabeza de main y cómo está respecto a lo que esperamos. */
let avisadoSinCabeza = false;
async function adelantadoPorMain(sha) {
  const cabeza = await cabezaDe();
  if (!cabeza) {
    // Sin este dato el script vuelve a lo de antes: esperar la ventana entera y apuntar rojo.
    // Que se vea en el log, para que ese rojo no sea un misterio. (En local sin `GITHUB_TOKEN`
    // son 60 llamadas/hora anónimas; en el CI, las del `GITHUB_TOKEN` del job.)
    if (!avisadoSinCabeza) {
      avisadoSinCabeza = true;
      console.log('⚠ no se puede leer la cabeza de main (¿límite de la API?): no se podrá saber si este commit ha sido adelantado.');
    }
    return null;
  }
  if (cabeza === sha) return null;
  return supersesion(sha, cabeza, await relacionConCabeza(sha, cabeza));
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const sha = process.argv[2];
  const dryRun = process.argv.includes('--dry-run');
  if (!sha) {
    console.error('Uso: node scripts/record-deploy.mjs <sha> [--dry-run]');
    process.exit(2);
  }

  const adelantado = await adelantadoPorMain(sha);
  if (adelantado) {
    console.log(`↷ ${adelantado}`);
    return;
  }

  const pendientes = new Map(SITIOS.map((s) => [s.entorno, s]));
  const resultado = new Map();
  const conMarca = new Set(); // entornos que han mostrado ALGUNA marca, aunque vieja
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
        conMarca.add(entorno); // alguna vez tuvo marca: el sello existe, solo va tarde
        console.log(`… ${entorno} todavía en ${servido.slice(0, 7)}`);
      } else {
        console.log(`… ${entorno} sin marca legible`);
      }
    }
    if (pendientes.size === 0) break;
    // Un empujón nuevo a main mientras esperamos convierte esta espera en una espera a algo
    // que Cloudflare ya ha descartado. Se mira en cada vuelta, no solo al empezar.
    const adelantadoAhora = await adelantadoPorMain(sha);
    if (adelantadoAhora) {
      console.log(`\n↷ ${adelantadoAhora}`);
      return;
    }
    await espera(INTERVALO_MS);
  }
  for (const [entorno, sitio] of pendientes) {
    console.log(`✗ ${entorno} NO llegó a servir ${sha.slice(0, 7)} en ${MINUTOS_ESPERA} min`);
    // Sin marca en toda la ventana casi nunca es un despliegue lento: es que el build de Cloudflare
    // no pasa por `stamp-build.mjs` (supervisor, 2026-09-09: un `ng build` suelto publicaba
    // bien y sin sello). Que el rojo diga dónde mirar.
    if (!conMarca.has(entorno)) {
      console.log(`  ${entorno} nunca sirvió un build.json legible: mira el build command del proyecto en Cloudflare (npm run audit:cf-config).`);
    }
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
        description: r.ok
          ? 'Verificado: el sitio sirve este commit'
          : `No sirvió este commit en ${MINUTOS_ESPERA} min`,
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  });
}
