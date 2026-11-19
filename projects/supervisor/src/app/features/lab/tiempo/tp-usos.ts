/**
 * CUÁNTO SE USA CADA GESTO DEL EDITOR, para la prueba con personas (DD-256): elegir, copiar, pegar, cortar, borrar,
 * pintar, arrastrar, dividir y recortar con la raya, deshacer y rehacer. La prueba lo pone a cero al empezar cada misión y lo manda con su corrección
 * (`tp-prueba.ts`), así se sabe si un atajo se descubre solo sin que nadie lo explique. Explica, no decide.
 *
 * Solo cuenta, en memoria: ni guarda ni envía nada, y una recarga a mitad de misión lo pone a cero. Fuera de una prueba
 * nadie lo lee.
 */
export type Uso =
  | 'elegir'
  | 'copiar'
  | 'pegar'
  | 'cortar'
  | 'borrar'
  | 'pintar'
  | 'arrastrar'
  | 'dividir'
  | 'recortar'
  | 'deshacer'
  | 'rehacer';

let cuenta: Partial<Record<Uso, number>> = {};

export function contarUso(uso: Uso): void {
  cuenta = { ...cuenta, [uso]: (cuenta[uso] ?? 0) + 1 };
}

/** Lo usado desde la última puesta a cero; solo lo que se usó alguna vez. */
export const usosDelEditor = (): Readonly<Partial<Record<Uso, number>>> => cuenta;

export function ponerUsosACero(): void {
  cuenta = {};
}
