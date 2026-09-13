#!/usr/bin/env node
/**
 * «Por qué ha salido rojo y qué hago», en una frase por fallo, para el PR del robot de tokens.
 *
 * Por qué existe (2026-09-14): de 44 pasadas del robot, 28 salieron rojas, y cada una pedía abrir
 * el log del run, encontrar el eslabón que cayó y adivinar si era un error del Kit, del código o
 * del propio robot. `token-report.mjs` ya traduce parity y contraste en el carril rápido; esto
 * cubre el resto de la cadena del robot (`tokens:import`, los eslabones de `verify` y los e2e) y
 * dice quién tiene que moverse.
 *
 * Cómo lee: `verify` es `npm run a && npm run b && …`, así que el eslabón que cayó es el ÚLTIMO
 * `> … <script>` que npm anunció en el log. Los e2e, por la cabecera de cada fallo de Playwright
 * (`1) e2e/x.spec.ts:10:5 › título`). Lo que ninguna regla reconoce sale con su nombre técnico y
 * «mira el run», nunca se esconde.
 *
 * Uso:
 *   node scripts/tokens-sync-rojo.mjs --import import.log --ceros ceros.log --verify verify.log --e2e e2e.log --failed import,ceros,verify,e2e [--md salida.md]
 *   (cada log es opcional; sin fallos imprime una línea verde)
 *   node scripts/tokens-sync-rojo.mjs --e2e e2e.log --solo-referencias   # sale 0 si solo caen referencias
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

/** Quién se mueve: el Kit (Figma), el código del DS, o el robot/la máquina. */
const QUIEN = { kit: 'Se arregla en Figma', codigo: 'Se arregla en código', robot: 'No es del export', cualquiera: 'Puede venir de Figma o del código' };

/** Eslabones de `verify` que un export puede tumbar, con la frase que los explica. */
export const GATES = [
  { re: /^tokens:export-clean$/, quien: 'kit', frase: 'El export trae algo que el repo no sabe clasificar (una variable nueva en Figma, o una borrada que el código aún usa).' },
  { re: /^tokens:gen(-[\w-]+)?$/, quien: 'kit', frase: 'Un valor del Kit no se puede convertir en token: suele ser un color que no está en ninguna familia de la paleta o una referencia rota.' },
  { re: /^tokens:parity$/, quien: 'kit', frase: 'Un valor del Kit no cuadra con lo que el código pinta, o un par de texto y fondo no llega a AA. El detalle, en el comentario del informe rápido.' },
  { re: /^tokens:type-parity$/, quien: 'kit', frase: 'Un estilo de texto del Kit ya no coincide con la rampa tipográfica del código.' },
  { re: /^tokens:(guard|cmp-rewire|effects-rewire)$/, quien: 'codigo', frase: 'El código usa un valor escrito a mano donde ya hay token. No lo causa el export: estaba antes.' },
  { re: /^audit:theme-scale$/, quien: 'kit', frase: 'Una medida del Kit no cae en la escala del DS.' },
  { re: /^test:unit$/, quien: 'codigo', frase: 'Un test de los scripts de tokens falla con este export: suele ser una hoja nueva del Kit sin clasificar en el mapa de cobertura.' },
  { re: /^(build|typecheck|lint|test:components)$/, quien: 'codigo', frase: 'El DS no compila o no pasa sus tests con estos tokens.' },
];

/** Familias de e2e que un export puede tumbar. */
export const E2E = [
  // Contraste: sin atribución fija. El PR #144 lo tuvo rojo por un color de Figma cuyo arreglo de código
  // (DD-81) aún no estaba en `main`; decir «se arregla en Figma» habría mandado a la persona equivocada.
  { re: /(theme-contrast|severities-contrast|focus-ring)\.spec/, quien: 'cualquiera', frase: 'Un color no pasa contraste en pantalla. Si lo cambiaste en Figma, prueba un paso más oscuro o más claro; si no lo tocaste, el tema no está leyendo el color nuevo.' },
  { re: /component-(structure|styles)\.spec/, quien: 'robot', frase: 'Cambian medidas o estilos de referencia de los componentes. Si son las del cambio de Figma, es lo esperado: el robot las actualiza.' },
  { re: /(components|smoke)\.spec/, quien: 'codigo', frase: 'Un componente no pinta la medida que dice el Kit: el tema no la está leyendo.' },
];

/** Último script que npm anunció antes del final del log (`> paquete@x.y.z nombre`). */
export function lastNpmScript(log) {
  let last = null;
  for (const m of log.matchAll(/^> \S+@\S+ ([\w:-]+)$/gm)) last = m[1];
  return last;
}

/** Tests fallidos de Playwright: `  1) e2e/x.spec.ts:10:5 › título`. */
export function failedTests(log) {
  const out = [];
  const seen = new Set();
  for (const m of log.matchAll(/^\s*\d+\) (e2e\/\S+?\.spec\.ts):\d+:\d+ › (.+?)\s*[─]*\s*$/gm)) {
    const key = `${m[1]}|${m[2]}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ file: m[1], title: m[2] });
    }
  }
  return out;
}

export function explain({ importLog = null, verifyLog = null, e2eLog = null, cerosLog = null, importFailed = false, verifyFailed = false, e2eFailed = false, cerosFailed = false }) {
  const items = [];
  if (cerosFailed) {
    items.push({ quien: 'kit', paso: 'ceros', frase: 'Un token que tenía medida ha pasado a 0 en Figma. Un 0 deja la pieza sin esa medida. Si es a propósito, se apunta en `CEROS_A_PROPOSITO` (scripts/tokens-sync-cambios.mjs) con su motivo.', detalle: (cerosLog ?? '').split('\n').filter((l) => /✗/.test(l)).slice(0, 5).map((l) => l.replace(/^✗ cero nuevo: /, '')) });
  }
  if (importFailed) {
    items.push({ quien: 'kit', paso: 'tokens:import', frase: 'El export no se ha podido convertir en tokens.', detalle: (importLog ?? '').split('\n').filter((l) => /✗/.test(l)).slice(0, 3) });
  }
  if (verifyFailed) {
    const gate = lastNpmScript(verifyLog ?? '');
    const rule = gate && GATES.find((g) => g.re.test(gate));
    items.push(rule
      ? { quien: rule.quien, paso: gate, frase: rule.frase }
      : { quien: 'codigo', paso: gate ?? 'verify', frase: 'Ha caído un eslabón de verify que esta tabla no reconoce: mira el run.' });
  }
  if (e2eFailed) {
    const tests = failedTests(e2eLog ?? '');
    const groups = new Map();
    for (const t of tests) {
      const rule = E2E.find((r) => r.re.test(t.file)) ?? { quien: 'codigo', frase: 'Falla un e2e que esta tabla no reconoce: mira el run.' };
      if (!groups.has(rule)) groups.set(rule, []);
      groups.get(rule).push(t);
    }
    if (!tests.length) items.push({ quien: 'robot', paso: 'e2e', frase: 'Los e2e fallaron sin un test concreto (servidor, navegador o tiempo): relanza el run.' });
    for (const [rule, ts] of groups) items.push({ quien: rule.quien, paso: 'e2e', frase: rule.frase, detalle: ts.slice(0, 5).map((t) => `${t.file} › ${t.title}`) });
  }
  return items;
}

/**
 * ¿Todos los e2e caídos son referencias de estructura o estilos? Es el único rojo que el robot
 * arregla solo: si el export cambia medidas a propósito, esas fotos de referencia TIENEN que
 * cambiar. Cualquier otro fallo (medida del Kit no aplicada, contraste) sigue siendo rojo.
 */
export function onlyReferenceFailures(e2eLog) {
  const tests = failedTests(e2eLog ?? '');
  return tests.length > 0 && tests.every((t) => /component-(structure|styles)\.spec/.test(t.file));
}

export function renderMarkdown(items) {
  if (!items.length) return '### Veredicto\n\n✅ Verde: el export cuadra con el código, la escala y el contraste.';
  const L = ['### Veredicto', '', `❌ Rojo. ${items.length === 1 ? 'Una cosa' : `${items.length} cosas`} que mirar antes de fundir:`, ''];
  items.forEach((it, i) => {
    L.push(`${i + 1}. **${QUIEN[it.quien]}.** ${it.frase} <sub>(\`${it.paso}\`)</sub>`);
    for (const d of it.detalle ?? []) L.push(`   - \`${d}\``);
  });
  return L.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (flag) => {
    const i = process.argv.indexOf(flag);
    return i === -1 ? null : process.argv[i + 1];
  };
  const read = (p) => (p && existsSync(p) ? readFileSync(p, 'utf8') : null);
  if (process.argv.includes('--solo-referencias')) {
    const only = onlyReferenceFailures(read(arg('--e2e')));
    process.stdout.write(only ? 'Solo caen referencias de estructura/estilos: se actualizan.\n' : 'Hay fallos que no son referencias: no se actualiza nada.\n');
    process.exit(only ? 0 : 1);
  }
  // Un paso falló si su log existe y el workflow lo marcó (`--failed import,verify,e2e`).
  const failed = new Set((arg('--failed') ?? '').split(',').filter(Boolean));
  const items = explain({
    cerosLog: read(arg('--ceros')),
    cerosFailed: failed.has('ceros'),
    importLog: read(arg('--import')),
    verifyLog: read(arg('--verify')),
    e2eLog: read(arg('--e2e')),
    importFailed: failed.has('import'),
    verifyFailed: failed.has('verify'),
    e2eFailed: failed.has('e2e'),
  });
  const md = renderMarkdown(items);
  const out = arg('--md');
  if (out) writeFileSync(out, `${md}\n`);
  else process.stdout.write(`${md}\n`);
}
