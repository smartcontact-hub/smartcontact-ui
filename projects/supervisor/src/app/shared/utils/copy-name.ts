/**
 * El nombre de una copia: «Ventas (copia)», y si ya existe, «Ventas (copia 2)», «Ventas (copia 3)»… El nombre de
 * una lista es único (las plantillas lo validan), así que la copia nunca nace repetida. La comparación ignora
 * mayúsculas, como el resto de comprobaciones de nombre.
 */
export function copyName(name: string, existing: readonly string[], suffix: string): string {
  const taken = new Set(existing.map((n) => n.trim().toLowerCase()));
  let candidate = `${name} (${suffix})`;
  for (let n = 2; taken.has(candidate.toLowerCase()); n++) candidate = `${name} (${suffix} ${n})`;
  return candidate;
}
