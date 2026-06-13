/**
 * Conjunto cerrado de 8 colores categóricos del sistema de etiquetas del DS —
 * lo consumen la variante `label` de `sc-tag`/`sc-chip` y `sc-color-dot-picker`.
 *
 * Mapea 1:1 a los tokens `--sc-label-<color>-{bg,text,border,dot}` de la capa
 * Palette (`design-tokens/src/lib/styles/tokens/layers/03-palette.css`). El tipo
 * vive en el DS (no en una feature de app) para que cualquier consumidor lo
 * importe sin acoplarse a una capa de aplicación.
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
