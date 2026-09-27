/**
 * Núcleo de la cuenta de las cifras del resumen (`CountUpDirective`): puro, sin Angular ni DOM, para que
 * `node:test` lo pruebe dentro del gate.
 *
 * La DURACIÓN no se escribe aquí: la directiva la lee del `transition-duration` de su propio elemento, que el
 * CSS declara con `--sc-transition-slow` (300 ms, lo mismo que tarda el arco nativo de `p-progress-spinner` en
 * llenarse). Así la apagan a la vez el reset de menos movimiento del Supervisor (0,01 ms) y el
 * `disableAnimations` de las e2e (0 s), sin un `matchMedia` aparte.
 */

/** Una duración de CSS (`0.3s`, `300ms`, `1e-05s`; con varias, la primera) en milisegundos. */
export function cssDurationMs(value) {
  const primera = String(value ?? '').split(',')[0].trim();
  const n = parseFloat(primera);
  if (!Number.isFinite(n)) return 0;
  return primera.endsWith('ms') ? n : n * 1000;
}

/** Sale rápido y frena al llegar: la cifra se asienta, no se para en seco. */
export const easeOutCubic = (t) => 1 - (1 - t) ** 3;

/**
 * La cifra a pintar a los `elapsed` ms de una cuenta de `from` a `to` que dura `duration` ms. Entera, entre las
 * dos, y `to` justo al acabar, no antes: redondea HACIA la de partida, así la última cifra llega a la vez que
 * el arco del anillo (que tarda lo mismo). Por debajo de 1 ms de duración, `to` de una vez.
 */
export function countUpValue(from, to, elapsed, duration) {
  if (!(duration >= 1) || elapsed >= duration) return to;
  const t = Math.max(0, elapsed) / duration;
  const v = from + (to - from) * easeOutCubic(t);
  return to >= from ? Math.floor(v) : Math.ceil(v);
}
