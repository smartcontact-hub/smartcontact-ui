/**
 * Utilidades de duración de audio, compartidas por los dos reproductores
 * (`multi-recording-player` y `conversation-player-modal`).
 *
 * ⚠️ **Estaban duplicadas pero NO eran idénticas**, y esa es la parte que
 * importa: al unificarlas hay que quedarse con la versión segura de cada una,
 * no con la primera que se encuentre. Las dos divergencias, medidas el
 * 2026-08-24:
 *
 *   · `formatTime` — el reproductor múltiple acotaba a 0 (`Math.max(0, …)`) y
 *     el modal no. Con un `currentTime` negativo —que ocurre de verdad durante
 *     un seek, no es hipotético— el modal pintaba `-1:-05`. Gana la acotada, y
 *     eso arregla ese defecto de paso.
 *   · `parseDuration` — el modal aceptaba `undefined` y devolvía 0; el otro
 *     asumía `string` y habría reventado. Gana la que acepta `undefined`.
 *
 * En las dos, la versión que se conserva es superconjunto de la otra, así que
 * nadie pierde comportamiento: uno gana una guarda que le faltaba.
 */

/** `mm:ss` a partir de segundos. Los negativos se acotan a `00:00`. */
export function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const rest = (safe % 60).toString().padStart(2, '0');

  return `${minutes}:${rest}`;
}

/** Segundos a partir de `mm:ss` o `hh:mm:ss`. Cualquier otra cosa → 0. */
export function parseDurationSeconds(duration?: string): number {
  if (!duration) {
    return 0;
  }

  const parts = duration.split(':').map((part) => parseInt(part, 10));

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return 0;
}
