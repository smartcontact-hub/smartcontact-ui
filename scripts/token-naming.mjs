/**
 * Funciones puras del pipeline de tokens — extraídas de `token-gen.mjs` para poder
 * testearlas sin ejecutar el generador (que carga el export y hace process.exit).
 *
 * Son el corazón de la "ley v/14": el nombre y el rem de cada token se DERIVAN del
 * valor px de diseño, de forma determinista. Si alguna de estas cambia, todos los
 * `--sc-scale-*` / `--sc-radius-*` cambian → por eso van con tests unitarios.
 */

/**
 * Ley de naming de la escala 14-base: nombre(v) = (v<0?"neg-":"") + |v|/14, con "." → "-".
 * 14 = base del Kit (root font-size). El nombre sale del VALOR, nunca del string de la clave.
 * Ej.: 5.25 → "0-375" · 14 → "1" · -7 → "neg-0-5".
 */
export function scaleSuffix(v) {
  const mult = parseFloat((Math.abs(v) / 14).toFixed(3)); // 16/14 → 1.143
  return (v < 0 ? 'neg-' : '') + String(mult).replace('.', '-');
}

/**
 * px de diseño → rem (root 16). Conversión centralizada (pre-flight §1): los pasos de la
 * escala 14-base (cuantos de 0.25px) dividen exacto entre 16 → sin pérdida. 0 se queda en "0".
 * Ej.: 14 → "0.875rem" · 0 → "0".
 */
export function toRem(px) {
  if (px === 0) return '0';
  const rem = Number((px / 16).toFixed(6));
  return `${rem}rem`;
}

/**
 * Normaliza un hex del export: si viene en #RRGGBBAA con alfa "ff" (opaco), lo deja en #RRGGBB.
 * Otros valores (con alfa real, o ya de 6) se devuelven tal cual.
 */
export function dropAlpha(hex) {
  return hex.length === 9 && hex.endsWith('ff') ? hex.slice(0, 7) : hex;
}
