/*
 * Public API Surface of @smartcontact/components
 *
 * Mitad A (fundaciones): preset + frontera de setup. Los wrappers `sc-*`
 * llegan en el port incremental (Mitad B) — ver docs/component-port-plan.md.
 */
export * from './lib/core/types/button.types';
export * from './lib/core/types/badge.types';
export * from './lib/core/types/theme-component.types';
export * from './lib/components/button/sc-button.component';
export * from './lib/components/badge/sc-badge.component';
export * from './lib/components/card/sc-card.component';
export * from './lib/components/chip/sc-chip.component';
export * from './lib/components/tag/sc-tag.component';
export * from './lib/config/provide-smartcontact-ui';
export { default as scPreset } from './lib/theme/sc-preset';
