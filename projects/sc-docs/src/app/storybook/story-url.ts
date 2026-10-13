/**
 * El enlace de una story. La lógica es pura y vive en `story-url.core.mjs`, con su unitaria en
 * `scripts/__tests__/story-url.test.mjs`; aquí solo se reexporta para el resto del motor.
 */
export { codificarArgs, decodificarArgs, slugHistoria, urlDeHistoria } from './story-url.core.mjs';
