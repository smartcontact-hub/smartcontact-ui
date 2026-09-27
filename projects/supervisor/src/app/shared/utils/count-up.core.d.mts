/** Tipos del núcleo de la cuenta (la lógica vive en `count-up.core.mjs`). */
export function cssDurationMs(value: string | null | undefined): number;
export function easeOutCubic(t: number): number;
/** La cifra a pintar a los `elapsed` ms de una cuenta de `from` a `to` que dura `duration` ms. */
export function countUpValue(from: number, to: number, elapsed: number, duration: number): number;
