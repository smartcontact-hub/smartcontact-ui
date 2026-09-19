#!/usr/bin/env node
/**
 * audit:components — clasificación AUTO-generada del DS (Fase 2). La "pokédex" dev-facing.
 *
 * Recorre `projects/ui-smartcontact/src/lib/components/*` y DERIVA del CÓDIGO (no a mano):
 *   - provenance:  CUSTOM (sin import de `primeng/<x>`) vs WRAPPER. Los wrapper se sub-clasifican
 *                  STANDARD (passthrough) vs EXTENDED (CVA o API propia) por heurística +
 *                  override curado (component-audit-map.mjs, lo confirma Rafa).
 *   - primengBase: el/los módulo(s) `primeng/*` que envuelve (XxxModule).
 *   - cva / inputs: señales de "extended" (implementa ControlValueAccessor · nº de input() propios).
 *   - anidados:    otros `sc-*` en su plantilla (excluye sc-icon = primitivo).
 *   - demo:        ¿tiene página en component-pages.ts? (si no, y no está exento → ROJO).
 *   - dónde-se-usa: nº de usos del selector en `projects/supervisor` (adopción en la app real).
 *
 * Salida: manifiesto `docs/_component-status.json` + tabla regenerada en la zona @audit:components
 * de `docs/inventory.md`. Guard `check` (en verify): el manifiesto está al día + ningún componente
 * se queda sin clasificar o sin demo (salvo exentos) → la pokédex no se desfasa.
 *
 * Uso:  node scripts/component-audit.mjs [--emit | --write | check]
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { rewriteRegion } from './marker-rewrite.mjs';
import { PROVENANCE_OVERRIDE, DEMO_EXEMPT, PRIMENG_UTIL, NESTED_IGNORE } from './component-audit-map.mjs';
import { apiConHerencia } from '../tools/primeng-doc.mjs';

const root = resolve(import.meta.dirname, '..');
const COMPONENTS = resolve(root, 'projects/ui-smartcontact/src/lib/components');
const SUPERVISOR = resolve(root, 'projects/supervisor/src');
const PAGES = resolve(root, 'projects/sc-docs/src/app/pages/components/component-pages.ts');
const INVENTORY = resolve(root, 'docs/inventory.md');
const MANIFEST = resolve(root, 'docs/_component-status.json');
const API_MANIFEST = resolve(root, 'projects/sc-docs/public/components/_component-api.json');
const INFORME = resolve(root, 'docs/AUDIT-PRIMENG-SUPERVISOR.md');
const log = (s = '') => process.stdout.write(s + '\n');

/** Lee todo el texto de un árbol (.ts/.html) en un solo string — para contar usos del selector. */
function blob(dir) {
  let out = '';
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = resolve(dir, e.name);
    if (e.isDirectory()) out += blob(p);
    else if (/\.(ts|html)$/.test(e.name)) out += readFileSync(p, 'utf8') + '\n';
  }
  return out;
}

/* Los comentarios NO son código. Se quitan antes de contar/clasificar: un docstring que
 * MENCIONA `input()` o `ControlValueAccessor` no es un input ni un CVA. Cazado el 2026-08-14
 * migrando `sc-button` a señales (DD-38): añadir al docstring la frase "API pública
 * `input()/output()`" subió su cuenta de 15 a **16 inputs** en el manifiesto generado, sin que
 * el componente hubiera cambiado de superficie. Y la convención nueva empuja justo a escribir
 * eso en los docstrings, así que el falso positivo iba a repetirse. Mismo gesto que en
 * `audit-primeng-coupling.mjs` y `audit-api-era.mjs`. */
export const sinComentarios = (ts) =>
  ts.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');

/** Índice del cierre que casa con el `abre` que hay en `i`. -1 si no cierra. */
function cierraEn(texto, i, abre, cierra) {
  let n = 0;
  for (let j = i; j < texto.length; j++) {
    if (texto[j] === abre) n++;
    else if (texto[j] === cierra) {
      n--;
      if (n === 0) return j;
    }
  }
  return -1;
}

/** El primer argumento de una lista, respetando anidamiento y comillas (`input(false, { … })`). */
function primerArgumento(args) {
  let prof = 0;
  let comilla = null;
  for (let i = 0; i < args.length; i++) {
    const c = args[i];
    if (comilla) {
      if (c === comilla && args[i - 1] !== '\\') comilla = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') comilla = c;
    else if ('([{<'.includes(c)) prof++;
    else if (')]}>'.includes(c)) prof--;
    else if (c === ',' && prof === 0) return args.slice(0, i).trim();
  }
  return args.trim();
}

/**
 * Los miembros PÚBLICOS de un componente, uno a uno: nombre, clase, tipo, valor por defecto, si
 * es obligatorio y su DESCRIPCIÓN. PURA respecto al texto → testeable.
 *
 * ⚠️ Trabaja sobre el texto CRUDO, no sobre el despojado por `sinComentarios()`. Es justo al
 * revés que el resto del audit, y a propósito: lo que se busca aquí ES el comentario. Pasarle
 * el texto limpio daría 0 descripciones sin fallar, que es el peor modo de fallo posible.
 *
 * Por qué no vale un regex de una línea (medido el 2026-09-19): 9 de las 514 declaraciones del
 * DS llevan genéricos ANIDADOS —`input<readonly ScColumnDef<T>[]>([])`— y un `<[^>]*>` corta en
 * el primer `>`, partiendo el tipo por la mitad. El tipo y los argumentos se leen por BALANCEO.
 *
 * El tipo, cuando no se declara, se INFIERE del valor por defecto, que es como lo infiere
 * TypeScript: `input('')` es `string`, `input(false, { transform: booleanAttribute })` es
 * `boolean`. Decir «—» ahí sería perder información que está escrita.
 */
export function miembrosPublicos(tsRaw) {
  const out = [];
  const RE = /(?:^|\n)[ \t]*readonly\s+(\w+)\s*=\s*(input|model|output)(\.required)?\s*/g;
  for (const m of tsRaw.matchAll(RE)) {
    const [, nombre, clase, requerido] = m;
    let p = m.index + m[0].length;
    let tipo = '';
    if (tsRaw[p] === '<') {
      const fin = cierraEn(tsRaw, p, '<', '>');
      if (fin === -1) continue;
      tipo = tsRaw.slice(p + 1, fin).trim();
      p = fin + 1;
    }
    let porDefecto = '';
    if (tsRaw[p] === '(') {
      const fin = cierraEn(tsRaw, p, '(', ')');
      if (fin === -1) continue;
      const args = tsRaw.slice(p + 1, fin).trim();
      if (clase !== 'output' && args) porDefecto = primerArgumento(args);
      if (!tipo && /transform:\s*booleanAttribute/.test(args)) tipo = 'boolean';
      if (!tipo && porDefecto) {
        if (/^['"`]/.test(porDefecto)) tipo = 'string';
        else if (/^(true|false)$/.test(porDefecto)) tipo = 'boolean';
        else if (/^-?[\d.]+$/.test(porDefecto)) tipo = 'number';
        else if (/^\[/.test(porDefecto)) tipo = 'unknown[]';
      }
    }
    out.push({
      nombre,
      clase: clase === 'output' ? 'output' : clase, // input | model | output
      tipo: tipo || '—',
      porDefecto: porDefecto || null,
      requerido: Boolean(requerido),
      descripcion: jsdocAntesDe(tsRaw, m.index + (m[0].startsWith('\n') ? 1 : 0)),
    });
  }
  return out;
}

/**
 * La descripción del bloque `/** … *\/` que hay encima de la posición `i`, o `null`.
 *
 * Entre el bloque y el miembro puede haber COMENTARIOS DE LÍNEA, y hay que saltarlos: en
 * `sc-search` el `output` lleva su JSDoc, luego un `// eslint-disable-next-line
 * @angular-eslint/no-output-native`, y luego la declaración. Cortar en el `//` perdía una
 * descripción escrita y buena. Cazado al contrastar este lector contra otro independiente:
 * discrepaban en 3 miembros de 514, y los 3 eran de verdad — dos fallos del otro (no veía un
 * JSDoc que cierra en la misma línea que el texto, `… *\/`) y este.
 */
function jsdocAntesDe(tsRaw, i) {
  let antes = tsRaw.slice(0, i).replace(/[ \t\r\n]+$/, '');
  while (/(^|\n)[ \t]*\/\/[^\n]*$/.test(antes)) antes = antes.replace(/(^|\n)[ \t]*\/\/[^\n]*$/, '').replace(/[ \t\r\n]+$/, '');
  if (!antes.endsWith('*/')) return null;
  const abre = antes.lastIndexOf('/**');
  if (abre === -1) return null;
  const cuerpo = antes.slice(abre + 3, antes.length - 2);
  const texto = cuerpo
    .split('\n')
    .map((l) => l.replace(/^\s*\*\s?/, '').trim())
    .filter((l) => l && !l.startsWith('@'))
    .join(' ')
    .trim();
  return texto || null;
}

/**
 * El CONTRATO de un componente: cada miembro público, cruzado con la API nativa de la versión
 * de PrimeNG INSTALADA.
 *
 * Para qué (2026-09-19). DD-113 manda meter el nativo tal cual y no usar ninguna prop obsoleta,
 * pero hasta hoy nada comprobaba que una prop nuestra marcada como passthrough SIGA existiendo
 * en PrimeNG. `audit-datatable-slots` ya hacía exactamente esto para las 38 ranuras de
 * `sc-datatable` —«si una subida renombra o quita una ranura, nuestro `contentChild` apunta al
 * vacío en silencio»— y el modo de fallo es el mismo a nivel de prop. Esto lo generaliza.
 *
 * `origen` responde a «¿de quién es esta prop?»:
 *   · `nativo`        — PrimeNG la documenta con ese mismo nombre. Su descripción y su default
 *                       son los suyos; no hay que reescribirlos.
 *   · `nuestro`       — no existe en PrimeNG: la añadimos nosotros y hay que documentarla.
 *   · `sin-verificar` — no se pudo leer la API instalada (sin `node_modules`). **No se dice
 *                       `nuestro`**: sería afirmar algo que no se ha medido.
 *
 * `nativas` es un Map nombre→prop de PrimeNG, o `null` si no se pudo leer → PURA y testeable.
 */
export function contratoDe(tsRaw, nativas) {
  return miembrosPublicos(tsRaw).map((m) => {
    const nat = nativas?.get(m.nombre) ?? null;
    return {
      ...m,
      origen: nativas == null ? 'sin-verificar' : nat ? 'nativo' : 'nuestro',
      nativo: nat
        ? {
            descripcion: nat.descripcion || null,
            porDefecto: nat.porDefecto || null,
            obsoleta: nat.obsoleta || null,
            heredadaDe: nat.heredadaDe ?? null,
          }
        : null,
    };
  });
}

/** Analiza un componente. PURA respecto a los textos pasados → testeable. */
export function analyzeComponent({ name, tsText: tsRaw, htmlText, pagesText, supervisorBlob, nativas = null }) {
  const tsText = sinComentarios(tsRaw);
  const selector = (tsText.match(/selector:\s*['"]([^'"]+)['"]/) || [])[1] || `sc-${name}`;
  // primeng base: imports `from 'primeng/<x>'` con x ∉ utilidades.
  const primeng = modulosPrimeng(tsRaw);
  const provenance = primeng.length ? 'WRAPPER' : 'CUSTOM';
  const cva = /ControlValueAccessor|NG_VALUE_ACCESSOR/.test(tsText);
  /* `model()` cuenta como input, y esto NO es un detalle de conteo.
   *
   * Un `model()` ES un input (más su `xChange`), pero el patrón `model\s*[<(]`
   * no lo casaba y la migración a señales de DD-38 lo destapó: al pasar
   * `sc-drawer` y `sc-panel` de `@Input()` + `@Output()` a `model()`, el
   * manifiesto los bajó de 8→7 y 4→3 inputs y RECLASIFICÓ `sc-panel` de
   * EXTENDED a STANDARD — sin que su superficie pública hubiera cambiado ni un
   * miembro. La heurística de sub-clasificación mira `inputs >= 4`, así que un
   * conteo corto no es cosmético: cambia la etiqueta del componente.
   *
   * Medido el 2026-08-24. Mismo espíritu que el despojado de comentarios de
   * arriba: el manifiesto tiene que contar lo que el componente EXPONE, no lo
   * que se parezca a la sintaxis de ayer. */
  const inputs =
    (tsText.match(/(?:^|[^.\w])input\s*[<(]/g) || []).length +
    (tsText.match(/(?:^|[^.\w])model\s*[<(]/g) || []).length +
    (tsText.match(/@Input\(/g) || []).length;

  /* Los NOMBRES de la API pública, no solo cuántos hay.
   *
   * Con un conteo, añadir o quitar un input se caza (11 → 10 desfasa el
   * manifiesto y el audit se pone rojo), pero un RENAME es invisible: el número
   * no se mueve. Y un rename es justo el cambio que rompe a un consumidor.
   * Guardando los nombres, cualquier cambio de la superficie del DS aparece en
   * el diff del manifiesto y hay que mirarlo a conciencia antes de commitear.
   *
   * Es la instantánea de `public-api` que hacía falta, sin script nuevo ni
   * comando nuevo que recordar: vive dentro del audit que ya corría. */
  const nombresApi = [
    ...new Set([
      ...[...tsText.matchAll(/readonly\s+(\w+)\s*=\s*(?:input|model|output)\s*[<(]/g)].map((m) => m[1]),
      /* El `xChange` de cada `model()` es API PÚBLICA aunque no se escriba: es
       * la mitad del doble binding y un consumidor puede engancharse a él. Sin
       * esto, cambiar un `@Output() xChange` por un `model()` borraba `xChange`
       * del manifiesto y el diff parecía una retirada de API que no existió. */
      ...[...tsText.matchAll(/readonly\s+(\w+)\s*=\s*model\s*[<(]/g)].map((m) => `${m[1]}Change`),
      ...[...tsText.matchAll(/@(?:Input|Output)\(\)\s*(?:readonly\s+)?(\w+)/g)].map((m) => m[1]),
    ]),
  ].sort();
  // sub-clasificación de wrappers: override > heurística (CVA o API propia rica).
  let kind = provenance;
  if (provenance === 'WRAPPER') {
    kind = PROVENANCE_OVERRIDE[name] ? PROVENANCE_OVERRIDE[name].toUpperCase() : cva || inputs >= 4 ? 'EXTENDED' : 'STANDARD';
  }
  const nested = [...new Set([...htmlText.matchAll(/<(sc-[a-z0-9-]+)/g)].map((m) => m[1]))]
    .filter((s) => s !== selector && !NESTED_IGNORE.has(s));
  // El registro de demos usa el path SIN guiones (`sectioncard`), pero `name` y el
  // selector vienen CON guiones (`section-card`). Hay que casar ambas formas: si no,
  // 18 componentes que SÍ tienen demo aparecían como "—" (falso negativo). Ver AUDIT-2026-07.
  const deHyphen = name.replace(/-/g, '');
  const hasDemo =
    new RegExp(`path:\\s*['"](?:${name}|${deHyphen})['"]`).test(pagesText) ||
    pagesText.includes(`'${selector.replace(/^sc-/, '')}'`) ||
    pagesText.includes(`'${deHyphen}'`);
  const usedInSupervisor = (supervisorBlob.match(new RegExp(`<${selector}[\\s>]`, 'g')) || []).length;
  const contrato = contratoDe(tsRaw, nativas);
  /* Las props que PrimeNG documenta y NOSOTROS no exponemos. No es una lista de defectos: hay
   * wrappers que esconden a propósito (DD-35 y los EXTENDED). Es la lista con la que se decide,
   * y sin ella la decisión no existía — se descubría construyendo la pantalla. */
  const nuestras = new Set(contrato.map((m) => m.nombre));
  const ocultas = nativas ? [...nativas.keys()].filter((p) => !nuestras.has(p)).sort() : [];
  return {
    name,
    selector,
    provenance,
    kind,
    primengBase: primeng.map((p) => `primeng/${p}`).join(', ') || '—',
    cva,
    inputs,
    api: nombresApi,
    nested,
    hasDemo,
    usedInSupervisor,
    contrato,
    ocultas,
  };
}

/** Los módulos `primeng/<x>` que envuelve un componente, sin las utilidades. */
export function modulosPrimeng(tsRaw) {
  return [...sinComentarios(tsRaw).matchAll(/from\s+['"]primeng\/([a-z0-9-]+)['"]/g)]
    .map((m) => m[1])
    .filter((x) => !PRIMENG_UTIL.has(x));
}

/** Lee un `.d.ts` de la versión de PrimeNG INSTALADA. `null` si no está (sin `node_modules`). */
const leerTiposInstalados = (mod) => {
  const f = resolve(root, `node_modules/primeng/types/primeng-${mod}.d.ts`);
  return existsSync(f) ? readFileSync(f, 'utf8') : null;
};

/**
 * La API nativa de los módulos que envuelve un componente, en un solo Map nombre→prop.
 * `null` si NO se pudo leer ninguno: es lo que distingue «no lo tiene PrimeNG» de «no lo
 * hemos podido mirar», y esa diferencia es justo la que no se puede adivinar.
 */
export function nativasDe(mods, leerTipos) {
  if (!mods.length) return new Map();
  const map = new Map();
  let leidoAlguno = false;
  for (const mod of mods) {
    if (leerTipos(mod) == null) continue;
    leidoAlguno = true;
    for (const clase of apiConHerencia(mod, leerTipos))
      for (const p of clase.props) if (!map.has(p.prop)) map.set(p.prop, p);
  }
  return leidoAlguno ? map : null;
}

/** Recorre todos los componentes. */
export function audit(leerTipos = leerTiposInstalados) {
  const pagesText = existsSync(PAGES) ? readFileSync(PAGES, 'utf8') : '';
  const supervisorBlob = blob(SUPERVISOR);
  const rows = [];
  for (const carpeta of readdirSync(COMPONENTS).filter((d) => statSync(resolve(COMPONENTS, d)).isDirectory()).sort()) {
    const dir = resolve(COMPONENTS, carpeta);
    /* Por FICHERO, no por carpeta. Antes se cogía el primer `.component.ts` y se ignoraba el
     * resto, así que `sc-avatargroup` y `sc-field-msg` no existían para el registro: 54 filas
     * para 56 componentes. No era una exención (no están en DEMO_EXEMPT), era una asunción —un
     * componente por carpeta— que el código desbordó y que nada medía. El registro que sostiene
     * el CHECK E de `docs:coherence` no puede contar de menos. (Medido el 2026-09-19.) */
    const tsFiles = readdirSync(dir).filter((f) => /\.component\.ts$/.test(f)).sort();
    if (!tsFiles.length) continue; // p.ej. dynamic-dialog (solo servicio) — exento abajo
    for (const tsFile of tsFiles) {
      // El nombre sale del FICHERO, no de la carpeta: en las de varios, la carpeta no distingue.
      const name = tsFile.replace(/^sc-/, '').replace(/\.component\.ts$/, '');
      // Y el HTML se empareja con SU `.ts`, que si no `sc-avatar` se quedaría con la plantilla
      // de `sc-avatargroup` según el orden del directorio.
      const htmlFile = tsFile.replace(/\.ts$/, '.html');
      const tsText = readFileSync(resolve(dir, tsFile), 'utf8');
      rows.push(
        analyzeComponent({
          name,
          tsText,
          htmlText: existsSync(resolve(dir, htmlFile)) ? readFileSync(resolve(dir, htmlFile), 'utf8') : '',
          pagesText,
          supervisorBlob,
          nativas: nativasDe(modulosPrimeng(tsText), leerTipos),
        }),
      );
    }
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

/** Tabla markdown para la zona @audit:components de inventory.md. */
function table(rows) {
  const head = '| Componente | Tipo | PrimeNG base | API propia | Anidados | Demo | Usos en Supervisor |\n|---|---|---|---|---|---|---|';
  const body = rows
    .map((r) => {
      const api = r.provenance === 'WRAPPER' ? `${r.cva ? 'CVA · ' : ''}${r.inputs} inputs` : `${r.inputs} inputs`;
      return `| \`${r.selector}\` | ${r.kind} | ${r.primengBase} | ${api} | ${r.nested.length ? r.nested.join(' ') : '—'} | ${r.hasDemo ? '✓' : '—'} | ${r.usedInSupervisor || '—'} |`;
    })
    .join('\n');
  return `${head}\n${body}`;
}

/**
 * INFORME · dónde se aparta el Supervisor del nativo de primeng.dev.
 *
 * Para qué. La regla de DD-113 es «el nativo tal cual, adaptado con tokens», y el Supervisor es
 * el ÚNICO consumidor real del DS (medido el 2026-09-19: 43 de los 56 componentes en 456 usos;
 * `agent` 4, `cuscare` y `agent-mini` 0 por DD-35). Hasta hoy, saber qué props de PrimeNG NO le
 * llegan a una pantalla era imposible sin abrir el wrapper y compararlo a mano con la
 * documentación. El resultado previsible: se descubría construyendo, y lo que faltaba se
 * reinventaba encima del wrapper en vez de pedírselo.
 *
 * QUÉ NO ES. No es una lista de defectos. Un wrapper esconde por diseño —los EXTENDED son 26 de
 * 56— y esconder está bien cuando es una decisión. Lo que no estaba bien es que la decisión no se
 * viera: esto la pone delante para que alguien diga «sí, a propósito» o «esto falta».
 *
 * Se ordena por props escondidas y no por uso: arriba queda el hueco más grande entre lo que
 * PrimeNG ofrece y lo que la app puede pedir.
 */
export function informeSupervisor(rows, versionPrimeng) {
  const usados = rows
    .filter((r) => r.usedInSupervisor > 0)
    .sort((a, b) => b.ocultas.length - a.ocultas.length || a.selector.localeCompare(b.selector));
  const obsoletas = rows.flatMap((r) => r.contrato.filter((m) => m.nativo?.obsoleta).map((m) => ({ sel: r.selector, m })));
  const totalOcultas = usados.reduce((a, r) => a + r.ocultas.length, 0);

  const l = [];
  l.push('# Desvíos del Supervisor respecto al nativo de primeng.dev', '');
  l.push('<!-- GENERADO por `node scripts/component-audit.mjs --write`. NO editar a mano. -->', '');
  l.push(
    `Contra **PrimeNG ${versionPrimeng ?? '¿?'}**, la versión INSTALADA — no la documentación de la web,`,
    'que puede ir por delante.',
    '',
    `**${usados.length} componentes** del DS se usan en el Supervisor, y entre todos esconden`,
    `**${totalOcultas} props** que PrimeNG sí documenta.`,
    '',
    'La regla es DD-113: *el nativo tal cual, adaptado con tokens*. Esconder una prop puede ser una',
    'decisión buena —los wrappers EXTENDED lo hacen a propósito— pero hasta ahora esa decisión no se',
    'veía en ningún sitio, así que no se podía revisar. Esto la pone delante.',
    '',
    '**Cómo se usa**: al construir una pantalla, si echas en falta algo, míralo aquí ANTES de',
    'envolverlo a mano. Si la prop está en esta lista, existe en PrimeNG y solo hay que dejarla pasar.',
    '',
  );

  if (obsoletas.length) {
    l.push('## ⚠️ Props nuestras sobre API que PrimeNG marca obsoleta', '');
    for (const { sel, m } of obsoletas) l.push(`- **\`${sel}.${m.nombre}\`** → ${m.nativo.obsoleta}`);
    l.push('', 'Cambiarlas rompe API pública nuestra, así que es un major (DD-58): se propone, no se cuela.', '');
  }

  l.push('## Por componente', '');
  for (const r of usados) {
    l.push(`### \`${r.selector}\` · ${r.usedInSupervisor} usos · ${r.primengBase}`, '');
    if (!r.ocultas.length) {
      l.push('Expone todo lo que PrimeNG documenta.', '');
      continue;
    }
    l.push(`**${r.ocultas.length} props nativas no expuestas**: ${r.ocultas.map((p) => `\`${p}\``).join(', ')}`, '');
  }
  return l.join('\n') + '\n';
}

/** Resumen de conteos. */
function summary(rows) {
  const by = (k) => rows.filter((r) => r.kind === k).length;
  return `**${rows.length} componentes** · ${by('CUSTOM')} custom · ${by('STANDARD')} standard · ${by('EXTENDED')} extended · ${rows.filter((r) => r.usedInSupervisor > 0).length} usados en Supervisor.`;
}

const HEADER = '<!-- @audit:components — TABLA GENERADA por `node scripts/component-audit.mjs --write`. NO editar a mano.';
const END = '<!-- @audit:components:end -->';

/**
 * Tope de miembros públicos SIN NINGUNA descripción — ni propia ni heredable de PrimeNG.
 *
 * Arrancó en **192** el 2026-09-19 y **llegó a 0 el mismo día**. Ojo al denominador, que es la
 * mitad del valor de este número: de los 514 miembros del DS, 191 llevaban ya su JSDoc y **131
 * los describe PrimeNG** (`origen: nativo`), así que la deuda de ESCRITURA nunca fueron los 323
 * sin JSDoc. Contar los 323 habría mandado a alguien a redactar 131 descripciones que ya
 * existen, peor escritas que el original y sin autoridad.
 *
 * En CERO el gate cambia de significado: ya no mide deuda, PROTEGE. Un miembro público nuevo sin
 * describir —y que PrimeNG tampoco describa— pone rojo el commit que lo introduce, que es cuando
 * escribir esa línea cuesta una línea.
 *
 * TRINQUETE: solo puede BAJAR, y muerde en las dos direcciones (un tope holgado deja volver lo
 * que ya salió). Mismo patrón que `INPUTS_SIN_EJEMPLO_MAX` de `audit-doc-snippets`, que fue de
 * 66 a 0 en un día.
 */
export const MIEMBROS_SIN_DESCRIPCION_MAX = 0;

/**
 * Tope de props NUESTRAS montadas sobre API que PrimeNG marca `@deprecated`.
 *
 * Arrancó en **1**, y el 1 tiene nombre: `sc-drawer.showCloseIcon`, que PrimeNG 22.1.0 declara
 * obsoleta con «use 'closable' instead». No se arregla aquí a propósito: `showCloseIcon` es
 * API PÚBLICA nuestra y desde DD-58 (1.0.0) romperla es un major. Es de las que AGENTS.md manda
 * PROPONER, no colar. Queda medida y a la vista hasta que se decida.
 *
 * TRINQUETE: solo puede BAJAR. Una prop nueva sobre API obsoleta pone rojo el CI en el commit
 * que la introduce, que es cuando cuesta una línea arreglarla.
 */
export const PROPS_SOBRE_API_OBSOLETA_MAX = 1;

/**
 * Las props que el contrato GUARDADO daba por nativas y la versión instalada ya no tiene.
 *
 * Es la alarma de «una subida de PrimeNG te la ha renombrado o retirada», el mismo modo de
 * fallo que `audit-datatable-slots` persigue con las ranuras: no rompe el build, no rompe
 * ningún test de comportamiento, la prop simplemente deja de llegar a PrimeNG. Solo puede
 * afirmarse con un contrato previo en disco, así que la primera vez no dice nada — y eso es
 * correcto, no un agujero: sin referencia anterior no hay nada que comparar.
 *
 * PURA respecto a sus dos entradas → testeable sin tocar `node_modules` ni el disco.
 */
export function huerfanas(previo, rows) {
  const ahora = new Map(rows.map((r) => [r.selector, new Map(r.contrato.map((m) => [m.nombre, m]))]));
  const out = [];
  for (const c of previo?.components ?? [])
    for (const m of c.contrato ?? [])
      if (m.origen === 'nativo' && ahora.get(c.selector)?.get(m.nombre)?.origen === 'nuestro') out.push(`${c.selector}.${m.nombre}`);
  return out;
}

// ── CLI ───────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const cmd = process.argv[2] || (process.argv.includes('--write') ? '--write' : process.argv.includes('--emit') ? '--emit' : 'check');
  const rows = audit();

  /* DOS artefactos de UNA pasada, y por qué separados: la pokédex la lee un humano en el diff
   * de cada PR (y el CHECK E de `docs:coherence` cuenta sus filas), mientras que el contrato son
   * 514 miembros con su cruce nativo. Meterlo todo en un fichero haría ilegible justo el diff
   * que se revisa. No hay hecho duplicado: los dos salen de las MISMAS `rows`, así que no pueden
   * desviarse entre sí. El contrato vive en `public/` porque es quien lo sirve a sc-docs y a los
   * agentes, y porque la app compila solo desde `src/` (ver foundations.component.ts). */
  const statusRows = rows.map((r) => {
    const fila = { ...r };
    delete fila.contrato;
    delete fila.ocultas;
    return fila;
  });
  const manifest = JSON.stringify({ generated: 'component-audit.mjs', summary: summary(rows).replace(/\*\*/g, ''), components: statusRows }, null, 2) + '\n';

  const versionPrimeng = (() => {
    const p = resolve(root, 'node_modules/primeng/package.json');
    return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')).version : null;
  })();
  const sinVerificar = rows.every((r) => r.contrato.every((m) => m.origen === 'sin-verificar'));
  const apiManifest =
    JSON.stringify(
      {
        generated: 'component-audit.mjs',
        primeng: versionPrimeng,
        nota: 'Contrato de los componentes del DS, cruzado con la API de la versión de PrimeNG instalada. NO editar a mano.',
        components: rows.map((r) => ({ selector: r.selector, name: r.name, primengBase: r.primengBase, contrato: r.contrato, ocultas: r.ocultas })),
      },
      null,
      2,
    ) + '\n';

  const informe = informeSupervisor(rows, versionPrimeng);
  const zoneBody = `${summary(rows)}\n\n${table(rows)}`;

  // problemas: componente sin demo (y no exento). provenance siempre clasifica → sin "sin clasificar".
  const noDemo = rows.filter((r) => !r.hasDemo && !DEMO_EXEMPT.has(r.name));

  /** Miembros sin NINGUNA descripción: ni propia ni de PrimeNG. La deuda de escritura de verdad. */
  const sinDescripcion = rows.flatMap((r) => r.contrato.filter((m) => !m.descripcion && !m.nativo?.descripcion).map((m) => `${r.selector}.${m.nombre}`));
  /** Props nuestras montadas sobre API que PrimeNG declara obsoleta. */
  const sobreObsoleta = rows.flatMap((r) => r.contrato.filter((m) => m.nativo?.obsoleta).map((m) => `${r.selector}.${m.nombre} (${m.nativo.obsoleta})`));

  if (cmd === '--emit') {
    log(zoneBody);
    log(`\n--- manifiesto: ${rows.length} componentes · sin-demo(no exentos): ${noDemo.length} ${noDemo.map((r) => r.name).join(', ')}`);
    log(`--- contrato: ${rows.reduce((a, r) => a + r.contrato.length, 0)} miembros · ${sinDescripcion.length} sin descripción · ${rows.reduce((a, r) => a + r.ocultas.length, 0)} props nativas no expuestas`);
    process.exit(0);
  }

  const invTxt = readFileSync(INVENTORY, 'utf8');
  const nextInv = rewriteRegion(invTxt, '<!-- @audit:components', END, HEADER + ' -->', zoneBody);
  if (nextInv == null) {
    log('✗ Faltan los marcadores <!-- @audit:components --> … :end en docs/inventory.md.');
    process.exit(2);
  }

  if (cmd === '--write') {
    if (nextInv !== invTxt) writeFileSync(INVENTORY, nextInv);
    writeFileSync(MANIFEST, manifest);
    if (sinVerificar) {
      log('⚠ audit:components — sin `node_modules/primeng`, el contrato NO se reescribe (se habría quedado sin cruce nativo).');
    } else {
      mkdirSync(dirname(API_MANIFEST), { recursive: true });
      writeFileSync(API_MANIFEST, apiManifest);
      writeFileSync(INFORME, informe);
    }
    log(`✓ audit:components — manifiesto + tabla regenerados (${rows.length} componentes, contrato de ${rows.reduce((a, r) => a + r.contrato.length, 0)} miembros contra PrimeNG ${versionPrimeng ?? '¿?'}).`);
    process.exit(0);
  }

  // CHECK (guard). FALLA por DRIFT (la pokédex se desfasó del código) — su misión anti-desfase.
  // La cobertura demo se INFORMA (⚠), no bloquea: hoy 20 customs de flujo no tienen demo aislada;
  // forzarlo rojo pararía el gate. Para EXIGIR demo, mueve el componente fuera de exentos y
  // construye su página (o sube esto a fallo cuando estén todas). Decisión de Rafa.
  let problems = 0;
  if (nextInv !== invTxt) {
    problems++;
    log('✗ la tabla @audit:components de inventory.md no está al día — corre `node scripts/component-audit.mjs --write`.');
  }
  if (!existsSync(MANIFEST) || readFileSync(MANIFEST, 'utf8') !== manifest) {
    problems++;
    log('✗ docs/_component-status.json no está al día — corre `node scripts/component-audit.mjs --write`.');
  }

  /* ── El contrato contra la versión de PrimeNG INSTALADA ────────────────────────────────
   * Sin `node_modules` no se puede afirmar nada del cruce nativo, así que se SALTA y se dice.
   * Callar sería peor que no mirar: un verde aquí significaría «comprobado contra PrimeNG». */
  if (sinVerificar) {
    log('  ⚠ sin `node_modules/primeng`: el contrato NO se ha podido cruzar con la API nativa (se omite, no se da por bueno).');
  } else {
    if (!existsSync(API_MANIFEST) || readFileSync(API_MANIFEST, 'utf8') !== apiManifest) {
      problems++;
      log(`✗ ${API_MANIFEST.replace(root + '/', '')} no está al día — corre \`node scripts/component-audit.mjs --write\`.`);
    }
    if (!existsSync(INFORME) || readFileSync(INFORME, 'utf8') !== informe) {
      problems++;
      log('✗ docs/AUDIT-PRIMENG-SUPERVISOR.md no está al día — corre `node scripts/component-audit.mjs --write`.');
    }

    /* HUÉRFANAS — lo que el contrato guardado daba por nativo y la versión instalada ya no
     * tiene. Es la alarma de «la subida te lo ha renombrado o quitado», el mismo modo de fallo
     * que persigue `audit-datatable-slots` con las ranuras: no rompe el build, no rompe ningún
     * test, simplemente deja de llegar a PrimeNG. Solo se puede afirmar con un contrato previo
     * en disco, así que en el primer commit no dice nada. */
    if (existsSync(API_MANIFEST)) {
      const perdidas = huerfanas(JSON.parse(readFileSync(API_MANIFEST, 'utf8')), rows);
      if (perdidas.length) {
        problems++;
        log(`✗ ${perdidas.length} prop(s) que el contrato daba por NATIVAS ya no existen en PrimeNG ${versionPrimeng}: ${perdidas.join(', ')}`);
        log('      → mira el changelog de PrimeNG: o se renombraron (ajusta el wrapper) o se retiraron (decide qué hacemos).');
      }
    }

    // OBSOLETAS — trinquete: una prop nueva sobre API `@deprecated` pone rojo el commit que la mete.
    if (sobreObsoleta.length > PROPS_SOBRE_API_OBSOLETA_MAX) {
      problems++;
      log(`✗ ${sobreObsoleta.length} prop(s) sobre API obsoleta de PrimeNG y el tope es ${PROPS_SOBRE_API_OBSOLETA_MAX}: ${sobreObsoleta.join(' · ')}`);
    } else if (sobreObsoleta.length < PROPS_SOBRE_API_OBSOLETA_MAX) {
      problems++;
      log(`✗ ${sobreObsoleta.length} prop(s) sobre API obsoleta y el tope sigue en ${PROPS_SOBRE_API_OBSOLETA_MAX}.`);
      log(`      → baja PROPS_SOBRE_API_OBSOLETA_MAX a ${sobreObsoleta.length} en scripts/component-audit.mjs (un tope holgado deja volver lo que ya salió).`);
    }

    // DESCRIPCIÓN — trinquete de la deuda de escritura REAL (la heredable de PrimeNG no cuenta).
    if (sinDescripcion.length > MIEMBROS_SIN_DESCRIPCION_MAX) {
      problems++;
      log(`✗ ${sinDescripcion.length} miembro(s) sin ninguna descripción y el tope es ${MIEMBROS_SIN_DESCRIPCION_MAX}.`);
      log(`      → documenta los nuevos con JSDoc: ${sinDescripcion.slice(0, 6).join(', ')}${sinDescripcion.length > 6 ? '…' : ''}`);
    } else if (sinDescripcion.length < MIEMBROS_SIN_DESCRIPCION_MAX) {
      problems++;
      log(`✗ ${sinDescripcion.length} miembro(s) sin descripción y el tope sigue en ${MIEMBROS_SIN_DESCRIPCION_MAX}.`);
      log(`      → baja MIEMBROS_SIN_DESCRIPCION_MAX a ${sinDescripcion.length} en scripts/component-audit.mjs: el trinquete avanzando.`);
    }
  }

  if (noDemo.length) log(`  ⚠ ${noDemo.length} componente(s) sin página demo (informativo, no bloquea): ${noDemo.map((r) => r.name).join(', ')}`);
  if (problems) {
    log(`✗ audit:components: ${problems} problema(s) de desfase.`);
    process.exit(1);
  }
  log(
    `✓ audit:components OK — ${rows.length} componentes clasificados, manifiesto + tabla al día (${noDemo.length} sin demo, informado)` +
      (sinVerificar ? '.' : `; contrato de ${rows.reduce((a, r) => a + r.contrato.length, 0)} miembros contra PrimeNG ${versionPrimeng} (${sinDescripcion.length} sin descripción, tope ${MIEMBROS_SIN_DESCRIPCION_MAX}).`),
  );
  process.exit(0);
}
