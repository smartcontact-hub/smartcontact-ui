import { LABEL_COLORS, type LabelColor } from '@shared/components';

export type { LabelColor };
export { LABEL_COLORS };

export interface Label {
  readonly id: number;
  readonly name: string;
  readonly color: LabelColor;
  readonly description?: string;
}

/**
 * Picker swatches consumed by `<sc-color-dot-picker>`. Colors point at the
 * `--sc-label-<color>-dot` tokens (layer 3 — palette), so changing a
 * brand value there propagates to the picker without code changes.
 */
export const LABEL_COLOR_OPTIONS: readonly {
  value: LabelColor;
  labelKey: string;
  color: string;
}[] = [
  { value: 'gray', labelKey: 'labels.color.gray', color: 'var(--sc-label-gray-dot)' },
  { value: 'red', labelKey: 'labels.color.red', color: 'var(--sc-label-red-dot)' },
  { value: 'orange', labelKey: 'labels.color.orange', color: 'var(--sc-label-orange-dot)' },
  { value: 'amber', labelKey: 'labels.color.amber', color: 'var(--sc-label-amber-dot)' },
  { value: 'green', labelKey: 'labels.color.green', color: 'var(--sc-label-green-dot)' },
  { value: 'teal', labelKey: 'labels.color.teal', color: 'var(--sc-label-teal-dot)' },
  { value: 'blue', labelKey: 'labels.color.blue', color: 'var(--sc-label-blue-dot)' },
  { value: 'purple', labelKey: 'labels.color.purple', color: 'var(--sc-label-purple-dot)' },
];

export const LABELS_SEED: readonly Label[] = [
  {
    id: 1,
    name: 'Orange España',
    color: 'orange',
    description: 'Agentes asignados al cliente Orange en España',
  },
  {
    id: 2,
    name: 'Orange Colombia',
    color: 'orange',
    description: 'Agentes asignados al cliente Orange en Colombia',
  },
  {
    id: 3,
    name: 'Soporte Nivel 1',
    color: 'blue',
    description: 'Primer nivel de soporte técnico',
  },
  {
    id: 4,
    name: 'Soporte Nivel 2',
    color: 'purple',
    description: 'Segundo nivel — escalaciones',
  },
  {
    id: 5,
    name: 'VIP',
    color: 'amber',
    description: 'Agentes con capacitación para clientes VIP',
  },
  {
    id: 6,
    name: 'Bilingüe',
    color: 'teal',
    description: 'Agentes con capacidad en dos o más idiomas',
  },
  { id: 7, name: 'Turno Mañana', color: 'green' },
  { id: 8, name: 'Turno Tarde', color: 'green' },
  {
    id: 9,
    name: 'Formación',
    color: 'gray',
    description: 'En proceso de formación, no asignar a colas críticas',
  },
  {
    id: 10,
    name: 'Ventas',
    color: 'red',
    description: 'Especializados en campañas de venta outbound',
  },
];
