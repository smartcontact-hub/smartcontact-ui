/** Tipos del núcleo de la cuenta (la lógica vive en `count-up.core.mjs`). */
export function cssDurationMs(value: string | null | undefined): number;
/** La curva `ease` de CSS, cubic-bezier(0.25, 0.1, 0.25, 1): la del arco nativo del anillo. */
export function cssEase(x: number): number;
/** La cifra a pintar a los `elapsed` ms de una cuenta de `from` a `to` que dura `duration` ms. */
export function countUpValue(from: number, to: number, elapsed: number, duration: number): number;
