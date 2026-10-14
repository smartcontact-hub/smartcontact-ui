/** Hoy, como AAAA-MM-DD: lo que se guarda al tocar algo que lleva fecha de modificación. */
export function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}
