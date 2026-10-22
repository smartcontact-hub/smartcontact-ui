#!/usr/bin/env node
/**
 * ¿Qué capturas de sc-docs se van a mover con este cambio, y siguen sin regenerar?
 *
 * POR QUÉ. En #325 (2026-10-04) `sc-group-popover` ganó la salida `activated`. Su página de sc-docs pintó una tabla
 * «Salidas» nueva, 142 px más alta, y `e2e-smoke` cayó en el CI por la captura `grouppopover-linux.png`: una vuelta de
 * CI y su diagnóstico, por algo que se sabía antes de subir. Las capturas `-linux.png` solo las puede hacer el workflow
 * `visual-baselines`, sobre una rama ya subida, así que esto NO es un gate: un gate que esperase la captura nueva no
 * dejaría subir la rama que hace falta para tenerla. Es un aviso al final del preflight, para lanzar el workflow ANTES de
 * abrir el PR (un commit del robot sobre un PR abierto deja su CI sin jobs).
 *
 * QUÉ MIRA, respecto a la base de la rama con `origin/main`:
 *   · la tabla de API de cada componente, campo a campo como la pinta `story-props-table` (por clase, el nombre, si es
 *     obligatorio, la marca de PrimeNG, el tipo, el valor por defecto, si está obsoleta y la descripción que se ve), y
 *     su «Cuándo se usa». Un campo que la tabla no enseña (`ocultas`, la descripción nativa tapada por la propia) no
 *     cuenta: regenerar no cambiaría nada y el aviso sería falso;
 *   · la carpeta del componente en el DS y su página en sc-docs.
 * Y solo avisa de las capturas que existen (`screenshotBaseline` en `components.spec.ts`) y que este cambio no ha tocado,
 * ni el robot ha comprobado después del último cambio de su pieza. Además, las líneas base de ESTILOS
 * (`component-styles.json`) y de ESTRUCTURA (`component-structure.json`): si cambia la plantilla o la hoja de una pieza
 * que está en ellas, o la plantilla de su página de sc-docs, y la rama no las ha regenerado, da el comando para hacerlo
 * en local (DD-175). La última línea del aviso resume todo lo pendiente: un registro se lee por la cola.
 *
 * La página cuenta desde el #431 (2026-10-16): un ejemplo nuevo en la de `sc-multiselect` añadió una instancia y un
 * ancla, las dos líneas base cayeron en e2e-smoke y costó un CI de más. La de estilos sí se avisó, cinco líneas por
 * encima del final del preflight, y no se leyó; la de estructura no la avisaba nada.
 *
 * Uso: node scripts/api-baselines.mjs (lo llama `preflight-scope` al salir, también si la cadena muere; nunca sale en rojo).
 *      import { medir } from './api-baselines.mjs' (`bash-guard` deniega `gh pr create` mientras quede una captura).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const API = 'projects/sc-docs/public/components/_component-api.json';
export const SPEC = 'e2e/components.spec.ts';
const CAPTURAS = 'e2e/components.spec.ts-snapshots';
export const ESTILOS = 'e2e/baselines/component-styles.json';
export const ESTRUCTURA = 'e2e/baselines/component-structure.json';
/** El asunto con que el workflow `visual-baselines` commitea sobre la rama. */
export const ROBOT = 'chore(e2e): baselines visuales regeneradas en Linux';

/** La pieza del DS (su slug) a la que pertenece una ruta, o null. */
const piezaDe = (ruta) => {
  const ds = /^projects\/ui-smartcontact\/src\/lib\/components\/([^/]+)\//.exec(ruta);
  if (ds) return slugDe(ds[1]);
  const docs = /^projects\/sc-docs\/src\/app\/pages\/components\/([^/]+)\//.exec(ruta);
  return docs ? docs[1] : null;
};

/**
 * Las piezas cuya captura ya COMPROBÓ el robot: hay un commit suyo, o uno que trae su PNG, posterior al último cambio
 * de la pieza. Si el robot la regeneró y salió idéntica, no deja PNG en el diff, y sin esto el aviso seguía diciéndola
 * «sin regenerar» (#342, `bulkeditmenu` y `select`). `commits`: los de la rama, el más NUEVO primero, `{ subject, files }`;
 * el árbol de trabajo sin commitear va delante como un commit más.
 */
export function comprobadasPorRobot(commits, slugs) {
  const comprobadas = new Set();
  for (const slug of slugs) {
    for (const c of commits) {
      if (c.subject.startsWith(ROBOT) || c.files.includes(`${CAPTURAS}/${slug}-linux.png`)) {
        comprobadas.add(slug);
        break;
      }
      if (c.files.some((f) => piezaDe(f) === slug)) break;
    }
  }
  return comprobadas;
}

/**
 * La pieza cuyo pintado mueve una ruta: la plantilla o la hoja de la pieza del DS, o la plantilla de su página de sc-docs
 * (una instancia o un ancla nuevas). La lógica (`.ts`) no cambia lo que se pinta por sí sola, y avisar de ella enseñaría
 * a ignorar el aviso.
 */
function piezaPintada(ruta) {
  const ds = /^projects\/ui-smartcontact\/src\/lib\/components\/([^/]+)\/[^/]+\.(html|s?css)$/.exec(ruta);
  if (ds) return slugDe(ds[1]);
  const docs = /^projects\/sc-docs\/src\/app\/pages\/components\/([^/]+)\/[^/]+\.html$/.exec(ruta);
  return docs ? docs[1] : null;
}

/** Las piezas de una línea base que mueve este cambio, si la rama no la ha regenerado. */
function lineaBasePendiente(fichero, { cambiados, piezas }) {
  if (cambiados.includes(fichero)) return [];
  return [...new Set(cambiados.map(piezaPintada).filter((p) => p && piezas.has(p)))].sort();
}

/**
 * Las piezas cuya línea base de ESTILOS (`component-styles.json`) mueve este cambio y que la rama no ha regenerado.
 * Medido en el #342: cinco plantillas cambiadas, e2e-smoke en rojo y un CI de más. `estilos`: las claves de la línea
 * base (los slugs de sc-docs).
 */
export function estilosPendientes({ cambiados, estilos }) {
  return lineaBasePendiente(ESTILOS, { cambiados, piezas: estilos });
}

/**
 * Lo mismo con la de ESTRUCTURA (`component-structure.json`), que guarda el HTML de cada instancia de la página y
 * cuántas hay (#431). `estructura`: sus claves como slugs (`sc-multiselect` → `multiselect`).
 */
export function estructuraPendiente({ cambiados, estructura }) {
  return lineaBasePendiente(ESTRUCTURA, { cambiados, piezas: estructura });
}

/** Los nombres de las capturas de `components.spec.ts`: el segundo argumento de cada `screenshotBaseline`. */
export function capturasDeSpec(texto) {
  return new Set([...String(texto).matchAll(/screenshotBaseline\(\s*page\s*,\s*'([^']+)'\s*\)/g)].map((m) => m[1]));
}

/** La página de un componente: su nombre sin guiones (`group-popover` → `grouppopover`), como `component-audit`. */
export const slugDe = (nombre) => String(nombre).replace(/-/g, '');

/** Lo que la tabla de API pinta de un componente, en el orden en que lo pinta. */
export function tablaPintada(c) {
  const miembros = c?.contrato ?? [];
  const fila = (m) => ({
    nombre: m.nombre,
    requerido: Boolean(m.requerido),
    primeng: m.origen === 'nativo',
    tipo: m.tipo,
    porDefecto: m.porDefecto ?? null,
    obsoleta: m.nativo?.obsoleta ?? null,
    descripcion: m.descripcion ?? m.nativo?.descripcion ?? '',
  });
  const grupo = (clase) => miembros.filter((m) => m.clase === clase).map(fila);
  return JSON.stringify({ cuando: c?.cuando ?? null, entradas: grupo('input'), dosSentidos: grupo('model'), salidas: grupo('output') });
}

/**
 * Las capturas que este cambio mueve y que no ha regenerado, con el porqué de cada una.
 * `cambiados`: rutas que difieren de la base. `apiAntes` y `apiAhora`: el `_component-api.json` en la base y ahora.
 * `comprobadas` (de `comprobadasPorRobot`, que sabe el ORDEN) manda cuando llega: un PNG en el diff no basta si la
 * página cambió después del robot (#461, 2026-10-19: «DD-213» pasó a «DD-214» en la página de DataTable tras la
 * captura, el aviso calló porque el PNG ya estaba en el diff, y e2e-smoke cayó). Sin `comprobadas`, el PNG en el diff.
 */
export function capturasPendientes({ apiAntes, apiAhora, cambiados, capturas, comprobadas = null }) {
  const motivos = new Map();
  const anota = (slug, motivo) => {
    if (!capturas.has(slug)) return;
    motivos.set(slug, [...new Set([...(motivos.get(slug) ?? []), motivo])]);
  };

  const antes = new Map((apiAntes?.components ?? []).map((c) => [c.name, c]));
  const ahora = new Map((apiAhora?.components ?? []).map((c) => [c.name, c]));
  for (const nombre of new Set([...antes.keys(), ...ahora.keys()])) {
    if (tablaPintada(antes.get(nombre)) !== tablaPintada(ahora.get(nombre))) anota(slugDe(nombre), 'su tabla de API');
  }
  for (const ruta of cambiados) {
    const ds = /^projects\/ui-smartcontact\/src\/lib\/components\/([^/]+)\//.exec(ruta);
    if (ds) anota(slugDe(ds[1]), 'el componente');
    const docs = /^projects\/sc-docs\/src\/app\/pages\/components\/([^/]+)\//.exec(ruta);
    if (docs) anota(docs[1], 'su página');
  }

  const regeneradas = new Set(cambiados.filter((r) => r.startsWith(`${CAPTURAS}/`)).map((r) => r.slice(CAPTURAS.length + 1)));
  const alDia = comprobadas ? (slug) => comprobadas.has(slug) : (slug) => regeneradas.has(`${slug}-linux.png`);
  return [...motivos]
    .filter(([slug]) => !alDia(slug))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slug, porque]) => ({ slug, porque }));
}

/** El aviso, listo para imprimir; vacío si no hay nada pendiente. Su última línea lo resume todo. */
export function aviso(pendientes, rama, estilos = [], estructura = []) {
  const partes = [];
  if (estilos.length) {
    partes.push(
      `\n⚠️ LÍNEA BASE DE ESTILOS SIN REGENERAR (${estilos.join(', ')}). e2e-smoke compara ${ESTILOS} y caería.`,
      '    En local (~1 min): SC_UPDATE_STYLES=1 npx playwright test component-styles — y revisa el diff del JSON.',
      '',
    );
  }
  if (estructura.length) {
    partes.push(
      `\n⚠️ LÍNEA BASE DE ESTRUCTURA SIN REGENERAR (${estructura.join(', ')}). e2e-smoke compara ${ESTRUCTURA} y caería.`,
      '    En local, con sc-docs en `ng serve` (un build de producción escribe otros comentarios en el HTML):',
      '    SC_DOCS_URL=<su URL> SC_UPDATE_STRUCTURE=1 npx playwright test component-structure — y revisa el diff del JSON.',
      '',
    );
  }
  if (pendientes.length) {
    const filas = pendientes.map((p) => `    ${p.slug}-linux.png  (cambia ${p.porque.join(' y ')})`);
    partes.push(
      `\n⚠️ CAPTURAS DE SC-DOCS SIN REGENERAR (${pendientes.length}). El CI las compara en e2e-smoke y caería:`,
      ...filas,
      `    Tras el push, y ANTES de abrir el PR: lanza el workflow visual-baselines con rama=${rama}, trae su commit y`,
      '    mira cada PNG. Un commit del robot sobre un PR ya abierto deja su CI sin jobs.',
      '',
    );
  }
  if (!partes.length) return '';
  const resumen = [
    estilos.length && `estilos (${estilos.join(', ')})`,
    estructura.length && `estructura (${estructura.join(', ')})`,
    pendientes.length && `capturas (${pendientes.map((p) => `${p.slug}-linux.png`).join(', ')})`,
  ].filter(Boolean);
  return [...partes, `⚠️ Líneas base pendientes antes del PR: ${resumen.join('; ')}. El detalle, arriba.`].join('\n');
}

/**
 * Lo pendiente en el árbol `dir`, sin imprimir nada: `{ rama, pendientes, estilos, estructura }`. Lo usan el aviso de
 * abajo y `bash-guard`, que deniega abrir el PR mientras quede una captura (el robot tiene que pasar ANTES). Lanza si
 * no puede medir (sin `origin/main`, fuera de un repo); quien llama decide qué hacer con eso.
 */
export function medir(dir = process.cwd()) {
  const git = (args) =>
    execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }).trim();
  const ruta = (fichero) => join(dir, fichero);
  const base = git(['merge-base', 'HEAD', 'origin/main']);
  // Contra el árbol de trabajo, no contra HEAD: el preflight mide lo que va a subir, commiteado o no.
  const cambiados = git(['diff', '--name-only', base]).split('\n').filter(Boolean);
  const leer = (texto) => (texto ? JSON.parse(texto) : null);
  let apiAntes = null;
  try {
    apiAntes = leer(git(['show', `${base}:${API}`]));
  } catch {
    /* la base no tenía el fichero: todo lo de ahora es nuevo */
  }
  const apiAhora = existsSync(ruta(API)) ? leer(readFileSync(ruta(API), 'utf8')) : null;
  const capturas = capturasDeSpec(existsSync(ruta(SPEC)) ? readFileSync(ruta(SPEC), 'utf8') : '');
  const rama = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  // Los commits de la rama, el más nuevo primero; lo que aún no está commiteado va delante, como el más nuevo.
  // `--diff-merges=first-parent`: sin él, un commit de fusión no lista ficheros, y lo que se arregló al fundir (#461,
  // la DD renumerada en la página) pasaba por delante del robot sin contar.
  const log = git(['log', '--format=%x00%s', '--name-only', '--diff-merges=first-parent', `${base}..HEAD`]);
  const commits = log
    .split('\0')
    .filter(Boolean)
    .map((b) => {
      const [subject, ...files] = b.split('\n');
      return { subject, files: files.filter(Boolean) };
    });
  const sucio = git(['diff', '--name-only', 'HEAD']).split('\n').filter(Boolean);
  if (sucio.length) commits.unshift({ subject: '(árbol de trabajo)', files: sucio });
  const comprobadas = comprobadasPorRobot(commits, capturas);
  const claves = (fichero) => Object.keys(existsSync(ruta(fichero)) ? JSON.parse(readFileSync(ruta(fichero), 'utf8')) : {});
  const estilos = new Set(claves(ESTILOS));
  const estructura = new Set(claves(ESTRUCTURA).map((tag) => slugDe(tag.replace(/^sc-/, ''))));
  return {
    rama,
    pendientes: capturasPendientes({ apiAntes, apiAhora, cambiados, capturas, comprobadas }),
    estilos: estilosPendientes({ cambiados, estilos }),
    estructura: estructuraPendiente({ cambiados, estructura }),
  };
}

function main() {
  try {
    const { rama, pendientes, estilos, estructura } = medir();
    const texto = aviso(pendientes, rama, estilos, estructura);
    if (texto) console.log(texto);
  } catch (e) {
    // Es un aviso: si no puede medir, lo dice y deja seguir.
    console.log(`(aviso de capturas: no pude medir — ${String(e?.message ?? e).split('\n')[0]})`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
