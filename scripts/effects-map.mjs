/**
 * Conversión de `aura/effects` (Figma) → token CSS `box-shadow`. La consume el generador
 * `token-gen-effects.mjs` (emite `@sc-gen:effects`) y la auditoría §8 (value-check).
 *
 * Una hoja de effects es una sombra: objeto `{x,y,blur,spread,color}` o ARRAY de ellos
 * (multicapa). Las longitudes vienen en px (enteros); el color en `#rrggbb[aa]`.
 *
 * REGLAS (mismo idioma que el `--sc-shadow-*` curado que ya vive en 05-extensions.css):
 *   - longitudes → px literal (las sombras NO escalan con la tipografía; el token vive en
 *     una capa CSS, no en el preset → nada de design-rem aquí).
 *   - color → el hex EXACTO del Kit (las sombras no son primitivas de paleta; su color es
 *     un color de efecto, no un --sc-color-*). Opaco → #rrggbb · con alfa → #rrggbbaa.
 *   - capa con alfa 0 → se descarta; sombra entera transparente → NO se emite (el foco del
 *     DS es por outline, no shadow-ring → esas 71 hojas *.focus.ring.shadow son no-op).
 *
 * Así un cambio de sombra en Figma fluye al token y el preset (tras el rewire, Etapa 2) lo lee.
 */

/** #rrggbb[aa] → { base:'#rrggbb', alpha:0..255 }. PURA. */
export function splitAlpha(hex) {
  const s = String(hex).toLowerCase();
  const base = s.slice(0, 7);
  const alpha = s.length === 9 ? parseInt(s.slice(7, 9), 16) : 255;
  return { base, alpha };
}

/** Un valor numérico de longitud (px) → cadena CSS: '0' tal cual, resto con sufijo px. */
function len(n) {
  const v = Number(n);
  return v === 0 ? '0' : `${v}px`;
}

/** Color de una capa → CSS: alfa 255 → #rrggbb · alfa 0 → null (capa muerta) · resto → #rrggbbaa. */
function layerColor(color) {
  const { base, alpha } = splitAlpha(color);
  if (alpha === 0) return null;
  if (alpha === 255) return base;
  return base + alpha.toString(16).padStart(2, '0');
}

/** Una capa `{x,y,blur,spread,color}` → 'x y blur spread color', o null si transparente. */
function layerToCss(l) {
  const c = layerColor(l.color);
  if (c == null) return null;
  return `${len(l.x)} ${len(l.y)} ${len(l.blur)} ${len(l.spread)} ${c}`;
}

/**
 * Sombra (objeto o array) → cadena `box-shadow`, o null si TODA es transparente (no-op).
 * PURA → testeable con fixtures. Descarta capas transparentes individuales.
 */
export function shadowToCss(value) {
  const layers = Array.isArray(value) ? value : [value];
  const css = layers.map(layerToCss).filter((s) => s != null);
  return css.length ? css.join(', ') : null;
}

/** ruta de aura/effects → nombre de token (mismo esquema que cmp-color: `sc-cmp-<kebab>`). */
export const tokenName = (path) => `sc-cmp-${path.replace(/\./g, '-')}`;
