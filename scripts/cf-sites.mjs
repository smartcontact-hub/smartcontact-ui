#!/usr/bin/env node
/**
 * Los cinco sitios de Cloudflare Pages, en UN solo sitio.
 *
 * Cada app del repo se publica en un proyecto de Cloudflare, se construye con un script de
 * `package.json` y se sirve en una url. Esos cuatro datos vivían partidos en dos listas —
 * `SITIOS` en `record-deploy.mjs` (entorno + url) y `PROYECTOS` en `audit-cf-config.mjs`
 * (app + proyecto + script)—, así que una sexta app, o una url que cambia, había que apuntarla
 * en dos ficheros y nada avisaba si solo se apuntaba en uno: el registro o la auditoría se
 * quedaban ciegos con ella. Los dos scripts derivan ahora de esta lista y no cambian de
 * comportamiento; lo que cambia es de dónde leen.
 *
 * Ni los proyectos ni los scripts siguen un patrón (`sc-docs` se publica en `sc-doc` y se
 * construye con `build:docs`), así que el mapa es explícito y lo vigila
 * `scripts/__tests__/cf-sites.test.mjs`: toda app que el repo sella tiene que estar aquí.
 */

/**
 * app del repo → proyecto de Cloudflare → script que la construye → url que la sirve.
 * Añadir una app es añadir UNA fila; el test dice si te has dejado alguna.
 */
export const SITIOS = [
  { app: 'sc-docs', proyecto: 'sc-doc', script: 'build:docs', url: 'https://sc-doc.pages.dev' },
  { app: 'supervisor', proyecto: 'sc-supervisor', script: 'build:supervisor', url: 'https://sc-supervisor.pages.dev' },
  { app: 'agent', proyecto: 'sc-agent', script: 'build:agent', url: 'https://sc-agent.pages.dev' },
  { app: 'cuscare', proyecto: 'sc-cuscare', script: 'build:cuscare', url: 'https://sc-cuscare.pages.dev' },
  { app: 'agent-mini', proyecto: 'agent-mini', script: 'build:agent-mini', url: 'https://agent-mini.pages.dev' },
];

/** Un `build:*` de package.json que termina sellando: `… node scripts/stamp-build.mjs <app>`. */
const SELLO = /node\s+scripts\/stamp-build\.mjs\s+([\w.-]+)\s*$/;

/**
 * Las apps que el repo SELLA hoy, leídas de los scripts `build:*` de package.json. Es la lista
 * contra la que se contrasta el catálogo: si un `build:*` termina en `stamp-build.mjs`, esa app
 * publica un `build.json` y por tanto es un sitio que hay que registrar y auditar.
 * Devuelve `Map<app, script>`.
 */
export function appsSelladas(scripts = {}) {
  const sellan = new Map();
  for (const [nombre, cuerpo] of Object.entries(scripts)) {
    if (!nombre.startsWith('build:') || typeof cuerpo !== 'string') continue;
    const m = cuerpo.match(SELLO);
    if (m) sellan.set(m[1], nombre);
  }
  return sellan;
}

/**
 * Desalineaciones entre el catálogo y lo que el repo construye. Lista de motivos legibles;
 * vacía = alineado. Función pura: es lo que se prueba, con el caso malo fabricado.
 */
export function desalineadas(scripts = {}, sitios = SITIOS) {
  const sellan = appsSelladas(scripts);
  const fallos = [];

  for (const app of sellan.keys()) {
    if (!sitios.some((s) => s.app === app)) {
      fallos.push(
        `la app «${app}» la sella «${sellan.get(app)}» pero no está en SITIOS de scripts/cf-sites.mjs: ` +
          `su sitio no se registraría (deploy:record) ni se auditaría (audit:cf-config)`,
      );
    }
  }

  for (const { app, script } of sitios) {
    if (!sellan.has(app)) {
      fallos.push(
        `«${app}» está en SITIOS pero ningún script build:* del repo termina en ` +
          `«stamp-build.mjs ${app}»: sin sello, deploy:record la marcará en rojo para siempre`,
      );
    } else if (sellan.get(app) !== script) {
      fallos.push(
        `«${app}» dice construirse con «${script}» y quien la sella es «${sellan.get(app)}»: ` +
          `audit:cf-config exigiría en Cloudflare un build command que no es el que sella`,
      );
    }
  }

  return fallos;
}
