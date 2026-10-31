#!/usr/bin/env node
/**
 * docs:ia · UNA FICHA EN TEXTO POR COMPONENTE, para que un agente lo lea todo de una vez.
 *
 * Por qué existe: lo que sc-docs sabe de un componente estaba en cinco sitios. El contrato y el «cuándo se usa» en
 * `_component-api.json`; la descripción, las stories y su código dentro del TypeScript de cada ficha; la anatomía, solo
 * en el DOM pintado; dónde sale en la app, en `_usage-status.json`. Una persona lo ve junto en la web, pero la web es una
 * SPA que enruta por `#`: un agente que la pide recibe un `index.html` vacío. Medido el 2026-10-13: `sc-doc.pages.dev/
 * llms.txt` devolvía ese mismo HTML.
 *
 * Qué escribe (no se commitea: se genera en cada build, así nunca va por detrás del código):
 *   projects/sc-docs/public/llms.txt           índice para agentes (formato llmstxt.org), servido en la raíz
 *   projects/sc-docs/public/ia/<ficha>.md      la ficha: cuándo, estado, importar, propiedades, cada story con su código
 *                                             y su enlace, anatomía, dónde se usa y su captura
 *   projects/sc-docs/public/ia/{tokens,patrones,iconos}.md   los Fundamentos: qué token es para qué, la barra de calidad
 *                                             de una pantalla y qué icono dice cada cosa, leídos de donde los lee la web
 *   projects/sc-docs/public/llms-full.txt      todo lo anterior en un solo fichero, para quien lo quiere de una vez
 *   projects/sc-docs/public/{robots.txt,sitemap.xml}   sin ellos el SPA respondía su `index.html` a quien los pedía
 * Con `--paquete`, además, lo mismo dentro de `dist/ui-smartcontact/` (`llms.txt` + `ia/`): así viaja con el paquete del
 * DS, y el agente de un repo que lo instala lo lee en `node_modules` sin internet.
 *
 * Cómo lee las fichas: con el compilador de TypeScript, sin Angular. Del componente de cada demo toma el `meta` y el
 * array que devuelve `stories`, y los EVALÚA en un contexto aislado (`node:vm`) donde lo que no es un literal vale
 * `undefined` (las plantillas, los `viewChild`). Así una descripción partida en `'…' + '…'` o un snippet en una constante
 * salen igual que en la web. El código de las stories sin snippet propio sale de `serializeArgs`, el mismo que usa la
 * web. Una ficha que no se deja leer es un ERROR (sale con 1): una ficha vacía en silencio es peor que ninguna.
 *
 *   node scripts/docs-ia.mjs              # escribe en public/
 *   node scripts/docs-ia.mjs --paquete    # y también en dist/ui-smartcontact/
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import vm from 'node:vm';

import ts from 'typescript';

import { serializeArgs } from '../projects/sc-docs/src/app/storybook/serialize-args.core.mjs';
import { slugHistoria, urlDeHistoria } from '../projects/sc-docs/src/app/storybook/story-url.core.mjs';

const root = resolve(import.meta.dirname, '..');
const SITIO = 'https://sc-doc.pages.dev';
const PAQUETE = '@smartcontact-hub/components';
const PAGINAS = 'projects/sc-docs/src/app/pages/components';

// ── Leer el TypeScript de una ficha ────────────────────────────────────────────────────────────

/** Una expresión de TypeScript a JavaScript (quita tipos, `as const`, genéricos). */
function aJs(expresion) {
  const salida = ts.transpileModule(`(${expresion});`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None, removeComments: true },
  }).outputText;
  // Sin el `"use strict"` que antepone: el `with` de `evaluar` no se admite en modo estricto.
  return salida.replace(/^\s*["']use strict["'];\s*/, '').trim().replace(/;$/, '');
}

/**
 * Las constantes que EXPORTA el DS (`export const LABEL_COLORS = [...]`), por nombre y sin evaluar: una ficha que hace
 * `options: [...LABEL_COLORS]` las importa del paquete, y aquí se leen del fuente una vez, antes de la primera evaluación.
 */
let exportadas = null;
function constanteDelDs(nombre) {
  return cargarExportadas().get(nombre);
}

/**
 * Lee una vez todos los `.ts` del DS. Se llama ANTES de evaluar, fuera del tope de 1 s de `vm`: dentro, la primera ficha
 * que nombraba una constante del DS pagaba esa lectura (184 ficheros, 163 ms en reposo) contra el tope, y con la máquina
 * cargada (el preflight corre las pruebas en paralelo) pasaba de 1 s: la evaluación se cortaba, `meta` se quedaba sin
 * leer y `docs-ia.test.mjs` caía en rojo uno de cada dos preflights (medido el 2026-10-14: 1,38 y 1,64 s al fallar,
 * 0,38 s sola).
 */
function cargarExportadas() {
  if (!exportadas) {
    exportadas = new Map();
    const recorrer = (d) => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const ruta = join(d, e.name);
        if (e.isDirectory()) recorrer(ruta);
        else if (e.name.endsWith('.ts') && !e.name.endsWith('.spec.ts')) {
          const fuente = ts.createSourceFile(ruta, readFileSync(ruta, 'utf8'), ts.ScriptTarget.ES2022, true);
          for (const st of fuente.statements) {
            if (!ts.isVariableStatement(st) || !st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
            for (const d of st.declarationList.declarations) {
              if (ts.isIdentifier(d.name) && d.initializer) exportadas.set(d.name.text, d.initializer.getText(fuente));
            }
          }
        }
      }
    };
    recorrer(join(root, 'projects/ui-smartcontact/src/lib'));
  }
  return exportadas;
}

/**
 * Evalúa una expresión en un contexto donde todo nombre que no se conozca vale `undefined` en vez de lanzar: las
 * stories nombran plantillas (`pg`, `va`) que aquí no existen, y no hacen falta para el texto. Antes de rendirse con
 * un nombre, lo busca entre las constantes que exporta el DS.
 */
function evaluar(expresion, conocidos, self) {
  cargarExportadas();
  const ambito = new Proxy(conocidos, {
    has: (obj, k) => typeof k === 'string' && !(k in globalThis && !(k in obj)),
    get: (obj, k) => {
      if (k === Symbol.unscopables) return undefined;
      if (!(k in obj) && typeof k === 'string') {
        const fuente = constanteDelDs(k);
        obj[k] = undefined; // antes de evaluar: una constante que se nombra a sí misma no da vueltas
        if (fuente) {
          try {
            obj[k] = evaluar(fuente, obj, {});
          } catch {
            // no es un literal: se queda en undefined
          }
        }
      }
      return obj[k];
    },
  });
  const sandbox = vm.createContext({ __ambito: ambito, __self: self });
  return vm.runInContext(`(function () { with (__ambito) { return ${aJs(expresion)}; } }).call(__self)`, sandbox, {
    timeout: 1000,
  });
}

/** Del TypeScript de una demo: su `meta` y sus stories ya evaluados. Lanza si no los encuentra. */
export function leerFicha(codigo, nombreFichero = 'demo.ts') {
  const fuente = ts.createSourceFile(nombreFichero, codigo, ts.ScriptTarget.ES2022, true);
  const conocidos = {};

  // 1. Las constantes del fichero, en orden (`const X_SNIPPET = \`…\``, `const DESC = '…' + '…'`).
  for (const st of fuente.statements) {
    if (!ts.isVariableStatement(st)) continue;
    for (const d of st.declarationList.declarations) {
      if (!ts.isIdentifier(d.name) || !d.initializer) continue;
      try {
        conocidos[d.name.text] = evaluar(d.initializer.getText(fuente), conocidos, {});
      } catch {
        // una constante que no es un literal (un import, una llamada): no hace falta para el texto
      }
    }
  }

  // 2. La clase de la demo: sus campos (para `this.x`), su `meta` y el array que devuelve `stories`.
  const clase = fuente.statements.find((s) => ts.isClassDeclaration(s) && s.members.some((m) => m.name?.getText(fuente) === 'meta'));
  if (!clase) throw new Error('no tiene una clase con `meta`');
  const self = {};
  let meta = null;
  let historias = null;
  for (const m of clase.members) {
    if (!ts.isPropertyDeclaration(m) || !m.initializer) continue;
    const nombre = m.name.getText(fuente);
    if (nombre === 'stories') {
      historias = evaluar(ultimoArray(m.initializer, fuente), conocidos, self);
      continue;
    }
    try {
      self[nombre] = evaluar(m.initializer.getText(fuente), conocidos, self);
    } catch {
      // `viewChild(…)`, `computed(…)`, `signal(…)`: no son datos
    }
    if (nombre === 'meta') meta = self[nombre];
  }
  if (!meta?.tag) throw new Error('su `meta` no se deja leer (sin `tag`)');
  if (!Array.isArray(historias) || !historias.length) throw new Error('su `stories` no devuelve ninguna story legible');
  // Copiados a ESTE contexto: lo evaluado en el de `vm` trae sus propios `Array`/`Object`, y un `deepStrictEqual` los
  // rechaza aunque tengan lo mismo. Las funciones (`combinacionImposible`) se quedan fuera: el texto no las necesita.
  const copia = (x) => JSON.parse(JSON.stringify(x));
  return { meta: copia(meta), historias: copia(historias.filter((h) => h && typeof h.name === 'string')) };
}

/** El texto del ÚLTIMO `return [ … ]` de un `computed(() => { … })`: el primero suele ser el `return []` de la guarda. */
function ultimoArray(nodo, fuente) {
  let ultimo = null;
  const visitar = (n) => {
    if (ts.isReturnStatement(n) && n.expression && ts.isArrayLiteralExpression(n.expression) && n.expression.elements.length) {
      ultimo = n.expression;
    }
    ts.forEachChild(n, visitar);
  };
  visitar(nodo);
  if (!ultimo) throw new Error('`stories` no tiene un `return [ … ]` con stories');
  return ultimo.getText(fuente);
}

// ── Lo que se sabe de cada componente fuera de su ficha ───────────────────────────────────────

/** `sc-button` → `ScButtonComponent`, leyendo el `selector` de cada componente del DS. */
export function clasesPorSelector(dir = join(root, 'projects/ui-smartcontact/src/lib/components')) {
  const mapa = new Map();
  const recorrer = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const ruta = join(d, e.name);
      if (e.isDirectory()) recorrer(ruta);
      else if (e.name.endsWith('.component.ts') || e.name.endsWith('.ts')) {
        const t = readFileSync(ruta, 'utf8');
        for (const [, sel, clase] of t.matchAll(/selector:\s*'([\w-]+)'[\s\S]*?export class (\w+)/g)) if (!mapa.has(sel)) mapa.set(sel, clase);
      }
    }
  };
  recorrer(dir);
  return mapa;
}

const CLASE_ES = { input: 'entrada', model: 'dos sentidos', output: 'salida' };
const ESTADO_ES = {
  ready: 'listo: tiene maestro en el Kit de Figma y página de demo',
  experimental: 'experimental',
  deprecated: 'retirado',
};
const FALTA_ES = { kit: 'le falta su maestro en el Kit de Figma', demo: 'le falta su página de demo' };

const celda = (t) => String(t ?? '').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');
const valorEnTexto = (v) => (typeof v === 'string' ? v : JSON.stringify(v));

/** El control de un knob, como se lee: `primary | secondary | …`, `sí/no`, `texto`, `número`. */
function control(a) {
  const c = a.control ?? {};
  if (c.kind === 'select') return (c.options ?? []).map(valorEnTexto).join(' | ');
  return { boolean: 'sí/no', text: 'texto', number: 'número', color: 'color' }[c.kind] ?? c.kind ?? '';
}

// ── La ficha en Markdown ───────────────────────────────────────────────────────────────────────

export function fichaMd({ pagina, meta, historias, componente, clase, usos, capturas, fecha }) {
  const l = [];
  const titulo = meta.title ?? meta.tag;
  const enlace = (h, solo = false) => `${SITIO}/${urlDeHistoria({ pagina, historia: slugHistoria(h.name), solo })}`;

  l.push(`# ${titulo} (\`<${meta.tag}>\`)`, '');
  l.push(
    `> Ficha para agentes, generada de sc-docs por \`scripts/docs-ia.mjs\` el ${fecha}: no se edita a mano. ` +
      `La página para personas, con el Playground y las herramientas: ${SITIO}/#/components/${pagina}`,
    '',
  );

  if (componente) {
    const estado = ESTADO_ES[componente.estado] ?? componente.estado;
    const faltas = (componente.faltas ?? []).map((f) => FALTA_ES[f] ?? f);
    l.push(`- **Estado**: ${estado}${faltas.length ? ` (${faltas.join('; ')})` : ''}.${componente.retirado ? ` Motivo: ${componente.retirado}` : ''}`);
    if (componente.primengBase) l.push(`- **Envuelve**: \`${componente.primengBase}\` de PrimeNG.`);
  }
  l.push('');

  if (componente?.cuando) l.push('## Cuándo se usa', '', componente.cuando, '');
  if (meta.description) l.push('## Qué es', '', meta.description, '');

  l.push('## Importar', '', '```ts', clase ? `import { ${clase} } from '${PAQUETE}';` : `// <${meta.tag}>: su clase no se encontró en el DS`, '```', '');

  const contrato = componente?.contrato ?? [];
  if (contrato.length) {
    l.push('## Propiedades', '');
    l.push('Del código del componente, cruzado con la API de PrimeNG (`_component-api.json`). «Dos sentidos» es un `model()`: se ata con `[(x)]`.', '');
    l.push('| Nombre | Clase | Tipo | Por defecto | Qué hace |', '|---|---|---|---|---|');
    for (const m of contrato) {
      const desc = m.descripcion ?? (m.nativo?.descripcion ? `${m.nativo.descripcion} (de PrimeNG)` : '');
      const req = m.requerido ? ' **(obligatoria)**' : '';
      l.push(`| \`${m.nombre}\` | ${CLASE_ES[m.clase] ?? m.clase} | \`${celda(m.tipo)}\` | ${m.porDefecto ? `\`${celda(m.porDefecto)}\`` : ''} | ${celda(desc)}${req} |`);
    }
    l.push('');
  }

  l.push('## Stories', '');
  l.push('Cada una con su código y su enlace. «Suelta» abre solo esa story, sin el marco de la web (para mirarla o capturarla).', '');
  for (const h of historias) {
    const slug = slugHistoria(h.name);
    l.push(`### ${h.name}`, '');
    if (h.description) l.push(h.description, '');
    if (h.playground) {
      const knobs = meta.argTypes ?? [];
      if (knobs.length) {
        l.push('Controles del Playground:', '');
        for (const a of knobs) l.push(`- \`${a.name}\` (${control(a)})${a.description ? `: ${a.description}` : ''}`);
        l.push('');
      }
      l.push('Con sus valores por defecto:', '');
    }
    const codigo = h.snippet ?? serializeArgs(meta, h.playground ? (meta.defaultArgs ?? {}) : (h.args ?? meta.defaultArgs ?? {}), contrato);
    l.push('```html', codigo.trim(), '```', '');
    const captura = capturas?.historias?.[slug];
    const partes = [`[Abrir](${enlace(h)})`, `[Suelta](${enlace(h, true)})`];
    if (captura) partes.push(`[Captura](${SITIO}/ia/capturas/${captura.png})`);
    l.push(partes.join(' · '), '');
    if (h.playground && (meta.argTypes ?? []).some((a) => ['select', 'boolean'].includes(a.control?.kind))) {
      l.push(
        `Todas las combinaciones de sus desplegables e interruptores, en una rejilla: ${SITIO}/${urlDeHistoria({ pagina, historia: 'combinaciones' })}`,
        '',
      );
    }
  }

  if (capturas?.anatomia?.length) {
    l.push('## Anatomía', '');
    l.push(`Lo que se escribe es \`<${meta.tag}>\`; esto es lo que el navegador pinta de verdad (leído del DOM el ${capturas.fecha}). Sirve para escribir un selector o depurar CSS.`, '');
    l.push('```', ...capturas.anatomia, '```', '');
  }

  if (usos.length) {
    l.push('## Dónde se usa en la app', '');
    l.push('Pantallas del Supervisor que lo pintan (`_usage-status.json`), con su captura:', '');
    for (const u of usos) l.push(`- ${u.label} (\`${u.route}\`)${u.shots?.[0] ? `: ${SITIO}/usage/${u.shots[0]}` : ''}`);
    l.push('');
  }

  return l.join('\n').replace(/\n{3,}/g, '\n\n');
}

export function llmsTxt(fichas, fecha, fundamentos = []) {
  const l = [
    '# Smart Contact UI',
    '',
    '> Design System de Smart Contact: componentes Angular sobre PrimeNG (paquete `@smartcontact-hub/components`), con el ' +
      'contrato de tokens CSS `--sc-*`. Cada componente tiene una ficha en Markdown con cuándo usarlo, sus propiedades, cada ' +
      'story con su código y su enlace, su anatomía y dónde sale en la app.',
    '',
    `Generado el ${fecha} por \`scripts/docs-ia.mjs\`. Para personas: ${SITIO}`,
    '',
    '## Componentes',
    '',
  ];
  for (const f of fichas) l.push(`- [${f.titulo} (\`<${f.tag}>\`)](ia/${f.pagina}.md)${f.cuando ? `: ${f.cuando}` : ''}`);
  if (fundamentos.length) {
    l.push('', '## Fundamentos', '');
    for (const f of fundamentos) l.push(`- [${f.titulo}](ia/${f.pagina}.md): ${f.resumen}`);
  }
  l.push(
    '',
    '## Datos',
    '',
    `- [Contrato de todos los componentes, en JSON](${SITIO}/components/_component-api.json): propiedades, tipos, valores por defecto, estado y «cuándo», generado del código.`,
    `- [Dónde se usa cada componente en la app, en JSON](${SITIO}/usage/_usage-status.json)`,
    `- [Qué token semántico es para qué, en JSON](${SITIO}/tokens/_semantic-docs.json)`,
    `- [Versiones publicadas y qué trae cada una, en JSON](${SITIO}/novedades/_novedades.json)`,
    '',
    '## Optional',
    '',
    `- [Todo en un solo fichero](${SITIO}/llms-full.txt): este índice seguido de cada ficha entera.`,
    '',
  );
  return l.join('\n');
}

// ── Fundamentos: lo que un agente necesita además de las fichas ────────────────────────────────

/** Qué token es para qué: `_semantic-docs.json`, el mismo que pinta Fundamentos → Escala y color. */
function tokensMd(fecha) {
  const docs = JSON.parse(readFileSync(join(root, 'projects/sc-docs/public/tokens/_semantic-docs.json'), 'utf8'));
  const l = [
    '# Tokens semánticos `--sc-*`',
    '',
    '> El contrato de color del DS. Una pantalla pide el ROL (`--sc-bg-surface`, `--sc-text-secondary`), nunca un color de ' +
      'paleta (`--sc-color-slate-200`): el rol voltea solo en oscuro, la paleta no. Los tamaños y espacios salen de ' +
      '`--sc-spacing-*` y la letra de las clases `.sc-text-*`.',
    '',
    `Generado el ${fecha} de \`tokens/_semantic-docs.json\`. En la web: ${SITIO}/#/fundamentos/escala-color`,
    '',
  ];
  const familias = new Map();
  for (const t of docs.tokens) familias.set(t.familia, [...(familias.get(t.familia) ?? []), t]);
  for (const [familia, tokens] of familias) {
    l.push(`## ${familia[0].toUpperCase()}${familia.slice(1)}`, '');
    for (const t of tokens) {
      l.push(`- \`--${t.token}\`: ${t.uso}${t.no ? ` ${t.no}` : ''}${t.dd ? ` (${t.dd})` : ''}`);
    }
    l.push('');
  }
  return l.join('\n');
}

/** La barra de calidad de una pantalla: los principios de Fundamentos → Patrones, con su texto de la web. */
function patronesMd(fecha) {
  const es = JSON.parse(readFileSync(join(root, 'projects/sc-docs/public/assets/i18n/es.json'), 'utf8'));
  const p = es.fundamentos.patterns;
  const sinHtml = (t) => String(t ?? '').replace(/<[^>]+>/g, '');
  const l = [
    `# ${p.title}`,
    '',
    `> ${sinHtml(p.lead)}`,
    '',
    `Generado el ${fecha} de la página de Patrones. En la web: ${SITIO}/#/fundamentos/patrones`,
    '',
  ];
  for (const pr of Object.values(p.principles)) {
    l.push(`## ${pr.title}`, '', `- Aplica: ${sinHtml(pr.apply)}`, `- Evita: ${sinHtml(pr.avoid)}`, `- Ya lo tienes: ${sinHtml(pr.have)}`, '');
  }
  return l.join('\n');
}

/** Qué icono dice cada cosa (DD-200): `sc-icon-meanings.ts`, el mismo que leen la página Iconos y `audit:icons`. */
function iconosMd(fecha) {
  const fuente = readFileSync(join(root, 'projects/ui-smartcontact-icons/src/lib/icons/sc-icon-meanings.ts'), 'utf8');
  const bloque = (nombre) => fuente.slice(fuente.indexOf(`export const ${nombre}`)).split('} as const')[0];
  const conceptos = [...bloque('SC_ICONS').matchAll(/^\s+(\w+): '([\w]+)',?$/gm)];
  const reservados = [...bloque('SC_ICON_RESERVADOS').matchAll(/^\s+(\w+): \{ significa: '([^']*)', noSignifica: '([^']*)'.*?(?:enSuLugar: '(\w+)')?\s*\},?$/gm)];
  const l = [
    '# Iconos',
    '',
    '> Un solo juego, Material Symbols, por `<sc-icon name="…">` (paquete `@smartcontact-hub/icons`). Un concepto, un ' +
      'icono; y los iconos reservados significan una sola cosa en todo el producto (DD-200). Úsalos por concepto: ' +
      '`SC_ICONS.agentes`, no el nombre suelto.',
    '',
    `Generado el ${fecha} de \`sc-icon-meanings.ts\`. En la web: ${SITIO}/#/fundamentos/iconos`,
    '',
    '## Un icono por concepto (`SC_ICONS`)',
    '',
    ...conceptos.map(([, clave, icono]) => `- \`${clave}\`: \`${icono}\``),
    '',
    '## Reservados (`SC_ICON_RESERVADOS`)',
    '',
    ...reservados.map(
      ([, icono, si, no, otro]) => `- \`${icono}\`: ${si}. No es: ${no.toLowerCase()}.${otro ? ` Para eso, \`${otro}\`.` : ''}`,
    ),
    '',
  ];
  return l.join('\n');
}

/** Las páginas de Fundamentos para agentes, con su línea del índice. */
export function fundamentos(fecha) {
  return [
    { pagina: 'tokens', titulo: 'Tokens semánticos', resumen: 'qué rol de color usar para cada cosa, y qué no hacer con él.', md: tokensMd(fecha) },
    { pagina: 'patrones', titulo: 'Patrones de pantalla', resumen: 'la barra de calidad de una pantalla: color funcional, carga, copy, iconos, contraste, agrupación.', md: patronesMd(fecha) },
    { pagina: 'iconos', titulo: 'Iconos', resumen: 'qué icono dice cada concepto y qué iconos tienen un solo significado.', md: iconosMd(fecha) },
  ];
}

/** `llms-full.txt`: el índice y, detrás, cada página entera, para leerlo todo de una vez. */
export function llmsFull(llms, fichas, fund) {
  return [llms, ...fund.map((f) => f.md), ...fichas.map((f) => f.md)].join('\n\n---\n\n');
}

/** El sitio es un SPA por `#`: lo que un buscador puede leer como página son los ficheros de texto. */
function robotsTxt() {
  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${SITIO}/sitemap.xml`, ''].join('\n');
}

function sitemapXml(fichas, fund, fecha) {
  const urls = ['/', '/llms.txt', '/llms-full.txt', ...fund.map((f) => `/ia/${f.pagina}.md`), ...fichas.map((f) => `/ia/${f.pagina}.md`)];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => `  <url><loc>${SITIO}${u}</loc><lastmod>${fecha}</lastmod></url>`),
    '</urlset>',
    '',
  ].join('\n');
}

// ── main ───────────────────────────────────────────────────────────────────────────────────────

/** Todas las fichas, en memoria. `problemas` lista las que no se dejan leer. */
export function generar() {
  const api = JSON.parse(readFileSync(join(root, 'projects/sc-docs/public/components/_component-api.json'), 'utf8'));
  const porSelector = new Map(api.components.map((c) => [c.selector, c]));
  const usoTxt = join(root, 'projects/sc-docs/public/usage/_usage-status.json');
  const uso = existsSync(usoTxt) ? JSON.parse(readFileSync(usoTxt, 'utf8')) : { screens: [], components: {} };
  const pantallas = new Map((uso.screens ?? []).map((s) => [s.id, s]));
  const indiceTxt = join(root, 'projects/sc-docs/public/ia/capturas/_indice.json');
  const indice = existsSync(indiceTxt) ? JSON.parse(readFileSync(indiceTxt, 'utf8')) : { fichas: {} };
  const clases = clasesPorSelector();
  const fecha = new Date().toISOString().slice(0, 10);

  const registro = readFileSync(join(root, PAGINAS, 'component-pages.ts'), 'utf8');
  const entradas = [...registro.matchAll(/path:\s*'([\w-]+)'[\s\S]*?import\('\.\/([^']+)'\)/g)].map((m) => ({ pagina: m[1], modulo: m[2] }));

  const fichas = [];
  const problemas = [];
  for (const { pagina, modulo } of entradas) {
    const fichero = join(root, PAGINAS, `${modulo}.ts`);
    let leida;
    try {
      leida = leerFicha(readFileSync(fichero, 'utf8'), fichero);
    } catch (e) {
      problemas.push(`${pagina}: ${e.message}`);
      continue;
    }
    const componente = porSelector.get(leida.meta.tag) ?? null;
    const usos = (uso.components?.[leida.meta.tag] ?? []).map((id) => pantallas.get(id)).filter(Boolean);
    const capturas = indice.fichas?.[pagina] ? { ...indice.fichas[pagina], fecha: indice.fecha } : null;
    fichas.push({
      pagina,
      tag: leida.meta.tag,
      titulo: leida.meta.title ?? leida.meta.tag,
      cuando: componente?.cuando ?? null,
      md: fichaMd({ pagina, ...leida, componente, clase: clases.get(leida.meta.tag) ?? null, usos, capturas, fecha }),
      historias: leida.historias.length,
    });
  }
  const fund = fundamentos(fecha);
  const llms = llmsTxt(fichas, fecha, fund);
  return { fichas, fundamentos: fund, problemas, entradas: entradas.length, llms, fecha };
}

/** `web`: lo que solo tiene sentido servido en el sitio (`robots.txt`, `sitemap.xml`); el paquete no lo lleva. */
function escribir(dirBase, { fichas, fundamentos: fund, llms, fecha }, { web = false } = {}) {
  const ia = join(dirBase, 'ia');
  mkdirSync(ia, { recursive: true });
  // Las fichas de componentes que ya no existen, fuera (las capturas, no: son de `docs:capturas`).
  for (const f of readdirSync(ia)) if (f.endsWith('.md')) rmSync(join(ia, f));
  for (const f of [...fund, ...fichas]) writeFileSync(join(ia, `${f.pagina}.md`), f.md);
  writeFileSync(join(dirBase, 'llms.txt'), llms);
  writeFileSync(join(dirBase, 'llms-full.txt'), llmsFull(llms, fichas, fund));
  if (web) {
    writeFileSync(join(dirBase, 'robots.txt'), robotsTxt());
    writeFileSync(join(dirBase, 'sitemap.xml'), sitemapXml(fichas, fund, fecha));
  }
}

if (process.argv[1] && process.argv[1].endsWith('docs-ia.mjs')) {
  const resultado = generar();
  if (resultado.problemas.length || resultado.fichas.length !== resultado.entradas) {
    console.error('✘ docs:ia — fichas que no se dejan leer:');
    for (const p of resultado.problemas) console.error(`  · ${p}`);
    process.exit(1);
  }
  escribir(join(root, 'projects/sc-docs/public'), resultado, { web: true });
  let destinos = 'projects/sc-docs/public/';
  if (process.argv.includes('--paquete')) {
    const dist = join(root, 'dist/ui-smartcontact');
    if (!existsSync(dist)) {
      console.error('✘ docs:ia --paquete: no existe dist/ui-smartcontact (construye antes el DS).');
      process.exit(1);
    }
    escribir(dist, resultado);
    destinos += ' y dist/ui-smartcontact/';
  }
  const stories = resultado.fichas.reduce((n, f) => n + f.historias, 0);
  console.log(
    `✔ docs:ia — ${resultado.fichas.length} fichas, ${stories} stories y ${resultado.fundamentos.length} páginas de Fundamentos, en ${destinos}`,
  );
}
