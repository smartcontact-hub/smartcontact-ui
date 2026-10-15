#!/usr/bin/env node
/**
 * AUDIT · el catálogo de PrimeNG contra su tabla (`docs/AUDIT-PRIMENG-CATALOGO.md`, DD-195).
 *
 * POR QUÉ. `sc-fileupload` (DD-184) existía en PrimeNG desde siempre y se nos pasó: nada avisaba de «PrimeNG ya trae
 * esto». La tabla del catálogo se hizo a mano el 2026-10-07 y en cuatro días ya decía una versión que no era la
 * instalada. Este gate la mantiene viva: se pone rojo cuando PrimeNG cambia o cuando el repo empieza a usar algo que la
 * tabla no cuenta.
 *
 * QUÉ MIRA.
 *   1. La versión: la de la cabecera del documento («PrimeNG **x.y.z**») frente a la de `package-lock.json`.
 *   2. Cada módulo de `node_modules/primeng/fesm2022` sale en el documento por su nombre, o lo envuelve el DS
 *      (`primengBase` de `docs/_component-status.json`), o es una utilidad sin interfaz (la lista de abajo).
 *   3. Cada `from 'primeng/<x>'` de una app (todo `projects/*` menos el DS y los tokens) que el DS no envuelve tiene su
 *      fila en la sección 3; y cada fila de la sección 3 sigue teniendo quien la importe.
 *   4. Nada de la sección 4 («sin caso») se usa: si algo de ahí lo envuelve el DS o lo importa una app, ya tiene caso.
 *   5. La página «Todo PrimeNG» de sc-docs (`/#/components/primeng`) pinta la sección 6 (los módulos por familias) con el estado que mide este mismo
 *      gate: su artefacto (`projects/sc-docs/public/primeng/_catalogo.json`) cuadra con el documento y con el repo.
 *      Se regenera con `npm run primeng-catalog:gen`.
 *
 * ⚠️ `compare` NO es una utilidad: es `p-compare`, el sucesor de ImageCompare (estaba en la lista hasta el 2026-10-14, y
 * el catálogo contaba 108 en vez de 109). `motion` sí lo es: el motor de animación que usan los demás, sin página propia
 * en primeng.dev.
 *
 * QUÉ HACER SI SE PONE ROJO. Escribir la fila que falta con su juicio (o rehacer la tabla si subió PrimeNG, con la
 * versión y la fecha nuevas en la cabecera). No se apaga quitando un módulo de la cuenta.
 *
 * La comparación es pura (`auditarCatalogo`) y la prueba `scripts/__tests__/audit-primeng-catalog.test.mjs`.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Sin interfaz: piezas de la base, utilidades e iconos. No se deciden; se usan por dentro de lo demás. */
export const UTILIDADES = new Set([
  'api', 'base', 'basecomponent', 'baseeditableholder', 'baseinput', 'basemodelholder', 'bind', 'classnames', 'config',
  'dom', 'icons', 'license', 'motion', 'passthrough', 'primeng', 'ts-helpers', 'usestyle', 'utils',
]);

/** Los nombres que el documento escribe con mayúscula (`TreeSelect` → `treeselect`); así «aria-label» no cuenta. */
const nombres = (texto) => new Set([...texto.matchAll(/\b[A-Z][A-Za-z]+\b/g)].map((m) => m[0].toLowerCase()));
const seccion = (doc, n) => doc.split(/^## /m).find((s) => s.startsWith(`${n}.`)) ?? '';

/** Los módulos de la primera columna de la tabla de la sección 3 («Tooltip · AutoFocus» son dos). */
export function filasSeccion3(doc) {
  return new Set(
    [...seccion(doc, 3).matchAll(/^\| ([^|]+) \|/gm)]
      .map((r) => r[1].trim())
      .filter((c) => c !== 'Módulo' && !/^-+$/.test(c))
      .flatMap((c) => c.split('·').map((n) => n.trim().toLowerCase())),
  );
}

/**
 * @param {{ doc: string, instalada: string, modulos: string[], envueltos: Set<string>, directos: Map<string, Set<string>> }} e
 *   `modulos`, los de PrimeNG ya sin utilidades; `directos`, módulo → apps que lo importan sin pasar por el DS.
 * @returns {string[]} lo que la tabla no cuenta; vacío si está al día.
 */
export function auditarCatalogo({ doc, instalada, modulos, envueltos, directos }) {
  const errores = [];

  const enDoc = doc.match(/PrimeNG \*\*(\d+\.\d+\.\d+)\*\*/)?.[1];
  if (!enDoc) errores.push('la cabecera no dice la versión («PrimeNG **x.y.z**»).');
  else if (enDoc !== instalada)
    errores.push(`PrimeNG pasó de ${enDoc} (la tabla) a ${instalada} (package-lock.json): rehaz la tabla con la versión nueva.`);

  const enTodo = nombres(doc);
  for (const m of modulos)
    if (!enTodo.has(m) && !envueltos.has(m))
      errores.push(`«${m}»: PrimeNG lo trae y la tabla no lo nombra. Dale fila (sección 1 si tiene caso, 4 si no).`);

  const filas = filasSeccion3(doc);
  for (const [m, apps] of directos)
    if (!envueltos.has(m) && !filas.has(m))
      errores.push(`«${m}»: ${[...apps].join(', ')} lo importa sin wrapper del DS y la sección 3 no tiene su fila.`);
  for (const m of filas)
    if (!directos.has(m)) errores.push(`«${m}»: tiene fila en la sección 3 y ya no lo importa ninguna app. Quita la fila.`);

  for (const m of nombres(seccion(doc, 4)))
    if (modulos.includes(m) && (envueltos.has(m) || directos.has(m)))
      errores.push(`«${m}»: la sección 4 dice que no tiene caso y ya se usa. Pásalo a su sitio.`);

  return errores;
}

/**
 * Sin página propia en primeng.dev: la de quien lo documenta, o ninguna (`steps` ya no sale en la documentación).
 * Medido el 2026-10-14: de los 109, estos son los únicos que `primeng.dev/llms/components/<x>.md` no trae.
 */
export const PAGINA_EN_PRIMENG = {
  avatargroup: 'avatar',
  buttongroup: 'button',
  inputgroupaddon: 'inputgroup',
  inputicon: 'iconfield',
  overlaybadge: 'badge',
  password: 'inputpassword',
  steps: null,
};

const escapar = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** El markdown en línea de una celda (`código` y **negrita**) a HTML. Se hace aquí: el origen es un fichero del repo. */
export const enLinea = (md) =>
  escapar(md)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

/** Las celdas de una fila de tabla markdown; `\|` es una barra dentro de la celda. */
const celdas = (fila) =>
  fila
    .trim()
    .replace(/^\||\|$/g, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, '|'));

/**
 * La sección 6 como datos para la página «Todo PrimeNG» de sc-docs: cada familia con su pregunta y sus filas, y cada fila
 * con el estado que mide el repo (no el que dice el texto, que es juicio).
 *
 * Solo sale lo que la página pinta. La lista de wrappers y la de apps se quedaron fuera el 2026-10-14: `main` se puso
 * rojo cuando otro PR hizo que `sc-option-cards` envolviera RadioButton, un cambio que la página ni enseña. El estado
 * (en el DS, sin wrapper, sin uso) cambia mucho menos.
 *
 * @param {string} doc
 * @param {{ envueltoPor: Map<string, string[]>, directos: Map<string, Set<string>>, obsoletos: Set<string> }} repo
 */
export function catalogoParaDocs(doc, { envueltoPor, directos, obsoletos }) {
  const s6 = seccion(doc, 6);
  if (!s6) throw new Error('el documento no tiene sección 6 («Por familias»).');
  const familias = [];
  for (const bloque of s6.split(/^### /m).slice(1)) {
    const lineas = bloque.split('\n');
    const titulo = lineas[0].replace(/^6\.\d+\s+/, '').trim();
    const tabla = lineas.filter((l) => l.startsWith('|'));
    const cabecera = celdas(tabla[0] ?? '');
    const pregunta = lineas
      .slice(1)
      .filter((l) => !l.startsWith('|'))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    const filas = tabla.slice(2).map((l) => {
      const c = Object.fromEntries(cabecera.map((h, i) => [h, celdas(l)[i] ?? '']));
      const nombres = c['Componente'].split(' e ').map((n) => n.trim());
      const modulos = nombres.map((n) => n.toLowerCase());
      const wrappers = [...new Set(modulos.flatMap((m) => envueltoPor.get(m) ?? []))];
      const apps = [...new Set(modulos.flatMap((m) => [...(directos.get(m) ?? [])]))].sort();
      const pagina = modulos[0] in PAGINA_EN_PRIMENG ? PAGINA_EN_PRIMENG[modulos[0]] : modulos[0];
      return {
        nombres,
        modulos,
        enlace: pagina ? `https://primeng.dev/${pagina}` : null,
        sirve: enLinea(c['Para qué sirve']),
        cuando: c['Elígelo cuando…'] ? enLinea(c['Elígelo cuando…']) : null,
        aqui: enLinea(c['Aquí']),
        estado: wrappers.length ? 'ds' : apps.length ? 'directo' : 'sin-uso',
        obsoleto: modulos.some((m) => obsoletos.has(m)),
      };
    });
    familias.push({ titulo, pregunta: pregunta ? enLinea(pregunta) : null, filas });
  }
  return { fuente: 'docs/AUDIT-PRIMENG-CATALOGO.md', familias };
}

/** Las tres listas, leídas del repo. */
export function leerRepo(root) {
  const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
  const instalada = lock.packages?.['node_modules/primeng']?.version;

  const modulos = readdirSync(join(root, 'node_modules/primeng/fesm2022'))
    .filter((f) => f.endsWith('.mjs') && !f.startsWith('primeng-types-') && !f.startsWith('primeng-icons-'))
    .map((f) => f.replace(/^primeng-/, '').replace(/\.mjs$/, ''))
    .filter((m) => !UTILIDADES.has(m));

  const estado = JSON.parse(readFileSync(join(root, 'docs/_component-status.json'), 'utf8'));
  const envueltos = new Set();
  /** Módulo → los `sc-*` que lo envuelven (`search` envuelve tres). */
  const envueltoPor = new Map();
  for (const c of estado.components)
    for (const m of (c.primengBase ?? '').matchAll(/primeng\/([a-z]+)/g)) {
      if (UTILIDADES.has(m[1])) continue;
      envueltos.add(m[1]);
      if (!envueltoPor.has(m[1])) envueltoPor.set(m[1], []);
      envueltoPor.get(m[1]).push(c.selector);
    }

  // Obsoleto = su clase principal lleva `@deprecated` en la API instalada (`Password` en `password`, `UIChart` en `chart`).
  const obsoletos = new Set();
  for (const m of modulos) {
    const dts = join(root, 'node_modules/primeng/types', `primeng-${m}.d.ts`);
    if (!existsSync(dts)) continue;
    for (const d of readFileSync(dts, 'utf8').matchAll(/@deprecated[^\n]*\n(?:\s*\*[^\n]*\n)*?\s*\*\/\s*\n\s*declare class (\w+) extends Base/g))
      if ([m, `ui${m}`].includes(d[1].toLowerCase())) obsoletos.add(m);
  }

  const FUERA = new Set(['ui-smartcontact', 'ui-smartcontact-icons', 'design-tokens']);
  const directos = new Map();
  const recorre = (dir, app) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) recorre(p, app);
      else if (e.name.endsWith('.ts') && !e.name.endsWith('.spec.ts'))
        for (const m of readFileSync(p, 'utf8').matchAll(/from 'primeng\/([a-z]+)'/g)) {
          if (UTILIDADES.has(m[1])) continue;
          if (!directos.has(m[1])) directos.set(m[1], new Set());
          directos.get(m[1]).add(app);
        }
    }
  };
  for (const app of readdirSync(join(root, 'projects'))) if (!FUERA.has(app)) recorre(join(root, 'projects', app, 'src'), app);

  return { instalada, modulos, envueltos, directos, envueltoPor, obsoletos };
}

if (process.argv[1] && process.argv[1].endsWith('audit-primeng-catalog.mjs')) {
  const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const DOC = 'docs/AUDIT-PRIMENG-CATALOGO.md';
  const repo = leerRepo(ROOT);
  const doc = readFileSync(join(ROOT, DOC), 'utf8');
  const errores = auditarCatalogo({ doc, ...repo });

  // 5. La página «Todo PrimeNG» de sc-docs (`/#/components/primeng`): su artefacto sale de la sección 6 y del repo, y no se escribe a mano.
  const ARTEFACTO = 'projects/sc-docs/public/primeng/_catalogo.json';
  const catalogo = catalogoParaDocs(doc, repo);
  const enCatalogo = new Set(catalogo.familias.flatMap((f) => f.filas.flatMap((r) => r.modulos)));
  for (const m of repo.modulos)
    if (!enCatalogo.has(m)) errores.push(`«${m}»: no tiene fila en la sección 6 (por familias). Dale una en su familia.`);
  const datos = JSON.stringify(catalogo, null, 2) + '\n';
  if (process.argv.includes('--write')) {
    mkdirSync(dirname(join(ROOT, ARTEFACTO)), { recursive: true });
    writeFileSync(join(ROOT, ARTEFACTO), datos);
    process.stdout.write(`✓ ${enCatalogo.size} módulos a ${ARTEFACTO}\n`);
  } else if ((existsSync(join(ROOT, ARTEFACTO)) ? readFileSync(join(ROOT, ARTEFACTO), 'utf8') : '') !== datos)
    errores.push(`${ARTEFACTO} no cuadra con la sección 6 o con el repo: la página «Todo PrimeNG» enseñaría otra cosa. Regenera: npm run primeng-catalog:gen`);
  const sinWrapper = [...repo.directos.keys()].filter((m) => !repo.envueltos.has(m)).length;
  const sinUso = repo.modulos.filter((m) => !repo.envueltos.has(m) && !repo.directos.has(m)).length;
  process.stdout.write(
    `audit:primeng-catalog · PrimeNG ${repo.instalada} · ${repo.modulos.length} módulos con interfaz · ` +
      `${repo.envueltos.size} envueltos por el DS · ${sinWrapper} usados sin wrapper · ${sinUso} sin usar\n`,
  );
  if (errores.length) {
    process.stdout.write(`\n✖ ${DOC} se ha quedado atrás (${errores.length}):\n`);
    for (const e of errores) process.stdout.write(`  · ${e}\n`);
    process.exit(1);
  }
  process.stdout.write('✓ la tabla cuenta todo el catálogo instalado\n');
}
