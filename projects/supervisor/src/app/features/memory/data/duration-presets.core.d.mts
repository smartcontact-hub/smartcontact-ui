import type { DurationUnit } from './condition.types';

export interface DurationPreset {
  readonly secs: number;
  readonly label: string;
  readonly amount: number;
  readonly unit: DurationUnit;
}

export const DURATION_PRESETS: readonly DurationPreset[];
export function durationToSecs(amount: number, unit: DurationUnit): number;
export function matchDurationPreset(amount: number, unit: DurationUnit): DurationPreset | null;
export function durationPresetBySecs(secs: number): DurationPreset | undefined;
