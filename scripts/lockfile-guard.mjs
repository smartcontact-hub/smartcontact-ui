#!/usr/bin/env node
/**
 * GUARDIÁN DEL LOCKFILE — el paso 1 del CI, comprobado ANTES de pushear.
 *
 * `npm ci` es la primera línea del CI y no la corre `preflight`. Peor: comprobarlo con un
 * `npm ci --dry-run` a secas **no basta**, porque npm resuelve las dependencias OPCIONALES
 * según la plataforma donde estás. En macOS/arm64 el comando dice «up to date» mientras el
 * runner de Linux revienta con
 *
 *     npm error `npm ci` can only install packages when your package.json and
 *     package-lock.json are in sync.
 *     npm error Missing: @emnapi/runtime@1.11.3 from lock file
 *
 * Eso es exactamente lo que pasó el 2026-08-26: CINCO pushes seguidos con el CI en rojo
 * mientras la comprobación local salía verde. El lockfile tenía las variantes de macOS y
 * no las de Linux.
 *
 * Este guardián comprueba el lock contra CADA plataforma que el CI usa, no solo la tuya.
 * Si falla, el arreglo es:
 *
 *     npm install --package-lock-only --os=linux --cpu=x64
 *
 * ⚠️ LO QUE ESTE GUARDIÁN **NO** VE, y hay que decirlo:
 * npm resuelve las `peerDependencies` con rango flotante contra el REGISTRO en el momento
 * de construir el árbol. `@napi-rs/wasm-runtime` pide `@emnapi/runtime: ^1.7.1`, así que en
 * cuanto se publica un parche nuevo el runner puede querer una versión que tu lock no tiene
 * — y tu comprobación local sigue en verde porque tu árbol ya está resuelto. Eso caducó seis
 * pushes seguidos el 2026-08-26.
 *
 * O sea: este guardián caza el desajuste ORDINARIO (añadiste una dependencia y no
 * sincronizaste). Para el flotante, **el único oráculo es el CI**. Tras pushear, LEE su run.
 *
 * SEGUNDA COMPROBACIÓN: la VERSIÓN RAÍZ. `npm ci` no mira el campo `version` del paquete raíz,
 * así que un lock que dice `0.2.0` mientras `package.json` dice `1.0.0` pasa por aquí en verde.
 * Medido el 2026-09-09 sobre `main` en `bbf9ba9`: el corte de la 1.0.0 subió los cuatro
 * `package.json` y dejó el lock en `0.2.0`, y ni este guardián ni el CI dijeron nada.
 * La causa está en `scripts/version-bump.mjs`, que edita los `package.json` con un regex
 * quirúrgico y nunca tocó el lock; desde hoy lo sincroniza él, y esto lo vigila.
 *
 * Uso:  node scripts/lockfile-guard.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Los dos sitios del lock que repiten la versión del paquete raíz. Devuelve los que NO
 * coinciden con `package.json`, cada uno con dónde está y qué debería decir.
 */
export function desajusteDeVersion(pkg, lock) {
  const esperada = pkg.version;
  return [
    { donde: 'package-lock.json → "version"', valor: lock.version },
    { donde: 'package-lock.json → packages[""].version', valor: lock.packages?.['']?.version },
  ]
    .filter((s) => s.valor !== esperada)
    .map((s) => ({ ...s, esperada }));
}

/** Plataformas donde corre el CI. Añade aquí si algún día se añade otro runner. */
const PLATFORMS = [
  { os: 'linux', cpu: 'x64', label: 'linux/x64 (el runner del CI)' },
  { os: process.platform, cpu: process.arch, label: `${process.platform}/${process.arch} (esta máquina)` },
];

function main() {
  const seen = new Set();
  let failed = false;

  for (const p of PLATFORMS) {
    const key = `${p.os}/${p.cpu}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    try {
      execFileSync('npm', ['ci', '--dry-run', `--os=${p.os}`, `--cpu=${p.cpu}`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      console.log(`  ✓ ${p.label}`);
    } catch (err) {
      failed = true;
      const out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
      const missing = [...out.matchAll(/npm error (Missing|Invalid): (.+)/g)].map((m) => m[2]);
      console.error(`  ✗ ${p.label}`);
      for (const m of missing.slice(0, 6)) {
        console.error(`      ${m.trim()}`);
      }
    }
  }

  if (failed) {
    console.error(
      '\nLOCKFILE DESINCRONIZADO. El CI se cae en su PRIMERA línea (`npm ci`).\n' +
        'Arréglalo con:\n\n' +
        '    npm install --package-lock-only --os=linux --cpu=x64\n\n' +
        'y vuelve a correr esto. Un `npm ci --dry-run` a secas NO lo caza: resuelve las\n' +
        'dependencias opcionales según TU plataforma.',
    );
    process.exit(1);
  }

  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const lock = JSON.parse(readFileSync(resolve(root, 'package-lock.json'), 'utf8'));
  const desajustes = desajusteDeVersion(pkg, lock);

  if (desajustes.length) {
    console.error(
      `\nVERSIÓN DESINCRONIZADA. \`package.json\` dice ${pkg.version} y el lock no lo repite:\n`,
    );
    for (const d of desajustes) {
      console.error(`    ${d.donde}: ${d.valor} → debería ser ${d.esperada}`);
    }
    console.error(
      '\nArréglalo con:\n\n' +
        '    npm install --package-lock-only\n\n' +
        'El bump lo sincroniza solo desde el 2026-09-09 (`scripts/version-bump.mjs`); si esto\n' +
        'salta, alguien editó una versión a mano.',
    );
    process.exit(1);
  }
  console.log(`  ✓ versión raíz ${pkg.version} repetida en el lock`);

  console.log('lockfile OK en todas las plataformas del CI.');
}

if (process.argv[1] && process.argv[1].endsWith('lockfile-guard.mjs')) {
  main();
}
