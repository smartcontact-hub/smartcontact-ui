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

/** Un punto de una curva de Bézier cúbica de extremos (0,0) y (1,1), con puntos de control `a` y `b`. */
const bezier = (a, b, u) => 3 * (1 - u) ** 2 * u * a + 3 * (1 - u) * u ** 2 * b + u ** 3;

/**
 * La curva `ease` de CSS, cubic-bezier(0.25, 0.1, 0.25, 1): la de la transición nativa del arco
 * (`stroke-dashoffset 0.3s`, sin curva escrita). Se busca el parámetro que da la `x` pedida (la curva en `x`
 * crece siempre, así que la bisección converge) y se devuelve su `y`.
 */
export function cssEase(x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const u = (lo + hi) / 2;
    if (bezier(0.25, 0.25, u) < x) lo = u;
    else hi = u;
  }
  return bezier(0.1, 1, (lo + hi) / 2);
}

/**
 * La cifra a pintar a los `elapsed` ms de una cuenta de `from` a `to` que dura `duration` ms: va a la par del arco
 * del anillo, con su misma curva y redondeada, así que en cada fotograma dice lo que el arco enseña. Entera, entre
 * las dos, y `to` al acabar. Por debajo de 1 ms de duración, `to` de una vez.
 */
export function countUpValue(from, to, elapsed, duration) {
  if (!(duration >= 1) || elapsed >= duration) return to;
  const t = Math.max(0, elapsed) / duration;
  return Math.round(from + (to - from) * cssEase(t));
}
