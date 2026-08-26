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
 * Uso:  node scripts/lockfile-guard.mjs
 */
import { execFileSync } from 'node:child_process';

/** Plataformas donde corre el CI. Añade aquí si algún día se añade otro runner. */
const PLATFORMS = [
  { os: 'linux', cpu: 'x64', label: 'linux/x64 (el runner del CI)' },
  { os: process.platform, cpu: process.arch, label: `${process.platform}/${process.arch} (esta máquina)` },
];

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

console.log('lockfile OK en todas las plataformas del CI.');
