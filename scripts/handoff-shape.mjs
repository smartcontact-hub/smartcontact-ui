/**
 * Forma de los hand-offs de `docs/handoff/`, como gate (CHECK P de `docs:coherence`).
 *
 * Por qué existe: el hand-off del DS decía en su cabecera «volátil, se reescribe» y se acumulaba:
 * 2.924 líneas, 49 tramos, +700 líneas solo el 2026-09-10, y se leía ENTERO al abrir cada sesión
 * (~52k tokens antes de la primera orden). El mismo caso que LEARNINGS (`learnings-shape.mjs`):
 * un tope en prosa no se cumple por voluntad; se cumple porque esto falla el CI.
 *
 * Qué exige (medido el 2026-09-11 al recortar: cabecera 17 + dos tramos 163 + secciones fijas 186):
 *   · ≤ MAX_LINEAS líneas en total;
 *   · ≤ MAX_TRAMOS tramos (`## ✅ …`): el vigente y los pocos que aún se citan.
 * Lo que sobra no se borra: se archiva con `git tag -a archive/handoff-<frente>-<fecha>` (así se
 * hizo con `archive/handoff-ds-2026-09-11`) y se deja el tramo vigente + las secciones fijas.
 *
 * Se prueba en rojo con casos fabricados en `scripts/__tests__/handoff-shape.test.mjs`.
 */
export const MAX_LINEAS = 400;
export const MAX_TRAMOS = 6;

const TRAMO = /^## ✅ /;

/** Devuelve la lista de problemas (vacía = forma correcta). */
export function revisarHandoff(texto, nombre = 'hand-off') {
  const problemas = [];
  const lineas = texto.split('\n');
  if (lineas.length > MAX_LINEAS)
    problemas.push(
      `${nombre} mide ${lineas.length} líneas; el tope es ${MAX_LINEAS}. Archiva los tramos viejos con un tag \`archive/handoff-<frente>-<fecha>\` y deja el vigente + las secciones fijas.`,
    );
  const tramos = lineas.filter((l) => TRAMO.test(l)).length;
  if (tramos > MAX_TRAMOS)
    problemas.push(`${nombre} tiene ${tramos} tramos \`## ✅\`; el tope es ${MAX_TRAMOS}. Un hand-off es el estado, no el diario: lo anterior vive en git y en DECISIONS.`);
  return problemas;
}
