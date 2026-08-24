#!/usr/bin/env node
/**
 * AUDIT · el acoplamiento a los INTERNOS de PrimeNG.
 *
 * POR QUÉ. Es la deuda estructural más grande del repo, medida: 36 clases
 * `.p-*` distintas usadas desde SELECTORES de nuestro SCSS. **No son API
 * pública.** Una
 * subida de PrimeNG puede renombrar cualquiera y entonces las pantallas
 * revierten al aspecto del preset —filas de 42px, cabecera oscura— **sin que
 * falle ni un solo test de comportamiento**, porque el comportamiento sigue
 * intacto. Es el fallo silencioso más caro que tiene este proyecto.
 *
 * CÓMO. No mira el DOM: muchas de esas clases solo existen con un overlay
 * abierto (`.p-select-option`), así que un barrido de página daría rojos falsos
 * y cobertura parcial. Mira el CÓDIGO DE PRIMENG: si una clase de la que
 * dependemos ya no aparece en `node_modules/primeng`, es que la han renombrado.
 * Estático, completo, sin navegador, y corre dentro de `verify`.
 *
 * QUÉ HACER SI SE PONE ROJO. NO bajes el listón. Es literalmente el aviso de
 * que la actualización te ha cambiado el aspecto por debajo: busca el nombre
 * nuevo en el changelog de PrimeNG y actualiza el selector en nuestro SCSS.
 *
 * Y EL OBJETIVO DE VERDAD es que este número BAJE. Cada `.p-*` que se pueda
 * sustituir por una clase propia o un token es un punto menos de fragilidad.
 * El guardián avisa de que no crezca; reducirlo es trabajo aparte.
 */
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';

const log = (s = '') => process.stdout.write(s + '\n');
const sh = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
};

/**
 * Tope de acoplamiento. No es una meta, es un trinquete: que no CREZCA sin que
 * alguien lo decida a conciencia. Si lo bajas porque has quitado dependencias,
 * perfecto — actualiza el número. Si lo subes, escribe por qué.
 */
const TOPE = 36;

/* Cuenta las clases `.p-*` que aparecen en SELECTORES, no en comentarios. Un
 * comentario que menciona `.p-datatable-*` para explicar POR QUÉ dependemos de
 * ella no es una dependencia nueva — contarlo inflaba el número (y peor: un
 * glob como `.p-datatable-*` entraba como una "clase" fantasma con guion al
 * final). Se listan los ficheros que tienen algún `.p-`, se les quitan los
 * comentarios de bloque y de línea, y solo entonces se extraen las clases. */
const ficheros = sh(
  "grep -rl '\\.p-' --include='*.scss' projects/supervisor/src projects/ui-smartcontact/src",
)
  .split('\n')
  .filter(Boolean);

const sinComentarios = (scss) =>
  scss.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');

const usados = [
  ...new Set(
    ficheros.flatMap((f) => {
      try {
        return [...sinComentarios(readFileSync(f, 'utf8')).matchAll(/\.p-[a-z0-9]+(?:-[a-z0-9]+)*/g)].map(
          (m) => m[0].replace(/^\./, ''),
        );
      } catch {
        return [];
      }
    }),
  ),
].sort();

/* Un grep POR CLASE en vez de cargar PrimeNG en memoria: `execSync` trae un
 * búfer de 1 MB por defecto y su bundle lo desborda de largo — la primera
 * versión reportaba «no encuentro PrimeNG» cuando lo que pasaba es que no
 * cabía. Un mensaje de error que miente sobre su propia causa es peor que un
 * fallo. */
const existeEnPrimeng = (clase) =>
  sh(`grep -rlF '${clase}' node_modules/primeng/fesm2022/ 2>/dev/null | head -1`).trim().length > 0;

if (!existeEnPrimeng('p-button')) {
  log('✗ audit:primeng-coupling: no encuentro el código de PrimeNG en node_modules — ¿falta `npm ci`?');
  process.exit(1);
}

const huerfanos = usados.filter((c) => !existeEnPrimeng(c));

log(`audit:primeng-coupling — ${usados.length} clase(s) interna(s) de PrimeNG usadas desde nuestro SCSS\n`);

if (huerfanos.length) {
  log('  Estas clases YA NO EXISTEN en PrimeNG. Tu CSS apunta al vacío:');
  for (const c of huerfanos) {
    log(`  ✗ .${c}`);
    for (const f of sh(`grep -rl '\\.${c}' --include='*.scss' projects/`).split('\n').filter(Boolean).slice(0, 4)) {
      log(`      ${f}`);
    }
  }
  log('\n  → Busca el nombre nuevo en el changelog de PrimeNG. NO borres la regla');
  log('    sin sustituirla: el estilo que aplicaba sigue haciendo falta.');
}

if (usados.length > TOPE) {
  log(`\n  ✗ el acoplamiento CRECIÓ: ${usados.length} clases contra un tope de ${TOPE}.`);
  log('    Cada `.p-*` nuevo es un punto más donde una subida de versión te');
  log('    cambia el aspecto en silencio. Si es inevitable, sube el TOPE en');
  log('    este script y di por qué en el commit.');
}

/* ══════════════════════════════════════════════════════════════════════════
 * SECCIÓN B · el NOMBRE DE ELEMENTO — la cara que a la sección A se le escapa
 * ══════════════════════════════════════════════════════════════════════════
 *
 * La sección A vigila las clases `.p-*`: que PrimeNG no las borre bajo
 * nuestros pies. Es la mitad del problema. La otra mitad la descubrimos
 * MIGRANDO a PrimeNG 22 (2026-08-25), y no la habría cazado nadie:
 *
 *   · `sc-datatable` decidía si un `mousedown` había empezado sobre la casilla
 *     con `closest('p-tablecheckbox')`;
 *   · la migración pasó la plantilla a `<p-table-checkbox>` (kebab);
 *   · el tag renderizado cambió, `closest` devolvió `null` para siempre, y la
 *     selección por rango con Mayús quedó MUERTA sin un solo error en consola.
 *
 * Lo mismo, otra vez, en `e2e/cuscare`: el test buscaba `p-multiselect` y la
 * plantilla pasó a escribir `<p-multi-select>`.
 *
 * ⚠️ Y el detalle que hay que entender bien: **PrimeNG no nos rompió**. Declara
 * `selector: "p-table-checkbox, p-tablecheckbox"` — acepta las dos grafías a
 * propósito para que una subida no rompa a nadie. Lo que rompió fue que
 * NUESTRO código dependía en secreto del tag que NUESTRA plantilla escribe, y
 * esos dos ficheros no se leen juntos jamás. El proveedor puso la red; nosotros
 * saltamos por debajo.
 *
 * INVARIANTE QUE FIJA ESTO: si consultas un elemento `p-*` desde JavaScript o
 * desde un test, la grafía tiene que ser EXACTAMENTE la que escribe alguna
 * plantilla nuestra. Consultar una grafía mientras escribes otra es el bug, y
 * es estático — se ve sin navegador y sin abrir un overlay.
 *
 * Lo que NO es rojo: consultar un elemento que PrimeNG pinta por dentro y que
 * nosotros nunca escribimos (p. ej. `p-checkbox` dentro de `p-table-checkbox`).
 * Eso es legítimo, y la sección A ya cubre su fragilidad. */

const raiz = (dir) => {
  const out = [];
  const rec = (d) => {
    let entradas;
    try {
      entradas = readdirSync(d);
    } catch {
      return;
    }
    for (const e of entradas) {
      if (e === 'node_modules' || e === 'dist' || e.startsWith('.')) continue;
      const full = `${d}/${e}`;
      if (statSync(full).isDirectory()) rec(full);
      else out.push(full);
    }
  };
  rec(dir);
  return out;
};

const sinComentariosTs = (ts) =>
  ts.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const ficherosTodos = [...raiz('projects'), ...raiz('e2e')];

/* Tags que ESCRIBIMOS. Es la referencia: el DOM real lleva lo que diga esto. */
const escritos = new Set();
for (const f of ficherosTodos.filter((f) => f.endsWith('.html'))) {
  for (const m of readFileSync(f, 'utf8').matchAll(/<(p-[a-z][a-z0-9-]*)/g)) escritos.add(m[1]);
}

/* Tags que CONSULTAMOS desde código: `closest`, `matches`, `querySelector*` y
 * el `locator` de Playwright. Solo elementos — un `.p-x` es una clase y va por
 * la sección A. */
const CONSULTA = /(?:closest|matches|querySelectorAll|querySelector|locator)\(\s*(['"`])([^'"`]*)\1/g;
const TAG_ELEM = /(?<![\w.#-])p-[a-z][a-z0-9-]*/g;
const consultados = new Map();
for (const f of ficherosTodos.filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'))) {
  const txt = sinComentariosTs(readFileSync(f, 'utf8'));
  for (const [, , sel] of txt.matchAll(CONSULTA)) {
    for (const tag of sel.match(TAG_ELEM) ?? []) {
      if (!consultados.has(tag)) consultados.set(tag, new Set());
      consultados.get(tag).add(f);
    }
  }
}

const plano = (t) => t.replace(/-/g, '');

/* B1 · UNA sola grafía por elemento en TODO el repo.
 *
 * Sin esta regla, B2 no puede ser exacta: si el DS escribe `<p-multiselect>` y
 * CusCare `<p-multi-select>`, una consulta a cualquiera de las dos "existe en
 * alguna plantilla" y el gate la deja pasar — que es justo lo que hizo la
 * primera versión de este chequeo, y por eso no cazó el bug para el que se
 * escribió. Un gate que no se pone rojo con el fallo que lo motivó no es un
 * gate; probarlo con el fallo puesto es parte de escribirlo.
 *
 * Con una grafía única, "consultas X y nadie escribe X" pasa a ser una
 * afirmación exacta. */
const porNombre = new Map();
for (const t of escritos) {
  const k = plano(t);
  if (!porNombre.has(k)) porNombre.set(k, []);
  porNombre.get(k).push(t);
}
const grafiasDobles = [...porNombre.values()].filter((v) => v.length > 1);

const desajustes = [];
const alVacio = [];
for (const [tag, donde] of consultados) {
  if (escritos.has(tag)) continue;
  const otra = [...escritos].find((e) => plano(e) === plano(tag));
  if (otra) desajustes.push({ tag, otra, donde: [...donde] });
  else if (!existeEnPrimeng(tag)) alVacio.push({ tag, donde: [...donde] });
}

log(
  `audit:primeng-coupling — ${consultados.size} elemento(s) \`p-*\` consultados desde código, contra ${escritos.size} escritos en plantillas\n`,
);

for (const { tag, otra, donde } of desajustes) {
  log(`  ✗ consultas \`${tag}\` pero tus plantillas escriben \`${otra}\``);
  log('     El DOM lleva lo que escribe la plantilla, así que esa consulta no');
  log('     casa con NADA — y no lanza ningún error: simplemente no encuentra.');
  for (const f of donde.slice(0, 4)) log(`       ${f}`);
}
for (const variantes of grafiasDobles) {
  log(`  ✗ dos grafías del MISMO elemento conviviendo: ${variantes.map((v) => `\`${v}\``).join(' y ')}`);
  log('     PrimeNG acepta las dos, así que las pantallas se ven bien y nada');
  log('     falla — pero cualquier consulta desde JS o desde un test acierta en');
  log('     una y falla en la otra, en silencio. Elige una y usa solo esa.');
  for (const v of variantes) {
    for (const f of ficherosTodos.filter((f) => f.endsWith('.html') && readFileSync(f, 'utf8').includes(`<${v}`)).slice(0, 3)) {
      log(`       ${v} → ${f}`);
    }
  }
}
for (const { tag, donde } of alVacio) {
  log(`  ✗ consultas \`${tag}\`, que no lo escribe ninguna plantilla nuestra NI existe en PrimeNG`);
  for (const f of donde.slice(0, 4)) log(`       ${f}`);
}

/* ══════════════════════════════════════════════════════════════════════════
 * SECCIÓN C · ENTRADAS que el proveedor deja de aceptar
 * ══════════════════════════════════════════════════════════════════════════
 *
 * La tercera cara del mismo fallo, y la más traicionera de las tres. Medida el
 * 2026-08-25: PrimeNG 22 retiró la entrada `styleClass` de `p-table`,
 * `p-select`, `p-multiselect`, `p-inputgroup` y `p-panel` — pero **no** de
 * `p-menu`, `p-popover`, `p-button`, `p-dialog`… La retirada es POR
 * COMPONENTE, así que no vale mirar "¿existe styleClass en PrimeNG?": hay que
 * mirar si LO ACEPTA ESE componente.
 *
 * Y por qué no salta nadie: un atributo ESTÁTICO (`styleClass="cc-table"`)
 * sobre un componente que ya no lo declara **no es un error para Angular**. Se
 * queda en el DOM como atributo suelto, inerte. La clase nunca llega, el CSS
 * que colgaba de ella nunca aplica, y la pantalla se ve "casi bien". Con
 * `[styleClass]="expr"` sí habría error de compilación (NG8002) — o sea que la
 * forma que MENOS parece un binding es justo la que rompe en silencio.
 *
 * Coste real cuando pasó: 42 tests de CusCare en rojo a la vez, por tres
 * atributos. Sin un solo error en consola.
 *
 * Se lee la metadata COMPILADA de PrimeNG (`inputs: {…}` por componente), que
 * es la única fuente que no se puede quedar desfasada respecto al paquete
 * instalado. */

/* No es una lista de sospechosos: se comprueban TODAS las entradas estáticas
 * que escribimos sobre un `p-*`, menos los atributos que son de HTML y no del
 * componente (`class`, `id`, `role`, `aria-*`, `data-*`…). Empezó siendo solo
 * `styleClass` —el caso medido— y generalizarlo destapó otro en el acto:
 * `<p-message text="…">`, que v22 también retiró en favor del contenido
 * proyectado. Un gate que solo mira el caso que ya conoces solo caza el pasado. */
const ATRIBUTOS_HTML = new Set([
  'id', 'class', 'style', 'title', 'role', 'type', 'name', 'value', 'autofocus',
  'tabindex', 'placeholder', 'disabled', 'hidden', 'width', 'height', 'alt',
  'src', 'href', 'target', 'rel', 'for', 'lang', 'dir',
]);
const esHtmlPuro = (a) =>
  ATRIBUTOS_HTML.has(a) || /^(data-|aria-|ng)/i.test(a);

const DECL = /type:\s*\w+,\s*isStandalone:\s*\w+,\s*selector:\s*"([^"]+)",\s*inputs:\s*\{(.*?)\}\s*,\s*(?:outputs|host|providers|queries|ngImport|usesInheritance|viewQueries|template)/gs;
const entradasDe = new Map();
for (const f of readdirSync('node_modules/primeng/fesm2022').filter((f) => f.endsWith('.mjs'))) {
  const txt = readFileSync(`node_modules/primeng/fesm2022/${f}`, 'utf8');
  for (const [, selector, inputs] of txt.matchAll(DECL)) {
    const nombres = [...inputs.matchAll(/(\w+):\s*[{"]/g)].map((m) => m[1]);
    for (const sel of selector.split(',').map((x) => x.trim())) {
      if (!sel.startsWith('p-')) continue;
      if (!entradasDe.has(sel)) entradasDe.set(sel, new Set());
      for (const n of nombres) entradasDe.get(sel).add(n);
    }
  }
}

const inertes = [];
for (const f of ficherosTodos.filter((f) => f.endsWith('.html'))) {
  const txt = readFileSync(f, 'utf8');
  for (const m of txt.matchAll(/<(p-[\w-]+)((?:[^<>]|\n)*?)>/g)) {
    const acepta = entradasDe.get(m[1]);
    if (!acepta) continue;
    for (const a of m[2].matchAll(/(?:^|\s)([a-zA-Z][\w]*)=/g)) {
      const entrada = a[1];
      if (esHtmlPuro(entrada) || acepta.has(entrada)) continue;
      inertes.push({ tag: m[1], entrada, f, linea: txt.slice(0, m.index).split('\n').length });
    }
  }
}

for (const { tag, entrada, f, linea } of inertes) {
  log(`  ✗ \`${entrada}\` sobre \`<${tag}>\` — ese componente ya NO acepta esa entrada`);
  log('     Al ser un atributo estático, Angular no se queja: se queda inerte en');
  log('     el DOM y la clase nunca llega. Pásalo a `class="…"`.');
  log(`       ${f}:${linea}`);
}

const problemasB =
  desajustes.length + alVacio.length + grafiasDobles.length + inertes.length;
if (problemasB) {
  log('\n  → Arréglalo igualando la grafía, y si el gesto es NUESTRO (un guard, un');
  log('    ancla de selección) deja de depender del tag del proveedor: pon una');
  log('    clase propia en la plantilla y consulta ESA. Un renombrado no puede');
  log('    apagar en silencio algo que solo depende de nosotros.');
}

const problemas = huerfanos.length + (usados.length > TOPE ? 1 : 0) + problemasB;
if (problemas === 0) {
  log(
    `✓ audit:primeng-coupling OK — las ${usados.length} clases siguen existiendo, el acoplamiento no crece (tope ${TOPE}), los ${consultados.size} elementos consultados casan con lo que escribimos, y ninguna entrada quedó inerte.`,
  );
  process.exit(0);
}
log(`\n✗ audit:primeng-coupling: ${problemas} problema(s).`);
process.exit(1);
