#!/usr/bin/env node
/**
 * Publica los 3 paquetes ya compilados (`dist/<proj>`) en orden de dependencia
 * (styles → icons → components, para que los peerDeps internos resuelvan).
 *
 * SEGURO POR DEFECTO: corre en `--dry-run` salvo que se pase `--publish`. El
 * registry y la auth se toman de tu `.npmrc` (ver `.npmrc.example`); los paquetes
 * llevan `publishConfig.access=restricted` como red de seguridad contra un publish
 * público accidental.
 *
 * Uso:
 *   npm run publish:packages              # dry-run (verifica sin publicar)
 *   npm run publish:packages -- --publish # publica de verdad (registry configurado)
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
// Orden de dependencia: styles e icons antes que components.
const order = ['design-tokens', 'ui-smartcontact-icons', 'ui-smartcontact'];
const doPublish = process.argv.includes('--publish');

for (const project of order) {
  const dist = resolve(root, 'dist', project);
  if (!existsSync(dist)) {
    console.error(`✗ No existe ${dist} — compila primero (npm run build).`);
    process.exit(1);
  }

  const args = ['publish', dist, ...(doPublish ? [] : ['--dry-run'])];
  console.log(`→ npm ${args.join(' ')}`);
  execFileSync('npm', args, { cwd: root, stdio: 'inherit' });
}

console.log(
  doPublish
    ? '✓ Publicados los 3 paquetes.'
    : '✓ Dry-run OK. Configura .npmrc y pasa --publish para publicar de verdad.',
);
