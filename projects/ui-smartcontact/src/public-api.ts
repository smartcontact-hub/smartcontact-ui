/*
 * Public API Surface of @smartcontact/components
 *
 * Mitad A (fundaciones): preset + frontera de setup. Los wrappers `sc-*`
 * llegan en el port incremental (Mitad B) — ver docs/component-port-plan.md.
 */
export * from './lib/config/provide-smartcontact-ui';
export { default as scPreset } from './lib/theme/sc-preset';
