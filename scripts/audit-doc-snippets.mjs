#!/usr/bin/env node
/**
 * AUDIT · el código que enseña la doc usa API que EXISTE.
 *
 * En `sc-docs`, cada ejemplo de componente es un `<ng-template>` con componentes reales del DS,
 * pero el CÓDIGO que se muestra debajo no siempre sale de ahí: el Playground se serializa de los
 * args vivos (`storybook/serialize-args.ts`), y las demás stories llevan el snippet ESCRITO A
 * MANO en una constante. Medido el 2026-09-07: de 49 páginas de componente, 44 usan snippets a
 * mano, 71 constantes en total. Nada comprobaba que lo que enseñan siga existiendo.
 *
 * QUÉ COMPARA, Y POR QUÉ NO LO OBVIO. Lo primero que uno intenta es exigir que el snippet sea
 * igual a su `<ng-template>`. Medido antes de escribir esto: de los 71 pares, **31 coinciden y
 * 40 no**, y casi todas las diferencias son DELIBERADAS y buenas — el snippet de `sc-breadcrumb`
 * inlinea los datos para que se vean (`[home]="{ icon: …, command: … }"`) mientras la plantilla
 * los ata a una variable de demo, y el de `sc-bulk-edit-menu` omite el andamiaje que la demo usa
 * para enseñar el resultado. Un gate de igualdad daría 40 falsos positivos de 71, y un guardián
 * con falsos positivos es peor que ninguno: enseña a ignorarlo (LEARNINGS #2).
 *
 * Así que gatea lo que SÍ es un defecto sin discusión: que el snippet enseñe **un componente o
 * una propiedad que no existen**. Ese es el fallo que duele, porque el código de la doc se copia.
 *
 * AMPLIADO EL 2026-09-11, y por una pregunta de Rafa mirando `/#/components/button`: «¿el código
 * de cada uno en sc-docs está basado realmente en primeng?». El problema que destapó no es que la
 * doc no beba del tema —bebe, y no lo pisa en ningún sitio—, sino que en cada página hay DOS
 * textos, el que se muestra y el que se ejecuta, y nada los ataba. Sin exigir igualdad (40 falsos
 * positivos de 71), se añaden tres relaciones que sí son defecto, y las tres traen su caso REAL:
 *   (a) SUBCONJUNTO: lo que el snippet enseña, la demo viva lo pinta (`emptystate` enseñaba un
 *       `(cta)` que no existe en la plantilla);
 *   (d) COBERTURA INVERSA: lo que la demo viva pinta, el snippet lo enseña — la que caza el caso
 *       de Rafa: `#icons` de button renderiza `variant` y `fullWidth` y el código no los llevaba;
 *   (c) PROYECCIÓN: `<sc-select>` proyecta por `contentChild('item')` y su snippet enseñaba
 *       `pTemplate="item"`, la sintaxis vieja de PrimeNG, que al wrapper NO le llega.
 * Y (b) un TRINQUETE: cuántos inputs públicos no aparecen en ningún ejemplo ni knob de su página.
 *
 * Dos cosas por snippet:
 *   1. Todo tag `sc-*` que aparezca tiene que ser el selector de un componente del DS.
 *   2. Todo atributo o binding sobre ese tag tiene que ser un `input`/`model`/`output` suyo (o un
 *      atributo genérico de HTML/Angular). Un `model()` llamado `x` acepta además `xChange`, que
 *      es el output implícito del binding de dos vías — sin esa regla el gate marca tres falsos
 *      positivos, comprobado.
 *
 * Estado de arranque, medido: 478 atributos revisados, 0 tags inventados, 0 propiedades muertas.
 *
 * QUÉ HACER SI SE PONE ROJO:
 *   · «no existe el componente» → el snippet enseña un tag que se renombró o murió. Actualízalo.
 *   · «no tiene la propiedad» → la API cambió y la doc se quedó atrás. Actualiza el snippet, o el
 *     componente si el que está mal es él.
 *   · Si de verdad es un caso legítimo que el gate no sabe leer, entra en `PENDIENTES` con su
 *     motivo escrito. La lista solo mengua.
 *
 * ES ESTÁTICO y PURO respecto al texto (funciones exportadas → testeable).
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const log = (s = '') => process.stdout.write(s + '\n');
const sh = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
};

/**
 * Atributos que no son API del componente y por tanto no se comprueban: HTML de toda la vida,
 * ARIA, data-*, y la sintaxis estructural de Angular. Acotado a propósito: cuanto más ancho, menos
 * dice el gate.
 */
export const ATRIBUTO_GENERICO =
  /^(class|style|id|type|title|role|href|src|alt|width|height|name|value|placeholder|for|colspan|rowspan|hidden|tabindex|aria-[\w-]+|data-[\w-]+|ng[A-Z]\w*|\*\w+|#\w+)$/;

/** Lee la API pública de los componentes del DS: selector → props que acepta. */
export function apiDeComponentes(ficheros, leer = (f) => readFileSync(f, 'utf8')) {
  const api = {};
  for (const f of ficheros) {
    const t = leer(f);
    const sel = t.match(/selector:\s*'([^']+)'/);
    if (!sel) continue;
    const props = new Set();
    for (const [, nombre, tipo] of t.matchAll(/readonly (\w+)\s*=\s*(input|model|output)\b/g)) {
      props.add(nombre);
      // Un `model()` publica además el output implícito `<nombre>Change` del binding de dos vías.
      if (tipo === 'model') props.add(`${nombre}Change`);
    }
    api[sel[1]] = new Set([...(api[sel[1]] ?? []), ...props]);
  }
  return api;
}

/** Extrae las constantes `X_SNIPPET` de un fichero de demo. */
export function snippetsDe(ts) {
  return [...ts.matchAll(/const (\w+_SNIPPET)\s*=\s*`([\s\S]*?)`;/g)].map((m) => ({
    nombre: m[1],
    codigo: m[2],
  }));
}

/**
 * Tags `sc-*` de un snippet, con los nombres de atributo/binding que llevan encima.
 *
 * ⚠️ El **binding de dos sentidos** `[(x)]` lleva DOS corchetes antes del nombre, y la primera
 * versión solo admitía uno: `[(visible)]="open"` no se leía, así que el gate reclamaba ejemplo de
 * `visible` en diálogo, drawer y los dos diálogos de confirmación — que es justamente como se
 * abren en todos sus ejemplos. Cazado al bajar el trinquete, no al escribirlo.
 */
export function usosDe(codigo) {
  return [...codigo.matchAll(/<(sc-[a-z0-9-]+)([^>]*?)\/?>/g)].map(([, tag, crudo]) => ({
    tag,
    atributos: [...crudo.matchAll(/[\s([]{0,2}([a-zA-Z][\w-]*)[\])]{0,2}\s*=\s*"/g)].map((m) => m[1]),
  }));
}

/** Revisa UN snippet contra la API real. Devuelve la lista de problemas. */
export function revisarSnippet(ruta, nombre, codigo, api) {
  const problemas = [];
  for (const { tag, atributos } of usosDe(codigo)) {
    if (!api[tag]) {
      problemas.push([
        `${ruta} · ${nombre}: enseña \`<${tag}>\`, que no es ningún componente del DS.`,
        '      → el selector se renombró o murió: actualiza el snippet.',
      ]);
      continue;
    }
    for (const a of atributos) {
      if (ATRIBUTO_GENERICO.test(a)) continue;
      if (api[tag].has(a)) continue;
      problemas.push([
        `${ruta} · ${nombre}: enseña \`${a}\` sobre \`<${tag}>\`, que no lo tiene.`,
        '      → la API cambió y la doc se quedó atrás. El código de la doc se copia.',
      ]);
    }
  }
  return problemas;
}

/** Casos legítimos que el gate no sabe leer. Con su motivo, y solo mengua. */
export const PENDIENTES = {};

/**
 * Ruido de plantilla: lo que un snippet omite o añade sin que signifique nada (andamiaje de la
 * demo, ganchos de test, referencias locales). Distinto de `ATRIBUTO_GENERICO`, que sirve a la
 * comprobación de EXISTENCIA: aquí se decide qué se COMPARA entre snippet y demo viva.
 */
export const ATRIBUTO_RUIDO = /^(class|style|id|data-[\w-]+|#\w+|ng[A-Z]\w*|\*\w+)$/;

/**
 * Fontanería: inputs que un ejemplo no tiene por qué enseñar (accesibilidad, ids, hooks).
 *
 * ⚠️ `\w+AriaLabel` entra por PATRÓN y no por lista: `rowSelectionAriaLabel`,
 * `selectAllAriaLabel`, `clearAriaLabel` y `closeAriaLabel` se colaban en la cuenta de «sin
 * ejemplo» aunque son exactamente la misma clase de cosa que `ariaLabel`. Cuatro de los 66 no
 * eran deuda: eran un regex que no los cubría.
 */
export const INPUT_FONTANERIA =
  /^(inputId|name|ariaLabel|ariaLabelledBy|ariaDescribedBy|\w*AriaLabel|styleClass|panelStyleClass|autocomplete|inputmode|maxlength|minlength|cols|rows|locale|appendTo|key|tabindex|autofocus|dataKey|trackBy)$/;

/**
 * Fuera los comentarios HTML. Para la comprobación de EXISTENCIA sí cuentan (un comentario que
 * nombra un componente muerto sigue mintiendo), pero para COMPARAR con la demo viva no: el
 * snippet de `datatable` apunta en un comentario a `<sc-column-selector>`, que tiene su propia
 * página, y eso no es código que la story ejecute.
 */
export const sinComentariosHtml = (codigo) => codigo.replace(/<!--[\s\S]*?-->/g, '');

/** Los mismos usos, con el ruido fuera y los atributos en un Set (para comparar NOMBRES). */
export function usosNormalizados(codigo) {
  return usosDe(sinComentariosHtml(codigo)).map(({ tag, atributos }) => ({
    tag,
    atributos: new Set(atributos.filter((a) => !ATRIBUTO_RUIDO.test(a))),
  }));
}

/** Los bloques `<ng-template #ref>` de una plantilla, anclados a columna 0. */
export function plantillasDe(html) {
  const out = {};
  const re = /^<ng-template #([\w-]+)[^>]*>([\s\S]*?)^<\/ng-template>/gm;
  for (const m of html.matchAll(re)) out[m[1]] = m[2];
  return out;
}

/** Los objetos `{ … }` de primer nivel del `return [ … ]`, respetando backticks y anidamiento. */
function objetosDe(ts) {
  /* Hay MÁS de un `return [`: el guard `if (!pg) return [];` va antes del de verdad. Se recorren
   * todos y se acumula lo que encuentre cada uno (el vacío no aporta nada). */
  const out = [];
  for (const m of ts.matchAll(/return \[/g)) out.push(...desde(ts, m.index + m[0].length));
  return out;
}

function desde(ts, inicioBusqueda) {
  const out = [];
  let prof = 0;
  let inicio = -1;
  let tick = false;
  {
    for (let j = inicioBusqueda; j < ts.length; j += 1) {
    const c = ts[j];
    if (c === '`' && ts[j - 1] !== '\\') tick = !tick;
    if (tick) continue;
    if (c === '{') {
      if (prof === 0) inicio = j;
      prof += 1;
    } else if (c === '}') {
      prof -= 1;
      if (prof === 0 && inicio >= 0) out.push(ts.slice(inicio, j + 1));
    } else if (c === ']' && prof === 0) break;
    }
  }
  return out;
}

/**
 * Empareja cada story con SU `<ng-template #ref>` y con el snippet que enseña.
 *
 * La cadena es: `viewChild<TemplateRef<StoryContext>>('ref')` → `const local = this.prop()` →
 * `{ template: local, snippet: X_SNIPPET }`. El tipo `StoryContext` es lo que distingue una story
 * de otros `viewChild` de plantilla (el `#statusTpl` de datatable es `ScColumnCellContext`).
 */
export function historiasDe(ts) {
  const refDeProp = new Map();
  for (const [, prop, ref] of ts.matchAll(
    /readonly\s+(\w+)\s*=\s*viewChild(?:\.required)?<TemplateRef<StoryContext>>\(\s*'([\w-]+)'\s*\)/g,
  )) refDeProp.set(prop, ref);

  const refDeLocal = new Map();
  for (const [, local, prop] of ts.matchAll(/(?:const|let)\s+(\w+)\s*=\s*this\.(\w+)\(\)/g)) {
    if (refDeProp.has(prop)) refDeLocal.set(local, refDeProp.get(prop));
  }

  const constantes = new Map(snippetsDe(ts).map((s) => [s.nombre, s.codigo]));
  const historias = [];
  const usadas = new Set();
  for (const obj of objetosDe(ts)) {
    const tpl = obj.match(/\btemplate:\s*(\w+)/);
    if (!tpl) continue;
    const ref = refDeLocal.get(tpl[1]);
    if (!ref) continue;
    const porNombre = obj.match(/\bsnippet:\s*(\w+_SNIPPET)/);
    const enLinea = obj.match(/\bsnippet:\s*`([\s\S]*?)`/);
    if (porNombre) usadas.add(porNombre[1]);
    historias.push({
      story: obj.match(/\bname:\s*'([^']*)'/)?.[1] ?? ref,
      ref,
      nombre: porNombre ? porNombre[1] : null,
      codigo: porNombre ? (constantes.get(porNombre[1]) ?? '') : enLinea ? enLinea[1] : null,
      playground: /\bplayground:\s*true/.test(obj),
    });
  }
  const sinAtar = [...constantes.keys()].filter((n) => !usadas.has(n));
  return { historias, sinAtar };
}

/**
 * (a) SUBCONJUNTO. Cada `<sc-*>` del snippet tiene que tener homólogo del mismo tag en la demo
 * viva con, al menos, sus mismos NOMBRES de atributo. No se comparan valores: el snippet inlinea
 * los datos para que se lean (`[home]="{ icon: … }"`) donde la demo ata una variable, y eso es
 * bueno. Si el host no está en ESTA story (un `<sc-toast>` colocado una vez en la página), vale
 * encontrarlo en el resto de la página.
 */
export function revisarSubconjunto(ruta, nombre, codigo, plantilla, pagina = '') {
  const problemas = [];
  const enStory = usosNormalizados(plantilla);
  const enPagina = usosNormalizados(pagina);
  for (const u of usosNormalizados(codigo)) {
    const candidatos = [...enStory, ...enPagina].filter((v) => v.tag === u.tag);
    if (!candidatos.length) {
      problemas.push([
        `${ruta} · ${nombre}: enseña \`<${u.tag}>\` y la demo viva no lo pinta en ningún sitio.`,
        '      → o lo pones en la story, o el ejemplo enseña algo que nadie ve funcionando.',
      ]);
      continue;
    }
    const sobran = [...u.atributos].filter((a) => !candidatos.some((c) => c.atributos.has(a)));
    if (sobran.length) {
      problemas.push([
        `${ruta} · ${nombre}: enseña \`${sobran.join(', ')}\` sobre \`<${u.tag}>\` y la demo viva no lo pone.`,
        '      → el código que se copia tiene que ser el que está corriendo encima.',
      ]);
    }
  }
  return problemas;
}

/**
 * (d) COBERTURA INVERSA. Lo que la demo viva SÍ pinta sobre un `<sc-*>` tiene que aparecer en el
 * snippet. Es la regla que caza el caso real: `#icons` de button renderiza `variant` y
 * `fullWidth` y el código de debajo enseña cuatro botones sin ninguno de los dos.
 */
export function revisarCobertura(ruta, nombre, codigo, plantilla) {
  const problemas = [];
  const enSnippet = usosNormalizados(codigo);
  const porTag = new Map();
  for (const u of usosNormalizados(plantilla)) {
    if (!porTag.has(u.tag)) porTag.set(u.tag, new Set());
    for (const a of u.atributos) porTag.get(u.tag).add(a);
  }
  for (const [tag, atributos] of porTag) {
    const delSnippet = enSnippet.filter((u) => u.tag === tag);
    if (!delSnippet.length) continue; // el snippet no habla de ese tag: lo cubre (a), no esto
    const faltan = [...atributos].filter((a) => !delSnippet.some((u) => u.atributos.has(a)));
    if (faltan.length) {
      problemas.push([
        `${ruta} · ${nombre}: la demo pinta \`${faltan.join(', ')}\` sobre \`<${tag}>\` y el código no lo enseña. Faltan: \`${faltan.join(', ')}\``,
        '      → quien copie el snippet no obtiene lo que está viendo.',
      ]);
    }
  }
  return problemas;
}

/** Los slots con nombre que proyecta cada componente (`contentChild('x')`). */
export function slotsDeComponentes(ficheros, leer = (f) => readFileSync(f, 'utf8')) {
  const out = {};
  for (const f of ficheros) {
    const t = leer(f);
    const sel = t.match(/selector:\s*'([^']+)'/);
    if (!sel) continue;
    const slots = new Set();
    for (const [, nombre] of t.matchAll(/contentChild(?:\.required)?<[^(]*\(\s*'([\w-]+)'\s*\)/g)) slots.add(nombre);
    if (slots.size) out[sel[1]] = new Set([...(out[sel[1]] ?? []), ...slots]);
  }
  return out;
}

/**
 * (c) PROYECCIÓN. Un componente que proyecta por `contentChild('item')` se usa con
 * `<ng-template #item>`; `pTemplate="item"` es la sintaxis vieja de PrimeNG y NO le llega. El
 * snippet de `sc-select` la enseñaba mientras la demo de al lado ya usaba `#item`.
 */
export function revisarProyeccion(ruta, nombre, codigoCrudo, plantilla, slots) {
  const problemas = [];
  const codigo = sinComentariosHtml(codigoCrudo);
  for (const tag of Object.keys(slots)) {
    if (!codigo.includes(`<${tag}`)) continue;
    for (const [, slot] of codigo.matchAll(/<ng-template\s+pTemplate="([\w-]+)"/g)) {
      problemas.push([
        `${ruta} · ${nombre}: enseña \`pTemplate="${slot}"\` y \`<${tag}>\` proyecta por \`#${slot}\` (contentChild).`,
        '      → `pTemplate` es la sintaxis vieja de PrimeNG: al wrapper no le llega.',
      ]);
    }
    for (const [, slot] of codigo.matchAll(/<ng-template\s+#([\w-]+)/g)) {
      if (slots[tag].has(slot)) continue;
      problemas.push([
        `${ruta} · ${nombre}: enseña \`#${slot}\` dentro de \`<${tag}>\`, que no proyecta ese slot.`,
        `      → los que acepta: ${[...slots[tag]].join(', ')}.`,
      ]);
    }
  }
  return problemas;
}

/** Solo `input`/`model` (la API que se PONE en la etiqueta), sin los outputs. */
export function inputsDeComponentes(ficheros, leer = (f) => readFileSync(f, 'utf8')) {
  const out = {};
  for (const f of ficheros) {
    const t = leer(f);
    const sel = t.match(/selector:\s*'([^']+)'/);
    if (!sel) continue;
    const props = new Set();
    for (const [, nombre] of t.matchAll(/readonly (\w+)\s*=\s*(?:input|model)\b/g)) props.add(nombre);
    if (props.size) out[sel[1]] = new Set([...(out[sel[1]] ?? []), ...props]);
  }
  return out;
}

/**
 * Los nombres de los knobs del Playground (`meta.argTypes`).
 *
 * ⚠️ Se recorta contando CORCHETES, no con un regex perezoso hasta el primer `],`. Un knob con
 * `options: ['a', 'b']` en varias líneas cierra un corchete antes que el bloque, y el regex se
 * paraba ahí: en `sc-dialog` leía 9 de 20 knobs y el gate reclamaba ejemplo de `draggable`,
 * `resizable` y `dismissableMask`, que llevaban su control desde siempre. Un guardián que pide
 * lo que ya está hecho enseña a ignorarlo (LEARNINGS #2).
 */
export function argTypesDe(ts) {
  const out = new Set();
  const i = ts.indexOf('argTypes:');
  if (i < 0) return out;
  const abre = ts.indexOf('[', i);
  if (abre < 0) return out;
  let prof = 0;
  let fin = abre;
  let tick = false;
  for (let j = abre; j < ts.length; j += 1) {
    const c = ts[j];
    if (c === '`' && ts[j - 1] !== '\\') tick = !tick;
    if (tick) continue;
    if (c === '[') prof += 1;
    else if (c === ']') {
      prof -= 1;
      if (prof === 0) { fin = j; break; }
    }
  }
  for (const [, n] of ts.slice(abre, fin).matchAll(/\bname:\s*'([\w-]+)'/g)) out.add(n);
  return out;
}

/**
 * (b) Inputs públicos del componente que la página no enseña NI como ejemplo NI como knob.
 * Va por TRINQUETE y no por lista: sembrar 90 excepciones sería un vertedero, y una lista que
 * nadie lee es peor que un número que solo puede bajar.
 */
export function inputsSinEjemplo(tag, codigos, knobs, inputs) {
  const declara = inputs[tag];
  if (!declara) return [];
  const enSnippets = new Set();
  for (const c of codigos) for (const u of usosNormalizados(c)) if (u.tag === tag) for (const a of u.atributos) enSnippets.add(a);
  return [...declara].filter((p) => !INPUT_FONTANERIA.test(p) && !enSnippets.has(p) && !knobs.has(p)).sort();
}

/**
 * Divergencias snippet↔demo aceptadas, con su motivo escrito. Solo mengua, y una entrada que ya
 * pasa en verde también pone rojo: una excepción caducada miente sobre lo que falta.
 */
export const DIVERGENCIAS = {
  'sectioncard/sectioncard-demo.component.ts#LIENZO_SNIPPET':
    'El snippet enseña `[headingLevel]="1"`, que es lo que se escribe en una pantalla con índice ' +
    'lateral, y la story renderiza el 2 porque la ficha de sc-docs YA tiene su `<h1>` (lo gatea ' +
    '`audit:titulo-contenido`). Desde DD-61 los dos niveles se ven igual, así que la story no ' +
    'pierde nada; el ejemplo sí perdería si enseñara el 2.',
};

/**
 * Tope del trinquete de (b): **CERO**. Todo input público del DS sale en un ejemplo de su página
 * o en un control de su Playground.
 *
 * Arrancó en 66 el 2026-09-11, bajó a 55 al día siguiente y a 0 el 2026-09-12. De los 66:
 *   · **11 nunca fueron deuda, era el gate**, y las tres veces el fallo era leer de menos —
 *     `\w+AriaLabel` pedido por nombre en vez de por patrón; los knobs cortados en el primer
 *     `],` cuando un control tenía sus `options` en varias líneas (9 de 20 en `sc-dialog`); el
 *     binding de DOS sentidos `[(x)]` no reconocido, que es justo como se abre un diálogo; y los
 *     snippets escritos EN LÍNEA en la story, que no son constantes. Un guardián que reclama lo
 *     que ya está hecho enseña a ignorarlo (LEARNINGS #2), y por eso cada uno lleva su test rojo.
 *   · **el resto se documentó**: dos stories nuevas de campo (`sc-select`, `sc-multiselect`), una
 *     de `sc-datepicker`, snippets explícitos de Playground para los cinco componentes que se
 *     abren con estado (`sc-dialog`, `sc-drawer`, los dos de confirmación y el modal masivo) y
 *     knobs donde la propiedad se prueba tocándola.
 *
 * En CERO el gate cambia de significado: ya no mide deuda, protege. Un input nuevo sin ejemplo
 * pone el gate en rojo el día que se añade, que es cuando cuesta un minuto documentarlo.
 */
export const INPUTS_SIN_EJEMPLO_MAX = 0;

/* ── main ──────────────────────────────────────────────────────────────────── */
if (process.argv[1] && process.argv[1].endsWith('audit-doc-snippets.mjs')) {
  const componentes = sh(
    "find projects/ui-smartcontact/src/lib/components -name '*.component.ts' -not -path '*/node_modules/*'",
  )
    .split('\n')
    .filter(Boolean);
  const demos = sh(
    "find projects/sc-docs/src/app/pages/components -name '*-demo.component.ts' -not -path '*/node_modules/*'",
  )
    .split('\n')
    .filter(Boolean)
    .sort();

  if (!componentes.length || !demos.length) {
    log('✗ audit:doc-snippets: no encuentro componentes o demos — ¿estás en la raíz del repo?');
    process.exit(1);
  }

  const api = apiDeComponentes(componentes);
  const slots = slotsDeComponentes(componentes);
  const inputs = inputsDeComponentes(componentes);
  const problemas = [];
  let nSnippets = 0;
  let nAtributos = 0;
  let nPares = 0;
  let nInputsSueltos = 0;
  const sueltosPorTag = [];

  for (const ruta of demos) {
    const ts = readFileSync(ruta, 'utf8');
    const corta = ruta.replace(/^.*\/components\//, '');
    for (const { nombre, codigo } of snippetsDe(ts)) {
      nSnippets += 1;
      for (const u of usosDe(codigo)) nAtributos += u.atributos.length;
      if (PENDIENTES[`${ruta}#${nombre}`]) continue;
      problemas.push(...revisarSnippet(corta, nombre, codigo, api));
    }

    // ── el snippet contra la demo viva ─────────────────────────────────────
    const html = ruta.replace(/\.ts$/, '.html');
    const plantillas = existsSync(html) ? plantillasDe(readFileSync(html, 'utf8')) : {};
    const pagina = Object.values(plantillas).join('\n');
    const { historias, sinAtar } = historiasDe(ts);
    for (const n of sinAtar) {
      problemas.push([
        `${corta} · ${n}: la constante existe y ninguna story la usa.`,
        '      → o la atas a su story, o sobra: un ejemplo que no se pinta no se puede comprobar.',
      ]);
    }
    for (const h of historias) {
      if (!h.codigo || h.playground) continue; // el Playground se serializa de sus args
      const plantilla = plantillas[h.ref];
      if (plantilla === undefined) {
        problemas.push([
          `${corta} · ${h.story}: apunta a \`#${h.ref}\` y esa plantilla no está en el .html.`,
          '      → la story no puede pintar nada; revisa el nombre de la referencia.',
        ]);
        continue;
      }
      nPares += 1;
      const clave = `${corta}#${h.nombre ?? h.ref}`;
      if (DIVERGENCIAS[clave]) continue;
      problemas.push(...revisarSubconjunto(corta, h.nombre ?? h.story, h.codigo, plantilla, pagina));
      problemas.push(...revisarCobertura(corta, h.nombre ?? h.story, h.codigo, plantilla));
      problemas.push(...revisarProyeccion(corta, h.nombre ?? h.story, h.codigo, plantilla, slots));
    }

    // ── (b) trinquete de inputs sin ejemplo ────────────────────────────────
    const tag = ts.match(/tag:\s*'([\w-]+)'/)?.[1];
    if (tag) {
      /* Los códigos salen de las HISTORIAS, no de `snippetsDe`: hay snippets escritos EN LÍNEA en
       * la story (`snippet: \`…\``) que no son constantes, y contarlos fuera hacía que el gate
       * reclamara ejemplo de `columns` y `storageKey` en `sc-column-selector`, que los enseña
       * desde siempre en su propio ejemplo. */
      const codigos = historias.map((x) => x.codigo).filter((x) => typeof x === 'string');
      const faltan = inputsSinEjemplo(tag, codigos, argTypesDe(ts), inputs);
      if (faltan.length) {
        nInputsSueltos += faltan.length;
        sueltosPorTag.push(`${tag}: ${faltan.join(', ')}`);
      }
    }
  }

  for (const clave of Object.keys(DIVERGENCIAS)) {
    const [rutaCorta, nombre] = clave.split('#');
    const completa = demos.find((d) => d.endsWith(rutaCorta));
    const vive = completa && historiasDe(readFileSync(completa, 'utf8')).historias.some((h) => (h.nombre ?? h.ref) === nombre);
    if (!vive) {
      problemas.push([`${clave}: DIVERGENCIAS lo cita y ya no existe.`, '      → quita su entrada de la lista.']);
    }
  }

  if (nInputsSueltos > INPUTS_SIN_EJEMPLO_MAX) {
    problemas.push([
      `${nInputsSueltos} input(s) público(s) sin ejemplo ni knob y el tope es ${INPUTS_SIN_EJEMPLO_MAX}.`,
      '      → enseña el input nuevo en algún snippet de su página, o dale su knob en el Playground.',
    ]);
  } else if (nInputsSueltos < INPUTS_SIN_EJEMPLO_MAX) {
    problemas.push([
      `${nInputsSueltos} input(s) sin ejemplo y el tope sigue en ${INPUTS_SIN_EJEMPLO_MAX}.`,
      `      → baja INPUTS_SIN_EJEMPLO_MAX a ${nInputsSueltos} en scripts/audit-doc-snippets.mjs (un tope holgado deja volver lo que ya salió).`,
    ]);
  }

  for (const clave of Object.keys(PENDIENTES)) {
    const [ruta, nombre] = clave.split('#');
    const ts = demos.includes(ruta) ? readFileSync(ruta, 'utf8') : '';
    if (!snippetsDe(ts).some((s) => s.nombre === nombre)) {
      problemas.push([
        `${clave}: PENDIENTES lo cita y ya no existe.`,
        '      → quita su entrada de la lista.',
      ]);
    }
  }

  log(
    `audit:doc-snippets — ${demos.length} demo(s), ${nSnippets} snippet(s) escritos a mano, ` +
      `${nAtributos} atributo(s) contra la API de ${Object.keys(api).length} componentes · ` +
      `${nPares} par(es) snippet↔demo viva · ${nInputsSueltos} input(s) sin ejemplo (tope ${INPUTS_SIN_EJEMPLO_MAX}) ` +
      `(pendientes: ${Object.keys(PENDIENTES).length}, divergencias: ${Object.keys(DIVERGENCIAS).length})\n`,
  );
  if (sueltosPorTag.length && process.argv.includes('--inputs')) {
    log('  Inputs sin ejemplo ni knob (para irlos bajando):');
    for (const l of sueltosPorTag) log(`    · ${l}`);
    log('');
  }

  if (!problemas.length) {
    log('✓ audit:doc-snippets OK — el código que enseña la doc existe, es el que la demo viva ejecuta, y proyecta como el componente proyecta.');
    process.exit(0);
  }

  log('✗ audit:doc-snippets — el código que enseña la doc no es el que ejecuta:');
  for (const [linea, fix] of problemas) {
    log(`  · ${linea}`);
    log(fix);
  }
  process.exit(1);
}
