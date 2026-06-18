#!/usr/bin/env node
/**
 * GUARD anti "export sucio" (la trampa de preview:live).
 *
 * `preview:live` baja el export de la rama `design-tokens-sync` AL FICHERO TRACKEADO y lo
 * restaura al salir. Si la ventana se cierra de golpe (SIGKILL) o quedan procesos zombie, el
 * export queda con la versión de la RAMA (≠ main) → y el resto del `verify` PASA EN VERDE
 * igualmente, porque los generadores regeneran las capas contra el export sucio y todo queda
 * auto-consistente. Resultado: un export de rama se podría commitear a main sin querer.
 *
 * Este guard cierra ese agujero: en LOCAL, el `kit-export-dtcg.json` del working tree DEBE
 * coincidir con HEAD. Si no, falla RUIDOSO con la receta de limpieza.
 *
 * ⚠️ SOLO en local: el workflow `tokens-sync.yml` aplica el export del plugin SOBRE main a
 * propósito (export ≠ HEAD) antes de correr verify → ahí este check se SALTA (`CI` está puesto;
 * GitHub Actions siempre lo pone). Así el guard protege al dev sin romper el sync legítimo.
 */
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const EXPORT = 'projects/design-tokens/scripts/kit-export-dtcg.json';

if (process.env.CI) {
  process.stdout.write('✓ export-clean: omitido en CI (el sync aplica el export sobre main a propósito).\n');
  process.exit(0);
}

try {
  // exit 0 ⇒ sin diferencias vs HEAD; lanza si hay diff (o si no es repo git).
  execFileSync('git', ['diff', '--quiet', 'HEAD', '--', EXPORT], { cwd: root, stdio: 'ignore' });
} catch {
  process.stderr.write(
    '✗ export-clean: `kit-export-dtcg.json` DIFIERE de HEAD.\n' +
      '  Casi seguro lo dejó sucio un preview:live (zombie/cierre de golpe). Limpia así:\n' +
      '    pkill -f preview-live.mjs\n' +
      `    git checkout HEAD -- ${EXPORT} projects/design-tokens/src/lib/styles/tokens/layers/01-primitive.css\n` +
      '    npm run tokens:import\n' +
      '  (NO commitees el export de la rama a main sin querer.)\n',
  );
  process.exit(1);
}

process.stdout.write('✓ export-clean: kit-export-dtcg.json coincide con HEAD.\n');
process.exit(0);
