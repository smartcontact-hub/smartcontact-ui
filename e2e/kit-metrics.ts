import { resolve } from 'node:path';

import { loadKitExport } from '../scripts/dtcg-export.mjs';
import { GROUPS, SIZING } from '../scripts/sizing-map.mjs';

/* La misma ruta que `scripts/paths.mjs` (EXPORT_PATH), que no se importa porque usa `import.meta` y
 * Playwright carga los helpers como CommonJS. Los tests corren desde la raíz del repo. */
const EXPORT_PATH = process.env['SC_KIT_EXPORT']
  ? resolve(process.env['SC_KIT_EXPORT'])
  : resolve(process.cwd(), 'projects/design-tokens/scripts/kit-export-dtcg.json');

/**
 * LA MÉTRICA ESPERADA SALE DEL EXPORT DEL KIT, NO DE UN NÚMERO ESCRITO EN EL TEST.
 *
 * Por qué (2026-09-14): el robot de `tokens-sync` salió rojo en el PR #144 con 14 fallos, y 11
 * eran tests que llevaban escrita a mano la medida del Kit («10.5px», «17.5px», «35×21»). El
 * export había cambiado esas medidas en Figma A PROPÓSITO (DD-81), así que el rojo no decía
 * «el tema no aplica el Kit», decía «el Kit ha cambiado», que es justo lo que el robot existe
 * para dejar pasar. Con el número escrito, cada edición deliberada en Figma pedía tocar tests a
 * mano antes de fundir.
 *
 * Ahora el test pregunta lo que de verdad importa: ¿el componente PINTA lo que dice el export?
 * Lee la misma fila de `scripts/sizing-map.mjs` que usan el generador y `tokens:parity`, con el
 * mismo lector (`dtcg-export.mjs`). Un px de diseño del Kit sale igual en el navegador: el repo lo
 * emite como px/16 en rem y la raíz es 16.
 *
 * Lo que sigue poniéndose rojo: que el preset deje de leer la fila, que una capa la pise o que el
 * componente no la use. Eso se probó con el fallo puesto (ver el test de este helper).
 */
const kit = loadKitExport(EXPORT_PATH);

/** px de diseño del Kit para una fila de `sizing-map.mjs` (por su `label`), como lo da `getComputedStyle`. */
export function kitPx(label: string): string {
  const row = SIZING.find((r: { label: string }) => r.label === label);
  if (!row) throw new Error(`kitPx: «${label}» no es una fila de scripts/sizing-map.mjs`);
  const leaf = kit.groups[GROUPS[row.group as keyof typeof GROUPS]]?.get(row.exp);
  const value = leaf ? kit.resolve(leaf.$value) : undefined;
  if (typeof value !== 'number') throw new Error(`kitPx: «${label}» no resuelve a número en el export (${String(value)})`);
  return `${value}px`;
}
