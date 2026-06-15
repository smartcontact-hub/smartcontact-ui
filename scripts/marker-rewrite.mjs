/**
 * Reescritor de regiones marcadas `START … END` en un texto, preservando el
 * indent y el resto del fichero. UNA sola implementación, compartida por los
 * generadores de tokens (`token-gen.mjs` → zonas @sc-gen:* de 01-primitive.css;
 * `token-gen-component.mjs` → zona @sc-gen:cmp-sizing de 04-component.css), para
 * que ambos splicen igual y no diverjan.
 *
 * Devuelve el texto reescrito, o `null` si faltan los marcadores.
 */
export function rewriteRegion(txt, startTag, endTag, header, body) {
  const si = txt.indexOf(startTag);
  const ei = txt.indexOf(endTag);
  if (si < 0 || ei < 0) return null;
  const lineStart = txt.lastIndexOf('\n', si) + 1;
  const indent = txt.slice(lineStart, si);
  const block = `${indent}${header}\n${body}\n${indent}${endTag}`;
  return txt.slice(0, lineStart) + block + txt.slice(ei + endTag.length);
}
