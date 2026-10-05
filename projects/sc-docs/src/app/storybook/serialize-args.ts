/**
 * El código de una story sin snippet propio. La lógica es pura y vive en `serialize-args.core.mjs`, con su unitaria en
 * `scripts/__tests__/serialize-args.test.mjs`; aquí solo se reexporta para el resto del motor.
 */
export { serializeArgs } from './serialize-args.core.mjs';
