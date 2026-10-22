#!/usr/bin/env node
/**
 * AUDIT · cada plantilla de `code-connect/` sigue apuntando a un componente que existe y no usa lo que Figma no define.
 *
 * POR QUÉ EXISTE. Un mapping de Code Connect es un fichero fijo que se publica a mano: si el componente se mueve o se
 * renombra, la plantilla sigue diciendo lo de antes y nadie lo ve hasta que alguien abre Figma. Y dos cosas ya
 * costaron una vuelta (2026-10-21): 14 plantillas usaban `_fcc_renderHtmlAttribute`, un helper que el visor de Figma
 * NO define (publicaban bien y en Dev Mode salía «Error with Code Connect … is not defined»), y `card` leía una
 * propiedad con otra mayúscula que el master.
 *
 * QUÉ MIRA (todo en local, sin token ni red). Por cada `code-connect/*.figma.ts`:
 *   · `// url=` con un `node-id`, y que ningún otro fichero apunte al mismo nodo;
 *   · `// source=` existe en el repo, y `// component=` es una clase exportada de ESE fichero;
 *   · un `id:` propio, distinto en todos;
 *   · ningún `_fcc_…` en el código (los comentarios pueden nombrarlo).
 *
 * LO QUE NO VE. Que cada propiedad que lee la plantilla exista en su master de Figma: eso pide el token y la red, y
 * va en el CI con `figma connect publish --dry-run`. Sí se puede medir a mano con `list_file_components_for_code_connect`
 * del MCP de Figma.
 *
 * QUÉ HACER SI SE PONE ROJO. Cada línea dice `fichero → qué falla`. Si moviste el componente, corrige `source`; si lo
 * renombraste, `component`; y si es el helper, interpola el fragmento a mano (`docs/code-connect.md`).
 *
 * Es PURO respecto a lo leído (`revisar`: testeable sin disco); `analizar` lo lee del árbol.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const log = (s = '') => process.stdout.write(s + '\n');

export const CARPETA = 'code-connect';
export const AYUDANTES_NO_DEFINIDOS = /_fcc_[A-Za-z]+/;

/** El valor de una cabecera `// clave=valor` (sin espacios alrededor), o null. */
export function cabecera(texto, clave) {
  const m = texto.match(new RegExp(`^//\\s*${clave}=(.+)$`, 'm'));
  return m ? m[1].trim() : null;
}

/** El código de la plantilla sin las líneas de comentario: ahí es donde un helper no definido rompe. */
export function sinComentarios(texto) {
  return texto
    .split('\n')
    .filter((l) => !/^\s*\/\//.test(l))
    .join('\n');
}

/**
 * Los problemas de UNA plantilla. `existe(ruta)` y `leer(ruta)` abstraen el disco.
 * @returns {string[]} frases sin el nombre del fichero.
 */
export function revisarPlantilla(texto, { existe, leer }) {
  const problemas = [];
  const url = cabecera(texto, 'url');
  if (!url || !/node-id=\d+-\d+/.test(url)) problemas.push('falta `// url=` con un `node-id` (el master de Figma al que se publica)');

  const source = cabecera(texto, 'source');
  const componente = cabecera(texto, 'component');
  if (!source) problemas.push('falta `// source=` (la ruta del componente en el repo)');
  else if (!existe(source)) problemas.push(`\`// source=${source}\` no existe: ¿se movió o se renombró el componente?`);
  if (!componente) problemas.push('falta `// component=` (la clase del componente)');
  else if (source && existe(source) && !new RegExp(`export\\s+(?:abstract\\s+)?class\\s+${componente}\\b`).test(leer(source))) {
    problemas.push(`\`// component=${componente}\` no es una clase exportada de ${source}`);
  }

  if (!/\bid:\s*"[^"]+"/.test(texto)) problemas.push('falta `id:` en el `export default`');

  const ayudante = sinComentarios(texto).match(AYUDANTES_NO_DEFINIDOS);
  if (ayudante) {
    problemas.push(`usa \`${ayudante[0]}\`, que el visor de Figma no define: en Dev Mode saldría «Error with Code Connect»; interpola el fragmento a mano`);
  }
  return problemas;
}

/**
 * Los problemas ENTRE plantillas: un nodo o un `id` repetidos.
 * @param {{ruta: string, texto: string}[]} plantillas
 */
export function revisarConjunto(plantillas) {
  const problemas = [];
  const porNodo = new Map();
  const porId = new Map();
  for (const { ruta, texto } of plantillas) {
    const nodo = (cabecera(texto, 'url') || '').match(/node-id=(\d+-\d+)/)?.[1];
    if (nodo) porNodo.set(nodo, [...(porNodo.get(nodo) || []), ruta]);
    const id = texto.match(/\bid:\s*"([^"]+)"/)?.[1];
    if (id) porId.set(id, [...(porId.get(id) || []), ruta]);
  }
  for (const [nodo, rutas] of porNodo) {
    if (rutas.length > 1) problemas.push({ ruta: rutas.join(', '), frase: `apuntan al mismo nodo de Figma (${nodo}): la última publicada pisa a las otras` });
  }
  for (const [id, rutas] of porId) {
    if (rutas.length > 1) problemas.push({ ruta: rutas.join(', '), frase: `repiten el \`id: "${id}"\`` });
  }
  return problemas;
}

/** Lee `code-connect/` de `raiz` y lo revisa. */
export function analizar(raiz = process.cwd()) {
  const carpeta = join(raiz, CARPETA);
  if (!existsSync(carpeta)) return { error: `no hay carpeta ${CARPETA}/`, problemas: [], plantillas: 0 };
  const ficheros = readdirSync(carpeta).filter((f) => f.endsWith('.figma.ts')).sort();
  const plantillas = ficheros.map((f) => ({ ruta: `${CARPETA}/${f}`, texto: readFileSync(join(carpeta, f), 'utf8') }));
  const disco = { existe: (r) => existsSync(join(raiz, r)), leer: (r) => readFileSync(join(raiz, r), 'utf8') };
  const problemas = [];
  for (const p of plantillas) for (const frase of revisarPlantilla(p.texto, disco)) problemas.push({ ruta: p.ruta, frase });
  problemas.push(...revisarConjunto(plantillas));
  return { problemas, plantillas: plantillas.length };
}

/* ── main ──────────────────────────────────────────────────────────────────── */
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let r;
  try {
    r = analizar();
  } catch (e) {
    r = { error: `no pudo leer el árbol: ${e.message}`, problemas: [], plantillas: 0 };
  }
  if (r.error) {
    log(`✗ audit:code-connect — ${r.error}`);
    process.exit(1);
  }
  if (r.problemas.length) {
    log(`✗ audit:code-connect — ${r.problemas.length} problema(s) en ${CARPETA}/:\n`);
    for (const p of r.problemas) log(`  ${p.ruta} → ${p.frase}`);
    log('\n  Corrige la cabecera o la plantilla. Las propiedades contra Figma las valida `figma connect publish --dry-run`, que pide token.');
    process.exit(1);
  }
  log(`✓ audit:code-connect — ${r.plantillas} plantillas: cada \`source\` existe, cada \`component\` es una clase suya, sin helpers que Figma no define ni nodos repetidos.`);
}
