/**
 * Forma de `LEARNINGS.md`, como gate (CHECK K de `docs:coherence`).
 *
 * Por qué existe: el tope "~20 reglas" fue prosa durante 50 commits y el fichero pasó de 1.765 a
 * 10.757 palabras (2026-07-18 → 2026-09-02) sin que nada se pusiera rojo. El crecimiento se
 * desvió al INTERIOR de las entradas —43 sub-entradas `*Corolario (sNN)*` con acción propia— y
 * el check G (índice ≡ cuerpo) solo contaba cabeceras `N. **`, así que validaba el agujero. Un
 * audit lo diagnosticó el 2026-08-13 y el fichero se duplicó después. La instrucción "afila, no
 * acumula" no se cumple por voluntad: se cumple porque esto falla el CI.
 *
 * Qué exige (cada límite viene del recorte real del 2026-09-02, con margen):
 *   · ≤ MAX_LINEAS líneas en total (el recorte dejó ~170);
 *   · ≤ MAX_REGLAS reglas en el índice (el tope que el fichero siempre prometió);
 *   · cada regla ≤ MAX_LINEAS_REGLA líneas no vacías, y con UNA línea `Evidencia:`;
 *   · sin sub-entradas: `*Corolario*`, `*Evidencia (sNN)*`, `*Reincidencia*`, `*Absorbe*`,
 *     `*Afilado*`, `*Actualización*`, ni `**Disparador**:` / `**Acción**:` dentro de una regla.
 *     Si una lección necesita párrafo propio, es otra regla (con número e índice) o es un hook.
 *
 * Se prueba en rojo con casos fabricados en `scripts/__tests__/learnings-shape.test.mjs`.
 */
export const MAX_LINEAS = 200;
export const MAX_REGLAS = 20;
export const MAX_LINEAS_REGLA = 12;

const CABECERA_REGLA = /^\s*(\d+)\. \*\*/;
const FILA_INDICE = /^\| \*\*(\d+)\*\* \|/;
const SUBENTRADA = /^\s*\*(Corolario|Evidencia \(|Reincidencia|Absorbe|Afilado|Actualización)/;
const MARCADOR_SUBREGLA = /\*\*(Disparador|Acción)( afilado| nueva| definitivo)?\*\*\s*:/;

/** Devuelve la lista de problemas (vacía = forma correcta). */
export function revisarLearnings(texto) {
  const problemas = [];
  const lineas = texto.split('\n');
  if (lineas.length > MAX_LINEAS)
    problemas.push(`LEARNINGS.md mide ${lineas.length} líneas; el tope es ${MAX_LINEAS}. Corta o convierte en hook/gate antes de añadir.`);

  const filas = lineas.filter((l) => FILA_INDICE.test(l)).length;
  if (filas > MAX_REGLAS) problemas.push(`el índice tiene ${filas} reglas; el tope es ${MAX_REGLAS}: añadir obliga a fundir o borrar.`);

  // Reglas: de una cabecera `N. **` hasta la siguiente cabecera, un `## ` o el final.
  let actual = null;
  const cerrar = () => {
    if (!actual) return;
    const noVacias = actual.lineas.filter((l) => l.trim() !== '').length;
    if (noVacias > MAX_LINEAS_REGLA)
      problemas.push(`la regla ${actual.n} ocupa ${noVacias} líneas; el tope es ${MAX_LINEAS_REGLA}. Si no cabe, es más de una regla o es un hook.`);
    if (!actual.lineas.some((l) => /^\s*Evidencia:/.test(l)))
      problemas.push(`la regla ${actual.n} no tiene línea \`Evidencia:\` (una, con sesión y hecho; la historia va en git).`);
    actual = null;
  };
  lineas.forEach((l, i) => {
    const cab = l.match(CABECERA_REGLA);
    if (cab) {
      cerrar();
      actual = { n: cab[1], lineas: [l] };
      return;
    }
    if (/^## /.test(l)) {
      cerrar();
      return;
    }
    if (actual) {
      actual.lineas.push(l);
      if (SUBENTRADA.test(l))
        problemas.push(`L${i + 1}: sub-entrada dentro de la regla ${actual.n} («${l.trim().slice(0, 40)}…»). Fúndela en la regla, dale número propio, o hazla hook.`);
      if (MARCADOR_SUBREGLA.test(l))
        problemas.push(`L${i + 1}: la regla ${actual.n} lleva un **Disparador**/**Acción** interno: eso es otra regla escondida. Dale número e índice.`);
    }
  });
  cerrar();
  return problemas;
}
