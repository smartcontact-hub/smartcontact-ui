export type ScGaugeSize = 'sm' | 'md' | 'lg';

export type ScGaugeSeverity = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

/** Un arco del anillo. `value` es un peso relativo (el componente normaliza al total). */
export interface ScGaugeSegment {
  readonly value: number;
  readonly severity: ScGaugeSeverity;
}
