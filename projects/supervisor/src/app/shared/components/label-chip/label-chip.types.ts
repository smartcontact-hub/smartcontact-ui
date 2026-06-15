/**
 * Categorical color set for `<sc-label-chip>` and `<sc-color-dot-picker>`.
 *
 * El conjunto cerrado de 8 valores mapea 1:1 a los tokens
 * `--sc-label-<color>-*` definidos en `tokens/layers/03-palette.css` (capa
 * Palette). El tipo vive en SCDS — no en una feature de AED — para que
 * cualquier consumer del DS (AED, Memory futuro) lo importe sin acoplarse
 * a una capa de aplicación específica.
 */
export type LabelColor = 'gray' | 'red' | 'orange' | 'amber' | 'green' | 'teal' | 'blue' | 'purple';

/** Array iterable de la paleta, en orden de aparición canónico. */
export const LABEL_COLORS: readonly LabelColor[] = [
  'gray',
  'red',
  'orange',
  'amber',
  'green',
  'teal',
  'blue',
  'purple',
];
