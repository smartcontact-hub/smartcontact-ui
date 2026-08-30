/**
 * Rutas compartidas de la cadena de tokens — UNA definición, seis consumidores.
 *
 * Las usan los 5 generadores (`token-gen*.mjs`, que ESCRIBEN las zonas `@sc-gen:*`)
 * y `token-parity.mjs` (que VERIFICA lo escrito). Que sean la misma constante no es
 * cosmética: mientras cada script resolvía su propia ruta, `token-parity.mjs`
 * hardcodeaba el export **sin el override `SC_KIT_EXPORT`** que los cinco
 * generadores sí respetaban. Apuntar la cadena a otro export dejaba a generar y a
 * verificar mirando ficheros distintos, y la paridad seguía saliendo verde porque
 * comparaba el export REAL contra un CSS generado desde OTRO. (Medido 2026-08-30;
 * era el ítem `EXPORT_PATH ×7` de AUDIT-DEUDA-2026-06.)
 *
 * Los overrides existen para el mini-test e2e de `bridge-e2e.test.mjs`, que monta un
 * sandbox (copia de las capas + export mutado) y apunta ahí al generador por env.
 * Sin las env, las rutas reales del repo.
 */
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

/** El export DTCG del Kit — la FUENTE DE VERDAD de toda la cadena. */
export const EXPORT_PATH = process.env.SC_KIT_EXPORT
  ? resolve(process.env.SC_KIT_EXPORT)
  : resolve(root, 'projects/design-tokens/scripts/kit-export-dtcg.json');

/** Las capas CSS con las zonas `@sc-gen:*` que reescriben los generadores. */
export const LAYERS_DIR = process.env.SC_LAYERS_DIR
  ? resolve(process.env.SC_LAYERS_DIR)
  : resolve(root, 'projects/design-tokens/src/lib/styles/tokens/layers');
