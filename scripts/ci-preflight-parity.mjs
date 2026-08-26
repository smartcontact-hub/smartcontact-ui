// Anti-drift entre el script `preflight` (package.json) y el workflow `ci.yml`.
//
// Por qué existe: "corre `npm run preflight` antes de pushear" solo vale si preflight
// corre LO MISMO que el CI. Si alguien añade un paso a `ci.yml` y no lo replica en
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
// Infra que NO se replica en local: `npx playwright install` (descarga navegadores) — se
// filtra de los dos lados.
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
export const LOCAL_SUBSTITUTIONS = {
  'npm run e2e': 'CI=1 npm run e2e',
  // No se puede instalar en limpio en cada push, pero SÍ se puede comprobar lo que hace
  // fallar a `npm ci`: que el lock no cuadre con package.json. Y hay que comprobarlo contra
  // la plataforma del RUNNER, no solo contra la tuya — npm resuelve las dependencias
  // opcionales según dónde estés, y por eso el `npm ci --dry-run` a secas daba verde en
  // macOS con el CI en rojo en Linux.
  'npm ci': 'npm run guard:lockfile',
};

const INFRA = [/^npx playwright install\b/];
const isInfra = (cmd) => INFRA.some((re) => re.test(cmd));
const norm = (cmd) => cmd.trim().replace(/\s+/g, ' ');

// Extrae los comandos `run:` de un workflow de GitHub Actions (inline y block scalar `|`).
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
        cmds.push(norm(lines[j]));
      }
    } else {
      cmds.push(norm(inline));
    }
  }
  return cmds.filter((c) => c && !isInfra(c));
}

// Extrae los comandos que encadena el script `preflight` (separados por `&&`).
export function extractPreflightCommands(preflightScript) {
  return preflightScript
    .split('&&')
    .map(norm)
    .filter((c) => c && !isInfra(c));
}

// Lo que preflight DEBERÍA correr = los pasos del CI con la sustitución local aplicada.
export function expectedFromCi(ciCommands) {
  return ciCommands.map((c) => LOCAL_SUBSTITUTIONS[c] ?? c);
}

export function checkParity(ymlText, preflightScript) {
  const expected = new Set(expectedFromCi(extractCiCommands(ymlText)));
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
  if (ok) {
    console.log('✓ preflight ≡ ci.yml (con las sustituciones locales documentadas).');
    return;
  }
  if (missing.length) console.error('✗ El CI corre pasos que `preflight` NO:\n  - ' + missing.join('\n  - '));
  if (extra.length) console.error('✗ `preflight` corre pasos que el CI NO:\n  - ' + extra.join('\n  - '));
  console.error('\nCuadra el script `preflight` con `ci.yml` (o añade la sustitución a LOCAL_SUBSTITUTIONS con su motivo).');
  process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
