/**
 * Emite el bloque de TIPOGRAFÍA como CSS autónomo, para el equipo que consume el tema
 * exportado desde Figma (no nuestras apps, que ya lo reciben por el preset).
 *
 * POR QUÉ EXISTE
 * PrimeNG no modela `line-height` por componente: no hay slot en `ChipDesignTokens`,
 * `TagDesignTokens`, etc. Los valores viajan bien en el `extend` del tema (de ahí salen
 * las `--p-app-typography-*`), pero NADIE los aplica: hace falta una regla CSS que los
 * lea. El plugin de Figma no la genera y nunca lo hará, así que cada consumidor acaba
 * escribiéndola a mano y olvidándose de la mitad de los selectores. Eso es exactamente
 * lo que dejó chip/tag/toast/opciones heredando el 1.5 del documento.
 *
 * Nosotros ya tenemos esa lista resuelta y mantenida en `sc-preset/css.ts`. Este script
 * la LEE de ahí (no la duplica) y la emite como CSS plano. Así el consumidor recibe la
 * misma cobertura que nuestras apps, y no puede desincronizarse: si mañana añadimos un
 * selector al preset, el emitido lo trae solo.
 *
 * USO
 *   node scripts/emit-consumer-typography.mjs            # a stdout
 *   node scripts/emit-consumer-typography.mjs --out f.css
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const CSS_TS = resolve(root, 'projects/ui-smartcontact/src/lib/theme/sc-preset/css.ts');
const src = readFileSync(CSS_TS, 'utf8');

/** Extrae una lista `const <name> = [ "...", ... ]` de css.ts. */
function selectorsOf(name) {
  // Hasta `] as const`, NO hasta el primer `]`: hay selectores con corchete dentro
  // (`.p-editor …[data-value='4']::before`) que cortaban la lista a la mitad y dejaban
  // fuera, entre otros, .p-select-option y .p-multiselect-option.
  const m = src.match(new RegExp(`const ${name}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`));
  if (!m) {
    console.error(`✗ no encuentro ${name} en css.ts — ¿lo han renombrado?`);
    process.exit(1);
  }
  const out = [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  if (out.length === 0) {
    console.error(`✗ ${name} está vacío: emitir un CSS sin selectores sería peor que no emitir nada.`);
    process.exit(1);
  }
  return out;
}

/** px de diseño → rem, igual que `fromDesignPx` del preset (root 16). */
const rem = (px) => `${px / 16}rem`;

const SIZES = [
  { key: 'md', list: 'mdTypographySelectors', fs: 14, lh: 20 },
  { key: 'sm', list: 'smTypographySelectors', fs: 12, lh: 18 },
  { key: 'lg', list: 'lgTypographySelectors', fs: 16, lh: 24 },
];

const bloques = SIZES.map(({ key, list, fs, lh }) => {
  const sel = selectorsOf(list).join(',\n');
  return `/* ${key} — ${fs}/${lh} */\n${sel} {\n` +
    `  font-size: var(--p-app-typography-${key}-font-size, ${rem(fs)});\n` +
    `  line-height: var(--p-app-typography-${key}-line-height, ${rem(lh)});\n}`;
});

const salida = `/* Tipografía de componente — generado desde el Design System.
 *
 * PrimeNG no tiene token de line-height por componente, así que los valores del tema
 * llegan pero no se aplican solos. Esta hoja los aplica.
 *
 * Cárgala DESPUÉS del tema. Los valores salen de las variables del propio tema
 * (--p-app-typography-*), así que cambiar la tipografía en Figma y reinstalar el tema
 * se refleja aquí sin tocar nada: los fallbacks solo entran si la variable no resuelve.
 *
 * NO editar a mano: se regenera con \`npm run emit:consumer-typography\`.
 */

${bloques.join('\n\n')}

/* El icono del botón no hereda el line-height del texto. */
.p-button .p-button-icon {
  line-height: 1;
}
`;

const i = process.argv.indexOf('--out');
if (i !== -1 && process.argv[i + 1]) {
  writeFileSync(process.argv[i + 1], salida);
  console.log(`✓ escrito en ${process.argv[i + 1]} (${SIZES.length} tallas)`);
} else {
  process.stdout.write(salida);
}
