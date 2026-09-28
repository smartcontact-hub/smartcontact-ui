#!/usr/bin/env node
/**
 * AUDIT · el orden de las consultas — una regla dentro de `@media`, `@container` o `@supports`
 * que va ANTES de otra con el mismo selector no gana nunca en las propiedades que declaran las
 * dos: una consulta no suma especificidad, y a igual especificidad gana la que va detrás.
 *
 * De dónde sale (DD-130, 2026-09-27): en la franja del resumen de las fichas
 * (`projects/supervisor/src/styles/_resumen.scss`), `@container (min-width: 37.5rem)
 * { .resumen__widget { justify-content: flex-start; gap: … } }` iba ENCIMA de la regla base
 * `.resumen__widget { justify-content: space-between; gap: … }`. El anillo siguió a 244 px de su
 * cifra y solo lo cazó una medida en el navegador; el arreglo fue mover el bloque detrás. La
 * trampa quedó escrita en el hand-off de las fichas y en un comentario del partial, y un
 * comentario no avisa a la siguiente hoja: esto la convierte en un chequeo.
 *
 * LEE EL CSS COMPILADO, no el fuente: cada hoja pasa por el mismo `sass` con el que compila
 * Angular. Tres motivos, medidos el 2026-09-28:
 *   · El anidado solo tiene selector de verdad compilado: `&__name` dentro de `.switch-row` es
 *     `.switch-row__name`. Así salió el caso de `aed-servicio-page`, que leyendo el fuente, regla
 *     a regla, no se veía.
 *   · Una declaración escrita DESPUÉS de un `@media` anidado sale, con este `sass`, en una regla
 *     aparte DETRÁS de la consulta, y la mata: `.a { @media (x) { color: red } color: blue }`
 *     deja la consulta muerta. En el fuente parece al revés.
 *   · Un partial entra en el orden de quien lo `@use`a, y hay fuente que `postcss` a pelo ni
 *     siquiera parsea (la interpolación `#{&}` de `rule-builder-page.component.scss`).
 * Entran los `.scss` y `.css` de `projects/` y los `styles:` en línea de los componentes, que son
 * SCSS por el `inlineStyleLanguage` de `angular.json`. La línea que se reporta es la del FUENTE,
 * por el mapa de fuentes del compilado.
 *
 * EL CRITERIO, exacto, para no dar falsos positivos. Una declaración de una regla Q con consulta
 * está muerta si hay una regla B POSTERIOR en el mismo compilado que:
 *   · está en la misma capa: entre capas distintas manda la capa, no el orden;
 *   · se aplica siempre que Q se aplica: sus consultas son un subconjunto LITERAL de las de Q
 *     (ninguna = regla de primer nivel; la misma consulta repetida, también);
 *   · lleva el mismo selector, literal: misma especificidad y mismos elementos;
 *   · declara la misma propiedad, salvo que Q la lleve `!important` y B no.
 * Quedan fuera a propósito, porque solo darían falsos NEGATIVOS: selectores distintos que casan
 * con lo mismo, una abreviada frente a su propiedad larga (`gap` frente a `column-gap`), consultas
 * distintas que se implican (`min-width: 40rem` frente a `30rem`) y capas distintas. `@scope`,
 * `@starting-style` y `@keyframes` no son la cascada de siempre y no se miran.
 *
 * QUÉ HACER SI SE PONE ROJO: mueve el bloque de la consulta DETRÁS de la regla que lo pisa, con un
 * comentario de que el orden importa (como el de `_resumen.scss`), o borra la declaración si
 * sobra. No hay lista de excepciones: una declaración que no gana nunca no hace nada.
 *
 * `sass` y `postcss` no son dependencias directas del repo: las fija `@angular/build`, que es quien
 * compila las apps. Es a propósito, porque el chequeo tiene que leer lo que sale de ESE compilador.
 *
 * El análisis es PURO sobre el texto (funciones exportadas → testeable); enumerar las hojas y
 * compilarlas vive en el `main`.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import postcss from 'postcss';
import * as sass from 'sass';

const ROOT = resolve(import.meta.dirname, '..');

const log = (s = '') => process.stdout.write(s + '\n');
const sh = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
};

/** Las reglas condicionales: lo de dentro vale solo cuando se cumple la condición. */
const CONDICIONALES = new Set(['media', 'container', 'supports']);

/**
 * Una hoja sin `@media`, `@container` ni `@supports` escritos, y sin nada que los traiga de otra
 * (`@use`, `@forward`, `@import`, `@include`), no puede tener una consulta en su compilado: no hace
 * falta compilarla. Es solo tiempo: de 228 unidades se compilan 81 (medido el 2026-09-28).
 */
export const puedeTenerConsultas = (fuente) => /@(media|container|supports|use|forward|import|include)\b/.test(fuente);

/** Selectores y consultas se comparan tal cual, con los espacios colapsados. */
const plano = (s) => s.replace(/\s+/g, ' ').trim();

/** Las propiedades no distinguen mayúsculas; las personalizadas (`--x`), sí. */
const propiedad = (decl) => (decl.prop.startsWith('--') ? decl.prop : decl.prop.toLowerCase());

/**
 * Aplana un CSS ya parseado en sus reglas, EN ORDEN, cada una con su capa y sus consultas.
 * Solo entra la cascada de siempre: lo de dentro de `@keyframes`, `@font-face`, `@scope`,
 * `@starting-style`… se salta. Y una regla con reglas anidadas dentro (anidado nativo de un `.css`)
 * también: sin compilar no se sabe en qué orden cae lo de dentro.
 */
export function aplanar(root) {
  const reglas = [];
  let anonimas = 0;
  const recorrer = (nodo, capa, consultas) => {
    nodo.each((hijo) => {
      if (hijo.type === 'rule') {
        if (hijo.nodes.some((n) => n.type === 'rule' || n.type === 'atrule')) return;
        reglas.push({
          nodo: hijo,
          capa,
          consultas,
          selectores: [...new Set(hijo.selectors.map(plano))],
          declaraciones: hijo.nodes.filter((n) => n.type === 'decl'),
        });
      } else if (hijo.type === 'atrule' && hijo.nodes) {
        const nombre = hijo.name.toLowerCase();
        if (CONDICIONALES.has(nombre)) {
          recorrer(hijo, capa, [...consultas, `@${nombre} ${plano(hijo.params)}`]);
        } else if (nombre === 'layer') {
          // `@layer a { @layer b {} }` y `@layer a.b {}` son la misma capa. Una anónima es única.
          const nombreCapa = plano(hijo.params) || `(anónima ${++anonimas})`;
          recorrer(hijo, capa ? `${capa}.${nombreCapa}` : nombreCapa, consultas);
        }
      }
    });
  };
  recorrer(root, '', []);
  return reglas;
}

/**
 * Las declaraciones de una regla con consulta que una regla POSTERIOR pisa siempre (el criterio,
 * arriba). Una entrada por declaración y selector, con la PRIMERA regla que la pisa.
 */
export function pisadas(reglas) {
  const porSelector = new Map();
  reglas.forEach((regla, i) => {
    for (const s of regla.selectores) {
      if (!porSelector.has(s)) porSelector.set(s, []);
      porSelector.get(s).push(i);
    }
  });
  const halladas = [];
  reglas.forEach((q, i) => {
    if (!q.consultas.length) return;
    for (const selector of q.selectores) {
      const posteriores = porSelector
        .get(selector)
        .filter((j) => j > i)
        .map((j) => reglas[j])
        .filter((b) => b.capa === q.capa && b.consultas.every((c) => q.consultas.includes(c)));
      for (const dq of q.declaraciones) {
        for (const b of posteriores) {
          const db = b.declaraciones.find(
            (d) => propiedad(d) === propiedad(dq) && !(dq.important && !d.important),
          );
          if (!db) continue;
          halladas.push({ selector, propiedad: propiedad(dq), consultas: q.consultas, consultasB: b.consultas, dq, db });
          break;
        }
      }
    }
  });
  return halladas;
}

/**
 * Analiza un CSS: sus reglas con consulta y las declaraciones pisadas. Con `mapa` (el del
 * compilado), cada posición se traduce a la del FUENTE (`{ fichero, linea }`); sin él, es la
 * línea del CSS que se pasa y `fichero` va a `null`.
 */
export function analizar(css, { mapa = null, desde = 'hoja.css' } = {}) {
  const root = postcss.parse(css, { from: desde, map: mapa ? { prev: mapa } : false });
  const donde = (nodo) => {
    const { line, column } = nodo.source.start;
    const origen = mapa ? nodo.source.input.origin(line, column) : null;
    return origen && origen.file ? { fichero: origen.file, linea: origen.line } : { fichero: null, linea: line };
  };
  const reglas = aplanar(root);
  return {
    conConsulta: reglas.filter((r) => r.consultas.length).map((r) => donde(r.nodo)),
    pisadas: pisadas(reglas).map(({ dq, db, ...h }) => ({ ...h, q: donde(dq), b: donde(db) })),
  };
}

/** Atajo para un CSS sin mapa: solo las pisadas, con las líneas del propio CSS. */
export const consultasPisadas = (css) => analizar(css).pisadas;

/**
 * Compila con el `sass` de Angular. Sin `texto`, la hoja `fichero`; con `texto`, un bloque SCSS
 * que vive en `fichero` (un `styles:` en línea), y sus `@use` relativos se resuelven desde ahí.
 */
export function compilar({ fichero, texto }) {
  const opciones = { sourceMap: true, logger: sass.Logger.silent, loadPaths: [resolve(ROOT, 'node_modules')] };
  const r =
    texto === undefined
      ? sass.compile(fichero, opciones)
      : sass.compileString(texto, { ...opciones, syntax: 'scss', url: pathToFileURL(fichero) });
  return { css: r.css, mapa: r.sourceMap };
}

/**
 * Compila una unidad (una hoja, o un bloque en línea con el `desfase` de líneas hasta su literal) y
 * la analiza. Todas las posiciones salen como `{ fichero, linea }` del FUENTE: en un bloque en
 * línea, la línea que da el mapa es la del literal, y se le suma dónde empieza en el `.ts`.
 */
export function analizarUnidad({ fichero, texto, desfase = 0 }) {
  const { css, mapa } = compilar({ fichero, texto });
  const { conConsulta, pisadas } = analizar(css, { mapa, desde: fichero });
  const fuente = (p) => {
    const f = p.fichero ?? fichero;
    return { fichero: f, linea: f === fichero ? p.linea + desfase : p.linea };
  };
  return {
    conConsulta: conConsulta.map(fuente),
    pisadas: pisadas.map((h) => ({ ...h, q: fuente(h.q), b: fuente(h.b) })),
  };
}

/** Compila un SCSS suelto y lo analiza, con las líneas del fuente. Lo usan las pruebas. */
export const analizarScss = (texto, fichero = resolve(ROOT, 'prueba.scss')) => analizarUnidad({ fichero, texto });

/**
 * Los bloques `styles:` en línea de un componente: `styles: \`…\``, `styles: ':host {…}'` o una
 * lista de ellos. Da el texto de cada literal y la línea del fichero en la que empieza. Un literal
 * de plantilla con `${…}` no es estático: sale con `interpolado`, para que el main lo cuente en vez
 * de compilar otra cosa.
 */
export function estilosEnLinea(ts) {
  const bloques = [];
  const COMILLAS = new Set(['`', "'", '"']);
  const saltarEspacios = (i) => {
    while (i < ts.length && /\s/.test(ts[i])) i++;
    return i;
  };
  const leerLiteral = (i) => {
    const cierre = ts[i];
    let texto = '';
    let interpolado = false;
    for (let k = i + 1; k < ts.length; k++) {
      if (ts[k] === '\\') {
        // Los escapes que solo protegen al literal se quitan; el resto es CSS (`\2014`) y se queda.
        texto += '\\`\'"$'.includes(ts[k + 1]) ? ts[k + 1] : ts[k] + ts[k + 1];
        k++;
      } else if (ts[k] === cierre) {
        return { texto, interpolado, fin: k + 1 };
      } else {
        if (cierre === '`' && ts[k] === '$' && ts[k + 1] === '{') interpolado = true;
        texto += ts[k];
      }
    }
    return null;
  };
  const linea = (i) => ts.slice(0, i).split('\n').length;
  for (const m of ts.matchAll(/\bstyles\s*:\s*/g)) {
    let i = m.index + m[0].length;
    const enLista = ts[i] === '[';
    if (enLista) i = saltarEspacios(i + 1);
    while (COMILLAS.has(ts[i])) {
      const lit = leerLiteral(i);
      if (!lit) break;
      bloques.push({ texto: lit.texto, linea: linea(i), interpolado: lit.interpolado });
      if (!enLista) break;
      i = saltarEspacios(lit.fin);
      if (ts[i] === ',') i = saltarEspacios(i + 1);
    }
  }
  return bloques;
}

/* ── main ──────────────────────────────────────────────────────────────────── */
if (process.argv[1] && process.argv[1].endsWith('audit-query-order.mjs')) {
  // Lo versionado y lo nuevo sin añadir: un gate que solo mira `git ls-files` no ve la hoja que
  // acabas de crear (LEARNINGS #2).
  const listar = (patron) =>
    sh(`git ls-files --cached --others --exclude-standard -- '${patron}'`).split('\n').filter(Boolean).sort();

  const hojas = [...listar('projects/*.scss'), ...listar('projects/*.css')];
  const unidades = hojas
    .filter((f) => puedeTenerConsultas(readFileSync(resolve(ROOT, f), 'utf8')))
    .map((f) => ({ fichero: resolve(ROOT, f) }));
  let componentes = 0;
  let enLinea = 0;
  const interpolados = [];
  for (const f of listar('projects/*.ts').filter((f) => !f.endsWith('.spec.ts'))) {
    const src = readFileSync(resolve(ROOT, f), 'utf8');
    if (!/\bstyles\s*:/.test(src)) continue;
    const bloques = estilosEnLinea(src);
    if (bloques.length) componentes++;
    enLinea += bloques.length;
    for (const b of bloques.filter((b) => puedeTenerConsultas(b.texto))) {
      if (b.interpolado) interpolados.push(`${f}:${b.linea}`);
      else unidades.push({ fichero: resolve(ROOT, f), texto: b.texto, desfase: b.linea - 1 });
    }
  }

  if (!hojas.length) {
    log('✗ audit:query-order: no encuentro hojas de estilo — ¿estás en la raíz del repo?');
    process.exit(1);
  }

  const rel = (fichero) => relative(ROOT, fichero);
  const noCompilan = [];
  const conConsulta = new Set();
  const halladas = new Map();
  // Un partial se analiza solo y dentro de quien lo usa: lo mismo sale dos veces con la misma
  // posición del fuente, y cuenta una.
  for (const u of unidades) {
    let analisis;
    try {
      analisis = analizarUnidad(u);
    } catch (e) {
      noCompilan.push(`${rel(u.fichero)}${u.desfase ? `:${u.desfase + 1}` : ''}: ${String(e.message).split('\n')[0]}`);
      continue;
    }
    for (const p of analisis.conConsulta) conConsulta.add(`${p.fichero}:${p.linea}`);
    for (const h of analisis.pisadas) {
      const clave = `${h.q.fichero}:${h.q.linea}|${h.selector}|${h.propiedad}|${h.b.fichero}:${h.b.linea}`;
      if (!halladas.has(clave)) halladas.set(clave, { ...h, unidad: u.fichero });
    }
  }

  log(
    `audit:query-order — ${hojas.length} hoja(s) y ${enLinea} bloque(s) \`styles:\` en línea de ${componentes} ` +
      `componente(s); ${unidades.length} pueden tener consultas y se compilan con el sass de Angular: ` +
      `${conConsulta.size} regla(s) escritas bajo una consulta\n`,
  );

  if (noCompilan.length || interpolados.length) {
    log('✗ audit:query-order — hay estilos que no puedo leer, y lo que no leo no lo vigilo:');
    for (const n of noCompilan) log(`  · no compila: ${n}`);
    for (const n of interpolados) log(`  · \`styles:\` con \`\${…}\` (no es estático): ${n}`);
    log('      → si Angular sí lo compila, al chequeo le falta algo (una ruta de carga, un importador): arréglalo aquí.');
    process.exit(1);
  }

  if (!halladas.size) {
    log('✓ audit:query-order OK — ninguna declaración de una consulta queda pisada por una regla posterior.');
    process.exit(0);
  }

  const ordenadas = [...halladas.values()].sort(
    (a, b) => a.q.fichero.localeCompare(b.q.fichero) || a.q.linea - b.q.linea || a.selector.localeCompare(b.selector),
  );
  log(`✗ audit:query-order — ${ordenadas.length} declaración(es) dentro de una consulta que no ganan nunca:`);
  for (const h of ordenadas) {
    const dondeB = h.b.fichero === h.q.fichero ? `la línea ${h.b.linea}` : `${rel(h.b.fichero)}:${h.b.linea}`;
    const consultasB = h.consultasB.length ? `con ${h.consultasB.join(' ')}` : 'sin consulta';
    const via = h.unidad !== h.q.fichero && h.unidad !== h.b.fichero ? ` (al compilar ${rel(h.unidad)})` : '';
    log(`  · ${rel(h.q.fichero)}:${h.q.linea} — \`${h.propiedad}\` de \`${h.selector}\` en ${h.consultas.join(' ')}`);
    log(`      la pisa ${dondeB} (\`${h.selector}\`, ${consultasB}): va detrás, con la misma especificidad${via}.`);
  }
  log('  → Mueve el bloque de la consulta DETRÁS de la regla que lo pisa (una consulta no suma especificidad:');
  log('    gana la que va detrás) y deja dicho en un comentario que el orden importa; o borra la declaración si sobra.');
  process.exit(1);
}
