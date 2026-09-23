// Anti-drift entre el script `preflight` (package.json) y el workflow `ci.yml`.
//
// Por qué existe: "corre `npm run preflight` antes de pushear" solo vale si preflight
// corre LO MISMO que el CI, salvo la lista CERRADA de pasos que SOLO corre el CI (CI_ONLY). Si alguien añade un paso a `ci.yml` y no lo replica en
// preflight, el push volvería a caer en CI con el verify/preflight local en verde —
// que es exactamente el fallo de s29 (line-height movió el baseline de
// component-structure; `verify` no corre el e2e y el rojo pasó inadvertido).
//
// Este gate corre como test unitario (scripts/__tests__/) → dentro de `test:unit` →
// dentro de `verify` → dentro del CI, así que la paridad se exige en cada push sin
// añadir un gate nuevo a la cadena.
//
// Sustituciones LOCALES documentadas: algún paso del CI no es corrible tal cual en un
// portátil y se mapea a su equivalente local. Hoy solo una (ver LOCAL_SUBSTITUTIONS).
//
// Infra que NO se replica en local: `npx playwright install` (descarga navegadores) y el
// `rm` del repo APT de Chrome que el runner trae puesto — se filtran de los dos lados.
// Ese `rm` no verifica nada: existe porque `--with-deps` hace un `apt-get update` que lee el
// índice de ese repo, y un índice desincronizado mata el job antes de bajar el navegador
// (2026-09-09: tres jobs de e2e caídos tres veces con el árbol ya verde). En un portátil ese
// fichero no existe, así que no hay equivalente local que exigir.
//
// `npm ci` YA NO está en esa lista. Lo estuvo, y salió caro: es el PRIMER paso del CI y
// preflight no lo miraba, así que el 2026-08-26 se colaron SEIS pushes con el CI en rojo en
// su primera línea mientras preflight salía verde. Hoy tiene equivalente local
// (`guard:lockfile`, que valida el lock contra las plataformas del runner), así que entra
// por la puerta de las sustituciones, que es donde se ve.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

// CI → local. El smoke completo se corre ENTERO en local, solo que anteponiendo `CI=1`
// —que es la variable que el runner ya tiene puesta—, así que no es otro comando: es el
// mismo con el entorno del CI.
//
// Antes aquí ponía `npm run e2e:structure`, o sea UN test en vez de los 68 del smoke, y
// eso dejaba fuera del gate de pre-push los 56 de `components.spec.ts`: un gate nuevo
// añadido ahí pasaba preflight sin ejecutarse ni una vez. El motivo escrito era que los
// screenshots de componente (sc-card/sc-message) fallan siempre en macOS, pero esos son
// llamadas a `screenshotBaseline()`, que hace no-op justo con `CI=1`. Medido el
// 2026-08-24 en macOS: `CI=1 npm run e2e` → 68/68 en verde, y `public/usage/*.png` sin
// tocar (el `usage-capture` que las pisaba está en `testIgnore` desde entonces).
//
// ACTUALIZACIÓN 2026-09-07: `screenshotBaseline()` ya NO se apaga con `CI`, sino con
// `SC_SKIP_VISUAL_BASELINES`. ACTUALIZACIÓN 2026-09-20: las capturas son `-linux.png` y se
// comparan en el job `e2e-smoke` del CI; en un Mac (`process.platform !== 'linux'`) se saltan
// solas. La red visual de cada cambio es, pues, la del CI, no la del preflight local.
export const LOCAL_SUBSTITUTIONS = {
  // No se puede instalar en limpio en cada push, pero SÍ se puede comprobar lo que hace
  // fallar a `npm ci`: que el lock no cuadre con package.json. Y hay que comprobarlo contra
  // la plataforma del RUNNER, no solo contra la tuya — npm resuelve las dependencias
  // opcionales según dónde estés, y por eso el `npm ci --dry-run` a secas daba verde en
  // macOS con el CI en rojo en Linux.
  'npm ci': 'npm run guard:lockfile',
  // `build:docs` = `npm run build` (DS) + `build:docs:app` (sc-docs). En preflight el DS ya lo
  // construye `verify` justo antes, y rehacerlo mientras las apps compilan en paralelo contra
  // `dist/` sería una carrera. Lo vigila `verifyConstruyeElDs`.
  'npm run build:docs': 'npm run build:docs:app',
};

// SOLO CI (DD-60, 2026-09-09): las suites e2e ya NO van en `preflight`. Las corre el CI, que es
// obligatorio en `main` (branch protection, cinco jobs) y paralelo; en local se corre a mano la
// suite que toca lo cambiado. Motivo medido: el preflight completo eran 20-25 min y solo puede
// vivir UN Playwright por máquina (`playwright-reuse-guard`), así que con tres sesiones a la vez
// se hacían cola durante una hora. La lista es CERRADA y se comprueba en las dos direcciones:
// un paso de aquí que ya no esté en ci.yml es lista rancia (`ciOnlyRancios`), y un paso nuevo del
// CI que no esté ni aquí ni en preflight es drift (`missing`).
//
// `e2e:visual` no hace falta aquí: es un subconjunto de `npm run e2e` (`components.spec.ts`), y
// desde que sus capturas son `*-linux.png` la red visual es la del CI (DD-116).
export const CI_ONLY = ['npm run e2e', 'npm run e2e:supervisor', 'npm run e2e:cuscare'];

// El último patrón es el job que junta las partes de una suite repartida (`needs.<job>.result`):
// no corre nada, solo convierte N checks en el único que exige la protección de `main`.
const INFRA = [
  /^npx playwright install\b/,
  /^sudo rm -f \/etc\/apt\/sources\.list\.d\//,
  /^test "\$\{\{ needs\.[\w-]+\.result \}\}" = success$/,
];
const isInfra = (cmd) => INFRA.some((re) => re.test(cmd));

// SOLO LOCAL. La regla NO es «lo que me apetece saltarme en el CI», es **lo que el CI no puede
// hacer**. Cada entrada va justificada o esta lista deja de significar nada:
//
//  1. `preflight-mark` no es un gate: escribe la marca `.preflight-ok` que exige el hook de push.
//     El CI no la necesita, él ES el oráculo.
//
// `e2e:visual` vivió aquí (DD-62) mientras sus capturas eran del Mac y el CI no podía correrlas.
// Dejó de serlo al pasar a `*-linux.png`, y salió del preflight en DD-116: no vuelvas a meter
// aquí un paso que el CI ya corre.
const LOCAL_ONLY = [/^node scripts\/preflight-mark\.mjs\b/];
const isLocalOnly = (cmd) => LOCAL_ONLY.some((re) => re.test(cmd));

// SETUP: preparar el terreno, no un gate propio. `npm run build` construye el DS a
// `dist/`, que las apps y las suites e2e consumen. En preflight ese build lo hace
// `verify` (su primer paso real), así que NO aparece como comando suelto; en el
// ci.yml paralelo cada job de e2e lo rehace porque su runner arranca con `dist/`
// vacío. No es un paso que preflight se salte: es plumbing que hacen los dos lados,
// solo que preflight lo lleva DENTRO de verify. Se filtra igual en ambos.
const SETUP = [/^npm run build$/];
const isSetup = (cmd) => SETUP.some((re) => re.test(cmd));

const isIgnored = (cmd) => isInfra(cmd) || isSetup(cmd);
const norm = (cmd) => cmd.trim().replace(/\s+/g, ' ');

/*
 * Extrae los comandos `run:` de un workflow de GitHub Actions (inline y block scalar `|`).
 *
 * Las líneas de COMENTARIO no son comandos. Parece obvio y no lo era: hasta el 2026-09-09 este
 * lector se las tragaba, así que documentar POR QUÉ un paso del CI hace lo que hace rompía la
 * paridad y obligaba a elegir entre explicarlo o tener el gate en verde. Un guardián que cobra
 * por comentar el código empuja justo a lo contrario de lo que quiere el repo.
 */
const esComentario = (linea) => /^\s*#/.test(linea);

export function extractCiCommands(ymlText) {
  const lines = ymlText.split('\n');
  const cmds = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)(?:-\s*)?run:\s*(.*)$/);
    if (!m) continue;
    const indent = m[1].length;
    const inline = m[2].trim();
    if (['|', '>', '|-', '>-', ''].includes(inline)) {
      // Block scalar: las líneas MÁS indentadas que la clave `run:` son el comando.
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === '') continue;
        const li = lines[j].match(/^(\s*)/)[1].length;
        if (li <= indent) break;
        if (esComentario(lines[j])) continue;
        cmds.push(norm(lines[j]));
      }
    } else {
      cmds.push(norm(inline));
    }
  }
  return cmds.filter((c) => c && !isIgnored(c));
}

// Extrae los comandos que encadena el script `preflight` (separados por `&&`).
// `node scripts/en-paralelo.mjs 'a' 'b'` son varios pasos, no uno: se comparan sus argumentos.
const PARALELO = /^node scripts\/en-paralelo\.mjs\s+/;
const argsEntreComillas = (s) => [...s.matchAll(/'([^']*)'|"([^"]*)"/g)].map((m) => m[1] ?? m[2]);

export function extractPreflightCommands(preflightScript) {
  return preflightScript
    .split('&&')
    .map(norm)
    .flatMap((c) => (PARALELO.test(c) ? argsEntreComillas(c.replace(PARALELO, '')).map(norm) : [c]))
    .filter((c) => c && !isIgnored(c) && !isLocalOnly(c));
}

// La sustitución `build:docs` → `build:docs:app` solo vale si `verify` construye el DS antes: si
// alguien le quita `npm run build`, las apps se construirían contra un `dist/` viejo.
export function verifyConstruyeElDs(verifyScript) {
  return (verifyScript ?? '').split('&&').map(norm).includes('npm run build');
}

// Lo que preflight DEBERÍA correr = los pasos del CI con la sustitución local aplicada.
export function expectedFromCi(ciCommands) {
  return ciCommands.map((c) => LOCAL_SUBSTITUTIONS[c] ?? c);
}

/** Pasos de CI_ONLY que ci.yml ya no corre: la lista se quedó rancia y hay que encogerla. */
export function ciOnlyRancios(ymlText) {
  const ci = new Set(extractCiCommands(ymlText));
  return CI_ONLY.filter((c) => !ci.has(c));
}

export function checkParity(ymlText, preflightScript) {
  const soloCi = new Set(CI_ONLY);
  const expected = new Set(expectedFromCi(extractCiCommands(ymlText)).filter((c) => !soloCi.has(c)));
  const actual = new Set(extractPreflightCommands(preflightScript));
  const missing = [...expected].filter((c) => !actual.has(c)); // el CI lo exige, preflight no lo corre
  const extra = [...actual].filter((c) => !expected.has(c)); // preflight corre algo que el CI no
  return { ok: missing.length === 0 && extra.length === 0, missing, extra };
}

function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const yml = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const preflight = pkg.scripts?.preflight ?? '';
  if (!preflight) {
    console.error('✗ Falta el script `preflight` en package.json.');
    process.exit(1);
  }
  const { ok, missing, extra } = checkParity(yml, preflight);
  const rancios = ciOnlyRancios(yml);
  if (!verifyConstruyeElDs(pkg.scripts?.verify)) {
    console.error('✗ `verify` ya no corre `npm run build`: el `build:docs:app` de preflight compilaría contra un `dist/` viejo.');
    process.exit(1);
  }
  if (ok && rancios.length === 0) {
    console.log('✓ preflight ≡ ci.yml (menos CI_ONLY, con las sustituciones locales documentadas).');
    return;
  }
  if (missing.length) console.error('✗ El CI corre pasos que `preflight` NO (y no están en CI_ONLY):\n  - ' + missing.join('\n  - '));
  if (extra.length) console.error('✗ `preflight` corre pasos que el CI NO:\n  - ' + extra.join('\n  - '));
  if (rancios.length) console.error('✗ CI_ONLY cita pasos que ci.yml ya no corre:\n  - ' + rancios.join('\n  - '));
  console.error('\nCuadra el script `preflight` con `ci.yml` (o añade la sustitución a LOCAL_SUBSTITUTIONS con su motivo).');
  process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
