#!/usr/bin/env node
/**
 * Convierte `CHANGELOG.md` en el artefacto que pinta la página `/novedades` de sc-docs.
 *
 * Existe porque quien entra en sc-doc.pages.dev no se enteraba de que hay versiones: la
 * versión y sus novedades solo se veían en GitHub, y la web es donde aterriza la gente.
 *
 * NO se escribe la página a mano. Dos textos del mismo anuncio divergen — es la misma clase
 * de fallo que los snippets de la doc, y la razón por la que el CHANGELOG es la única fuente:
 * el generador lo LEE, y `novedades:check` pone rojo si el artefacto se queda atrás.
 *
 * El markdown en línea (negrita, `código`, enlaces) se convierte AQUÍ, en build, y no en el
 * navegador: el origen es un fichero nuestro y versionado, así que el HTML sale del repo y no
 * hace falta un parser en el bundle.
 *
 * Uso:
 *   node scripts/gen-novedades.mjs           # escribe el artefacto
 *   node scripts/gen-novedades.mjs --check    # falla si el artefacto no cuadra (va en verify)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const SRC = resolve(root, 'CHANGELOG.md');
const OUT = resolve(root, 'projects/sc-docs/public/novedades/_novedades.json');
const check = process.argv.includes('--check');

// Keep a Changelog escribe las secciones en inglés; la página está en castellano.
const TITULOS = {
  Added: 'Novedades',
  Changed: 'Cambios',
  Removed: 'Retirado',
  Fixed: 'Arreglos',
  Deprecated: 'En retirada',
  Security: 'Seguridad',
};

/** Markdown EN LÍNEA a HTML. Solo lo que el CHANGELOG usa de verdad. */
function inline(md) {
  return md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, texto, url) => {
      // Los enlaces relativos del CHANGELOG apuntan al repo, no al sitio: se absolutizan.
      const href = /^https?:/.test(url)
        ? url
        : `https://github.com/smartcontact-hub/smartcontact-ui/blob/main/${url}`;
      return `<a href="${href}" target="_blank" rel="noopener">${texto}</a>`;
    })
    // Perezoso y NO `[^*]+`: hay negritas con un asterisco dentro (`**10 zonas @sc-gen:***`),
    // y con la clase negada se quedaban SIN convertir, sacando `**` crudos a la página. Lo cazó
    // el test, no la revisión en navegador: allí conté las negritas que SÍ salían, que es medir
    // la presencia y no la ausencia.
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

/** Parte el cuerpo de una versión en intro (párrafos) + secciones con sus puntos. */
function parseCuerpo(cuerpo) {
  const intro = [];
  const secciones = [];
  let seccion = null;
  let buffer = [];

  const cerrarBuffer = () => {
    const texto = buffer.join(' ').trim();
    buffer = [];
    if (!texto) return;
    if (seccion) seccion.items.push(inline(texto));
    else intro.push(inline(texto));
  };

  for (const linea of cuerpo.split('\n')) {
    if (linea.startsWith('### ')) {
      cerrarBuffer();
      const crudo = linea.slice(4).trim();
      seccion = { titulo: TITULOS[crudo] ?? crudo, items: [] };
      secciones.push(seccion);
    } else if (linea.startsWith('- ')) {
      cerrarBuffer();
      buffer.push(linea.slice(2).trim());
    } else if (linea.trim() === '') {
      cerrarBuffer();
    } else {
      // Continuación: tanto de un punto con sangría como de un párrafo de la intro.
      buffer.push(linea.trim());
    }
  }
  cerrarBuffer();
  return { intro, secciones };
}

/** Exportada para poder probarla EN ROJO con un CHANGELOG fabricado (LEARNINGS #2). */
export function construir(md) {
  const versiones = [];
  for (const bloque of md.split(/\n## /).slice(1)) {
    const cabecera = bloque.slice(0, bloque.indexOf('\n'));
    const m = cabecera.match(/^\[([^\]]+)\](?:\s*[—-]\s*(\S+))?/);
    if (!m) continue;
    const [, version, fecha] = m;
    if (version.toLowerCase() === 'unreleased') continue; // aún no existe para nadie
    const { intro, secciones } = parseCuerpo(bloque.slice(bloque.indexOf('\n') + 1));
    versiones.push({ version, fecha: fecha ?? null, intro, secciones });
  }
  if (versiones.length === 0) throw new Error('CHANGELOG.md no dio ninguna versión publicada.');
  return { fuente: 'CHANGELOG.md', versiones };
}

function main() {
const datos = JSON.stringify(construir(readFileSync(SRC, 'utf8')), null, 2) + '\n';

if (check) {
  const actual = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (actual !== datos) {
    console.error(
      '✗ NOVEDADES desfasado — `projects/sc-docs/public/novedades/_novedades.json` no cuadra con\n' +
        '  CHANGELOG.md. La página enseñaría una versión distinta de la que anuncia el repo.\n' +
        '  Regenera:  npm run novedades:gen',
    );
    process.exit(1);
  }
  console.log('✓ NOVEDADES OK — la página cuadra con CHANGELOG.md.');
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, datos);
  const n = JSON.parse(datos).versiones.length;
  console.log(`✓ ${n} versiones a projects/sc-docs/public/novedades/_novedades.json`);
}
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
