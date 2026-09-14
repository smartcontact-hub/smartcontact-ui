/**
 * Funciones puras del pipeline de tokens — extraídas de `token-gen.mjs` para poder
 * testearlas sin ejecutar el generador (que carga el export y hace process.exit).
 *
 * Son el corazón de la "ley v/14": el nombre y el rem de cada token se DERIVAN del
 * valor px de diseño, de forma determinista. Si alguna de estas cambia, todos los
 * `--sc-scale-*` / `--sc-radius-*` cambian → por eso van con tests unitarios.
 */

/**
 * Nombre de un paso de la escala = SU CLAVE en el export (`scale.0-375` → "0-375"), desde DD-89.
 *
 * Antes el nombre salía del VALOR (`scaleSuffix`, valor/14). Mientras la escala valga rem×14 da lo
 * mismo, pero si un valor cambia en Figma el paso se RENOMBRA (6px → "0-429") y todo lo que apuntaba
 * al nombre viejo (`--sc-spacing-*`, temas) se queda apuntando a nada, sin que ningún gate lo cante.
 * Medido el 2026-09-14 en la simulación de la escala a 16: 30 de 35 pasos sin definir. Con la clave,
 * el nombre es estable y solo cambia el valor. La clave tiene la forma de la ley v/14
 * (`[neg-]entero[-decimales]`); si no, falla ruidoso.
 */
export function scaleNameFromKey(path) {
  const m = /^scale\.((?:neg-)?\d+(?:-\d+)?)$/.exec(String(path));
  if (!m) throw new Error(`scaleNameFromKey: «${path}» no es una clave de escala (scale.[neg-]N[-D])`);
  return m[1];
}

/**
 * Ley de naming de la escala 14-base: nombre(v) = (v<0?"neg-":"") + |v|/14, con "." → "-".
 * 14 = base del Kit (root font-size). Desde DD-89 el nombre sale de la CLAVE (`scaleNameFromKey`);
 * esta función queda para AVISAR cuando un paso ya no vale rem×14.
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
