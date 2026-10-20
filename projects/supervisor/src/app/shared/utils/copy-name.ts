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

/**
 * El nombre de una copia, como el de un archivo descargado dos veces: «Online Support (1)», y si ya existe, «(2)».
 * Duplicar «Online Support (1)» da «Online Support (2)»: el número se cuenta sobre el nombre de base, no se apila
 * (revisión de producto del 2026-10-20: «(copia) (copia)» era lo que se quería evitar). Lo usan Duplicar en Grupos y
 * en Agentes (DD-217).
 */
export function nombreDeCopia(name: string, existentes: readonly string[]): string {
  const base = name.trim().replace(/\s\(\d+\)$/, '');
  const usados = new Set(existentes.map((n) => n.trim().toLocaleLowerCase('es')));
  let n = 1;
  while (usados.has(`${base} (${n})`.toLocaleLowerCase('es'))) n++;
  return `${base} (${n})`;
}
