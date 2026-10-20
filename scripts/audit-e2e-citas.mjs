#!/usr/bin/env node
/**
 * AUDIT · ninguna e2e cita un texto ni una clase que este cambio ha retirado.
 *
 * POR QUÉ EXISTE. Las suites e2e solo las corre el CI (DD-154, LEARNINGS #7) y, en local, se corren las del bloque
 * tocado. Una spec de OTRO bloque que sigue citando un texto de i18n o una clase que el cambio quitó o reescribió no se
 * ve hasta el CI, y cada vuelta cuesta unos 40 minutos. En los PR #471 y #472 (fichas de grupo y agente, DD-217)
 * enrojecieron así `barrido-campos` (el error del teléfono, sin el punto final que el cambio quitó),
 * `text-styles-applied` (el rótulo que la ficha dejó de pintar a mano) y `vacio-con-palabra` («Sin canales»).
 *
 * QUÉ MIRA. Lo que la rama retira respecto a su base (el merge-base con `origin/main`, como `ci-cambios.mjs`), contra el
 * árbol de trabajo, y lo busca como LITERAL en `e2e/` (sin mirar los comentarios: un «antes, …» no es una cita):
 *   · TEXTOS: los valores de cualquier `…/assets/i18n/es.json` de `projects/` que cambian o desaparecen. No cuentan los
 *     de menos de 4 caracteres, los que solo cambian de espacios o mayúsculas, ni los que ya nadie dice: ni otra clave de
 *     un `es.json` (un texto que se MOVIÓ), ni una plantilla o un `.ts`. Excepción: una FRASE de 30 caracteres o más que
 *     sigue en otra clave pero se reescribió en la suya (casi igual: otra puntuación, otra palabra) sí cuenta, porque la
 *     spec que la cita entera habla del sitio que cambió. Una cita lo es si un literal de la línea ES el texto entero
 *     (una cadena) o lo lleva dentro (una regex); «Guardar» no cita «Guardar cambios». `{{variable}}` casa con una
 *     palabra o un número, y pide 10 caracteres fijos para no citar a otro.
 *   · CLASES: las clases que una plantilla (`.html`, o `template:` de un `.ts`) deja de declarar (`class`, `styleClass`,
 *     `ngClass`, `[class.x]`…) y que no son palabra en ningún `.html`, `.ts`, `.scss` ni `.css` de `projects/`. Una de una
 *     sola palabra se busca como selector (`.nombre` dentro de una cadena: `.first()` no cita la clase `first`); una con
 *     `-` o `_`, como palabra suelta.
 * No cuenta una aserción de que algo NO está (`.not.`, `toHaveCount(0)`, `toBeHidden`, `:not(.x)`), también cuando el
 * localizador se guarda en una variable y se afirma más abajo: citar lo que ya no existe es lo que dice. Un texto que hoy
 * sigue DENTRO de otro más largo solo se rompe con una comparación del texto entero (`toHaveText('…')`).
 *
 * QUÉ HACER SI SE PONE ROJO. Cada línea dice `spec:línea → valor viejo → valor nuevo`: pon en la spec el valor nuevo. Si la
 * cita sigue siendo cierta, `// sc:cita-ok` en esa línea o en la anterior la deja pasar.
 *
 * LO QUE NO VE (medido en #471/#472): un texto corto que sigue en otra clave (`vacio-con-palabra`: «Sin canales» se
 * mudó de pantalla y la cadena sigue existiendo), una clase que otras plantillas siguen usando (`text-styles-applied`:
 * `.field__label` salió del alta de grupo, no del resto), un texto que el código cambia sin tocar `es.json`, una clase
 * que una plantilla compone en código, y una aserción de ausencia que la spec reparte en varias frases. Para eso hace
 * falta saber qué pantalla visita cada spec, y eso no es un grep. Medido contra los 1000 últimos commits de `main`, todos
 * con el CI en verde: 2 con falsos positivos (7 citas, de clases que una plantilla compone en código o que un manifiesto
 * cita como dato). Es un grep barato delante del CI, no lo sustituye.
 *
 * DÓNDE CORRE. `verify` (el CI lo corre con la historia entera) y la PUERTA BARATA de `preflight:scope --run`, que lo ve en
 * segundos y no en el minuto cuatro. Sin base (`origin/main` sin traer o un clon superficial) no puede responder y lo dice;
 * `--fetch` la refresca, y `--base <ref>` mira contra otra.
 *
 * Es PURO respecto a lo leído (`revisar`, `textosRetirados`, `clasesRetiradas`: testeables sin git); `analizar` lo lee de git.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const log = (s = '') => process.stdout.write(s + '\n');

export const LONGITUD_MINIMA = 4;
/** Con `{{variable}}` el comodín casa con un trozo corto; lo fijo tiene que ser lo bastante largo para no citar a otro («{{name}} (copia)»). */
export const LONGITUD_MINIMA_CON_VARIABLE = 10;
/** Cuánto puede valer una `{{variable}}` en la cita: un número o una palabra, no media frase. */
const COMODIN = '\\S{1,12}';
/**
 * Desde esta longitud (y con espacios) un texto es una frase de un sitio concreto: si sigue en otra clave pero en la
 * suya cambió de redacción, la spec que la cita entera probablemente habla del sitio que cambió. Más corto («Crear»,
 * «Agentes»), mil specs lo citan por la clave que sigue diciéndolo.
 */
export const LONGITUD_FRASE = 30;
/** Desde esta longitud un valor dentro de una regex es una cita aunque la regex diga más. */
const LONGITUD_FRASE_EN_REGEX = 12;
/** Lo que, en la línea de la cita o en la anterior, deja pasar una cita que sigue siendo cierta. */
export const EXENCION = 'sc:cita-ok';

/** Espacios colapsados (el NBSP incluido): Playwright compara el texto así, y un cambio solo de espacios no rompe nada. */
export const normaliza = (s) => String(s).replace(/\s+/g, ' ').trim();

/** La clave con la que se comparan textos: sin diferencias de espacios ni de mayúsculas (Playwright no las distingue por defecto). */
const comparable = (s) => normaliza(s).toLowerCase();

const escaparRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── Textos ─────────────────────────────────────────────────────────────────────────────────────

/** `{ 'a.b.c': 'valor' }` de un JSON anidado: solo las hojas de texto. */
export function aplanar(valor, ruta = '', salida = new Map()) {
  if (typeof valor === 'string') salida.set(ruta, valor);
  else if (valor && typeof valor === 'object') {
    for (const [k, v] of Object.entries(valor)) aplanar(v, ruta ? `${ruta}.${k}` : k, salida);
  }
  return salida;
}

/** Distancia de edición entre dos textos (Levenshtein); los textos de i18n son cortos y esto se llama pocas veces. */
export function distancia(a, b) {
  let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const fila = [i];
    for (let j = 1; j <= b.length; j++) {
      fila[j] = Math.min(previa[j] + 1, fila[j - 1] + 1, previa[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previa = fila;
  }
  return previa[b.length];
}

/** El texto sin el nombre de sus variables: `{{count}} agentes` y `{{n}} agentes` se pintan igual. */
export const forma = (s) => comparable(s).replace(/\{\{[^}]*\}\}/g, '{}');

const esFrase = (n) => n.length >= LONGITUD_FRASE && /\s/.test(n);

/**
 * Los textos que ESTE `es.json` cambia o pierde y que ya nadie dice. Un valor que sigue vivo en OTRA clave solo se
 * da por cambiado si es una frase reescrita en sitio (el mismo mensaje con otra puntuación u otra palabra): si está
 * en otra clave porque se MOVIÓ, la pantalla lo sigue diciendo.
 * @param {Map<string,string>} antes  hojas del fichero en la base
 * @param {Map<string,string>} despues hojas del fichero ahora (vacío si lo borró)
 * @param {ReadonlySet<string>} vivos  la `forma` de cada valor que hay hoy en cualquier `es.json`
 * @param {(n: string) => boolean} enCodigo ¿lo sigue diciendo el código (plantillas y `.ts`, sin comentarios)?
 * @param {(n: string) => boolean} contenidoEn ¿es parte de algún valor de hoy? (los textos de `es.json`, ver `valoresVivos`)
 * @returns {{ tipo: 'texto', viejo: string, nuevos: (string|null)[], ampliado: boolean }[]} uno por valor viejo;
 *   `null` = la clave ya no existe; `ampliado` = hoy se sigue diciendo, dentro de un texto más largo
 */
export function textosRetirados(antes, despues, vivos, enCodigo = () => false, contenidoEn = () => false) {
  const porValor = new Map();
  for (const [clave, viejo] of antes) {
    const nuevo = despues.get(clave);
    if (nuevo === viejo) continue;
    const n = normaliza(viejo);
    const fijo = n.replace(/\{\{[^}]*\}\}/g, '').trim().length;
    if (fijo < (n.includes('{{') ? LONGITUD_MINIMA_CON_VARIABLE : LONGITUD_MINIMA)) continue;
    if (nuevo !== undefined && forma(nuevo) === forma(n)) continue;
    if (vivos.has(forma(n))) {
      const reescrita = esFrase(n) && nuevo !== undefined && distancia(comparable(n), comparable(nuevo)) <= Math.max(3, Math.floor(n.length * 0.12));
      if (!reescrita) continue;
    } else if (enCodigo(n)) continue;
    const ampliado = (nuevo !== undefined && forma(nuevo).includes(forma(n))) || contenidoEn(forma(n));
    const e = porValor.get(n) ?? { tipo: 'texto', viejo: n, nuevos: [], ampliado };
    e.ampliado &&= ampliado;
    const valor = nuevo === undefined ? null : normaliza(nuevo);
    if (!e.nuevos.includes(valor)) e.nuevos.push(valor);
    porValor.set(n, e);
  }
  return [...porValor.values()];
}

// ── Clases ─────────────────────────────────────────────────────────────────────────────────────

const ATRIBUTO_CLASE = /(?<![\w.-])(\[?)(\w*[cC]lass)\]?\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const BINDING_CLASE = /\[class\.([\w-]+)\]/g;
const CLASE_VALIDA = /^[A-Za-z_][\w-]{2,}$/;
const CADENA = /'([^']*)'|"([^"]*)"/g;

/** Las clases que declara una plantilla, en el orden en que aparecen. Lo dinámico (`{{ }}`) solo aporta sus cadenas. */
export function clasesDePlantilla(texto) {
  const clases = new Set();
  const anota = (token) => {
    if (CLASE_VALIDA.test(token)) clases.add(token);
  };
  const cadenasDe = (expresion) => {
    for (const [, a, b] of expresion.matchAll(CADENA)) (a ?? b).split(/\s+/).forEach(anota);
  };
  for (const [, corchete, , doble, simple] of texto.matchAll(ATRIBUTO_CLASE)) {
    const valor = doble ?? simple;
    if (corchete) {
      cadenasDe(valor);
      continue;
    }
    for (const [, expresion] of valor.matchAll(/\{\{([\s\S]*?)\}\}/g)) cadenasDe(expresion);
    valor.replace(/\{\{[\s\S]*?\}\}/g, ' ').split(/\s+/).forEach(anota);
  }
  for (const [, clase] of texto.matchAll(BINDING_CLASE)) anota(clase);
  return clases;
}

/** La parte de un fichero que es plantilla: todo el `.html`, o los `template: \`…\`` de un `.ts`. */
export function plantillaDe(ruta, contenido) {
  if (contenido == null) return '';
  if (ruta.endsWith('.html')) return contenido;
  if (!ruta.endsWith('.ts')) return '';
  return [...contenido.matchAll(/\btemplate\s*:\s*`([\s\S]*?)`/g)].map((m) => m[1]).join('\n');
}

/**
 * Las clases que un fichero deja de declarar y que ya no está en ningún sitio.
 * @param {ReadonlySet<string>} tokensVivos las palabras de todo `projects/` (html, ts, scss, css)
 * @returns {{ tipo: 'clase', viejo: string, nuevos: string[], fichero: string }[]} `nuevos` = clases que SÍ gana esa plantilla
 */
export function clasesRetiradas(ruta, antes, despues, tokensVivos) {
  const a = clasesDePlantilla(plantillaDe(ruta, antes));
  const d = clasesDePlantilla(plantillaDe(ruta, despues));
  const ganadas = [...d].filter((c) => !a.has(c));
  return [...a]
    .filter((c) => !d.has(c) && !tokensVivos.has(c))
    .map((viejo) => ({ tipo: 'clase', viejo, nuevos: ganadas.slice(0, 3), fichero: ruta }));
}

// ── Las e2e ────────────────────────────────────────────────────────────────────────────────────

/** El mismo texto, con los comentarios en blanco (y los saltos de línea intactos, para conservar los números de línea). */
export function sinComentarios(texto) {
  let fuera = '';
  let i = 0;
  let comilla = null;
  while (i < texto.length) {
    const c = texto[i];
    const d = texto[i + 1];
    if (comilla) {
      fuera += c;
      if (c === '\\') {
        fuera += d ?? '';
        i += 2;
        continue;
      }
      // Una comilla simple o doble sin cerrar a fin de línea es un apóstrofo de una regex, no una cadena.
      if (c === comilla || (c === '\n' && comilla !== '`')) comilla = null;
      i++;
      continue;
    }
    if (c === '/' && d === '/') {
      while (i < texto.length && texto[i] !== '\n') {
        fuera += ' ';
        i++;
      }
      continue;
    }
    if (c === '/' && d === '*') {
      const fin = texto.indexOf('*/', i + 2);
      const cuerpo = texto.slice(i, fin < 0 ? texto.length : fin + 2);
      fuera += cuerpo.replace(/[^\n]/g, ' ');
      i += cuerpo.length;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') comilla = c;
    fuera += c;
    i++;
  }
  return fuera;
}

const CADENAS_DE_LINEA = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
const REGEX_DE_LINEA = /(?<![\w)\].])\/(?![/*])((?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^/\\\n[])+)\/([dgimsuvy]*)/g;
const HUECO = '\u0001';

/** Lo que compara el texto ENTERO: ahí un texto al que solo se ha añadido algo (o que ahora vive dentro de otro) ya no casa; con «contiene», sí. */
const EXACTA = /\.(?:toHaveText|toHaveValue|toHaveAccessibleName|toHaveAccessibleDescription|toBe|toEqual|toStrictEqual)\(/;

/** Una aserción de que algo NO está: citar lo que ya no existe es lo que dice, así que sigue siendo cierta. */
const AUSENCIA = /\.not\.|\btoHaveCount\(\s*0\s*\)|\btoBeHidden\(|\.count\(\)\s*\)\s*\.toBe\(\s*0\s*\)/;

/** Los literales de una línea de código: sus cadenas (con `${…}` como hueco) y sus regex (sin escapes, anclas ni `\b`). */
export function literalesDe(codigo) {
  const cadenas = [];
  let sinCadenas = codigo;
  for (const m of codigo.matchAll(CADENAS_DE_LINEA)) {
    cadenas.push(normaliza(m[2].replace(/\$\{[^}]*\}/g, HUECO).replace(/\\(.)/g, '$1')));
    sinCadenas = sinCadenas.replace(m[0], ' '.repeat(m[0].length));
  }
  const regex = [...sinCadenas.matchAll(REGEX_DE_LINEA)].map((m) =>
    normaliza(m[1].replace(/\\[sS]\+?|\\u00a0|\\xa0/g, ' ').replace(/\\b/g, '').replace(/\\(.)/g, '$1').replace(/^\^|\$$/g, '')),
  );
  return { cadenas, regex };
}

/** ¿Cita la línea de código (sin comentarios) esta clase? Ver «QUÉ MIRA» arriba. */
function citaLaClase(codigo, clase) {
  const sinExclusiones = codigo.replace(/:not\([^)]*\)/g, ' '); // `:not(.x)` dice que NO está
  if (/[-_]/.test(clase)) return new RegExp(`(?<![\\w-])${escaparRe(clase)}(?![\\w-])`).test(sinExclusiones);
  const selector = new RegExp(`\\.${escaparRe(clase)}(?![\\w-])`);
  return [...sinExclusiones.matchAll(CADENAS_DE_LINEA)].some((m) => selector.test(m[2]));
}

/**
 * El buscador de un texto viejo: ¿es alguno de los literales de la línea ESE texto entero (o lo contiene una regex)?
 * Una cadena que solo lo contiene es otra frase: «Guardar» no es «Guardar cambios». `{{variable}}` casa con una
 * palabra o un número. Una palabra suelta se compara con sus mayúsculas (`'supervisor'` es una ruta, no «Supervisor»).
 */
function citaElTexto(viejo) {
  const frase = /\s/.test(viejo) || viejo.includes('{{');
  const k = frase ? comparable(viejo) : viejo;
  const f = (t) => (frase ? comparable(t) : t);
  const trozos = k.split(/\{\{[^}]*\}\}/);
  const entera = trozos.length === 1 ? (c) => f(c) === k : ((re) => (c) => re.test(f(c)))(new RegExp(`^${trozos.map(escaparRe).join(COMODIN)}$`));
  // En una regex, la palabra suelta dentro de otra frase no es una cita (`/…mayor nivel/` no cita «Nivel»): ha de ser el valor entero o uno largo.
  const dentro =
    trozos.length === 1
      ? (t) => f(t) === k || (k.length >= LONGITUD_FRASE_EN_REGEX && f(t).includes(k))
      : ((re) => (t) => re.test(f(t)))(new RegExp(trozos.map(escaparRe).join(COMODIN)));
  return (literales) => (literales.cadenas.some(entera) ? 'cadena' : literales.regex.some(dentro) ? 'regex' : null);
}

/**
 * Cada cita en `e2e` de algo retirado.
 * @param {{ tipo: 'texto'|'clase', viejo: string, nuevos: (string|null)[], fichero?: string }[]} retirados
 * @param {{ ruta: string, texto: string }[]} e2e
 * @returns {{ spec: string, linea: number, tipo: string, viejo: string, nuevos: (string|null)[], fichero?: string }[]}
 */
export function revisar(retirados, e2e) {
  if (!retirados.length) return [];
  const buscadores = retirados.map((r) => ({
    r,
    cita: r.tipo === 'texto' ? citaElTexto(r.viejo) : null,
  }));
  const citas = [];
  for (const { ruta, texto } of e2e) {
    const originales = texto.split('\n');
    const lineas = sinComentarios(texto).split('\n');
    lineas.forEach((codigo, i) => {
        if (!codigo.trim() || AUSENCIA.test(codigo)) return;
        if (originales[i].includes(EXENCION) || (i > 0 && originales[i - 1].includes(EXENCION))) return;
        const literales = literalesDe(codigo);
        for (const { r, cita } of buscadores) {
          const casa = r.tipo === 'texto' ? cita(literales) : citaLaClase(codigo, r.viejo);
          // Un texto que hoy sigue dentro de otro más largo solo se rompe si la spec lo compara ENTERO (una cadena, no una regex).
          if (casa && r.tipo === 'texto' && r.ampliado && !(casa === 'cadena' && EXACTA.test(codigo))) continue;
          if (casa && !seAfirmaAusenteDespues(lineas, i)) citas.push({ spec: ruta, linea: i + 1, tipo: r.tipo, viejo: r.viejo, nuevos: r.nuevos, fichero: r.fichero });
        }
    });
  }
  return citas;
}

/**
 * `const avisos = page.locator(…)` y, más abajo, `expect(avisos).toHaveCount(0)`; o el `relleno` de
 * `for (const [seccion, relleno] of [[…, 'texto']])` y su `getByText(relleno).toHaveCount(0)`: la cita se guarda para decir que no está.
 */
function seAfirmaAusenteDespues(lineas, i) {
  const nombres = [];
  const declarado = /^\s*(?:const|let)\s+(\w+)\s*=/.exec(lineas[i])?.[1];
  if (declarado) nombres.push(declarado);
  for (let j = i; j >= Math.max(0, i - 8); j--) {
    const bucle = /\bfor\s*\(\s*(?:const|let)\s*\[([^\]]+)\]\s*of\b/.exec(lineas[j]);
    if (bucle) nombres.push(...bucle[1].split(',').map((n) => n.trim()).filter(Boolean));
  }
  if (!nombres.length) return false;
  const usos = nombres.map((n) => new RegExp(`\\b${n}\\b`));
  return lineas.slice(i + 1, i + 41).some((l) => AUSENCIA.test(l) && usos.some((u) => u.test(l)));
}

/** `spec:línea → viejo → nuevo`, la línea que se imprime. */
export function describir(c) {
  if (c.tipo === 'texto') {
    const nuevo = c.nuevos.map((n) => (n === null ? '(la clave ya no existe)' : `«${n}»`)).join(' | ');
    return `${c.spec}:${c.linea} → «${c.viejo}» → ${nuevo}`;
  }
  const ahora = c.nuevos.length ? c.nuevos.map((n) => `.${n}`).join(' ') : '(ninguna que la sustituya)';
  return `${c.spec}:${c.linea} → .${c.viejo} (ya no sale en ${c.fichero}) → ${ahora}`;
}

// ── Lectura del repo ───────────────────────────────────────────────────────────────────────────

const OMITIDAS = new Set(['node_modules', 'dist', '.angular', '.git']);

function* ficherosDe(dir, extension) {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir)) {
    if (OMITIDAS.has(e)) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) yield* ficherosDe(p, extension);
    else if (extension.test(e)) yield p;
  }
}

const ES_JSON = /\/assets\/i18n\/es\.json$/;
const PLANTILLA = /\.(html|ts)$/;
const PALABRA = /[\w-]+/g;

/**
 * La `forma` de todos los valores de todos los `es.json` de `projects/` tal y como están hoy: el conjunto, y
 * `contenido(n)`, que dice si `n` es parte de alguno (un texto que ahora vive dentro de otro más largo).
 */
export function valoresVivos(raiz) {
  const vivos = new Set();
  for (const f of ficherosDe(join(raiz, 'projects'), /^es\.json$/)) {
    if (!ES_JSON.test(f.split('\\').join('/'))) continue;
    for (const v of aplanar(JSON.parse(readFileSync(f, 'utf8'))).values()) vivos.add(forma(v));
  }
  const todo = [...vivos].join('\u0000');
  return { vivos, contenido: (n) => todo.includes(n) };
}

/**
 * El código y los estilos de `projects/`, leídos una vez: sus palabras (`[\w-]+`, para las clases) y el texto de las
 * plantillas y los `.ts` sin comentarios, normalizado (para saber si el código sigue diciendo un texto retirado).
 */
export function leerCodigo(raiz) {
  const palabras = new Set();
  const trozos = [];
  for (const f of ficherosDe(join(raiz, 'projects'), /\.(html|ts|scss|css)$/)) {
    const texto = readFileSync(f, 'utf8');
    for (const p of texto.match(PALABRA) ?? []) palabras.add(p);
    if (f.endsWith('.html')) trozos.push(texto.replace(/<!--[\s\S]*?-->/g, ' '));
    else if (f.endsWith('.ts')) trozos.push(sinComentarios(texto));
  }
  const codigo = comparable(trozos.join('\n'));
  return { palabras, dice: (texto) => texto.split(/\{\{[^}]*\}\}/).map(comparable).filter((t) => t.length >= LONGITUD_MINIMA).every((t) => codigo.includes(t)) };
}

export function leerE2e(raiz) {
  return [...ficherosDe(join(raiz, 'e2e'), /\.(m?[jt]s)$/)].map((f) => ({
    ruta: relative(raiz, f).split('\\').join('/'),
    texto: readFileSync(f, 'utf8'),
  }));
}

/**
 * Lo que la rama cambia en `projects/` respecto a su base, leído de git y del árbol de trabajo.
 * Devuelve `{ cambiados: { ruta, antes, despues }[], base }` o `{ error }` cuando no puede responder.
 */
export function leerCambio({ cwd = process.cwd(), base = 'origin/main', fetch = false } = {}) {
  // Las `GIT_*` heredadas se tiran: dentro de un hook de git (`GIT_DIR`) apuntan a otro repositorio que el de `cwd`.
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));
  const git = (...args) => execFileSync('git', args, { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 });
  if (fetch) {
    try {
      git('fetch', '--quiet', 'origin', 'main');
    } catch {
      /* sin red: se compara contra lo que ya hay */
    }
  }
  let punto;
  try {
    punto = git('merge-base', base, 'HEAD').trim();
  } catch {
    return {
      error: `no hay punto común con \`${base}\` (¿sin traer, o un clon superficial?): \`git fetch origin main\` (en un workflow, \`fetch-depth: 0\`) y repite.`,
    };
  }
  const cambiados = git('diff', '--name-status', '--no-renames', punto, '--', 'projects')
    .split('\n')
    .filter(Boolean)
    .map((l) => l.split('\t'))
    .filter(([, ruta]) => ES_JSON.test(ruta) || PLANTILLA.test(ruta))
    .map(([estado, ruta]) => {
      const abs = join(cwd, ruta);
      return {
        ruta,
        antes: estado === 'A' ? null : git('show', `${punto}:${ruta}`),
        despues: estado === 'D' || !existsSync(abs) ? null : readFileSync(abs, 'utf8'),
      };
    });
  return { cambiados, base: punto };
}

/**
 * El análisis entero sobre un árbol: qué retira la rama y quién lo cita.
 * `{ citas, textos, clases, specs }` o `{ error }`. Lo llaman el `main` de aquí y la puerta barata del preflight.
 */
export function analizar({ cwd = process.cwd(), base = 'origin/main', fetch = false } = {}) {
  const cambio = leerCambio({ cwd, base, fetch });
  if (cambio.error) return { error: cambio.error };
  const retirados = [];
  const jsons = cambio.cambiados.filter((c) => ES_JSON.test(c.ruta));
  const plantillas = cambio.cambiados.filter((c) => !ES_JSON.test(c.ruta) && c.antes != null);
  const codigo = jsons.some((c) => c.antes != null) || plantillas.length ? leerCodigo(cwd) : null;
  if (jsons.some((c) => c.antes != null)) {
    const { vivos, contenido } = valoresVivos(cwd);
    const enCodigo = codigo.dice;
    for (const c of jsons) {
      if (c.antes == null) continue;
      const despues = c.despues == null ? new Map() : aplanar(JSON.parse(c.despues));
      retirados.push(...textosRetirados(aplanar(JSON.parse(c.antes)), despues, vivos, enCodigo, contenido));
    }
  }
  if (plantillas.length) {
    for (const c of plantillas) retirados.push(...clasesRetiradas(c.ruta, c.antes, c.despues, codigo.palabras));
  }
  const e2e = leerE2e(cwd);
  return {
    citas: revisar(retirados, e2e),
    textos: retirados.filter((r) => r.tipo === 'texto').length,
    clases: retirados.filter((r) => r.tipo === 'clase').length,
    specs: e2e.length,
  };
}

/* ── main ──────────────────────────────────────────────────────────────────── */
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--base');
  let r;
  try {
    r = analizar({ base: i >= 0 ? args[i + 1] : 'origin/main', fetch: args.includes('--fetch') });
  } catch (e) {
    r = { error: `no pudo leer el árbol: ${e.message}` };
  }
  if (r.error) {
    log(`✗ audit:e2e-citas — ${r.error}`);
    process.exit(1);
  }
  if (r.citas.length) {
    log(`✗ audit:e2e-citas — ${r.citas.length} cita(s) en e2e/ de algo que este cambio retiró (${r.textos} texto(s) y ${r.clases} clase(s) retirados):\n`);
    for (const c of r.citas) log(`  ${describir(c)}`);
    log(`\n  Pon en la spec el valor nuevo. Si la cita sigue siendo cierta, \`// ${EXENCION}\` en esa línea o en la anterior.`);
    process.exit(1);
  }
  log(`✓ audit:e2e-citas — la rama retira ${r.textos} texto(s) y ${r.clases} clase(s); ninguno lo cita ninguno de los ${r.specs} ficheros de e2e/.`);
}
