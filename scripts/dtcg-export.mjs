/**
 * Lector compartido del export DTCG del Kit (Theme Designer / plugin
 * primeui-figma-plugin-v4). Lo usan el generador (`token-gen.mjs`) y la
 * auditoría de paridad (`token-parity.mjs`) para hablar el formato REAL del
 * export — verificado empíricamente:
 *
 *   - Grupos en claves slash de primer nivel: `aura/primitive`,
 *     `aura/semantic/common`, `aura/semantic/light|dark`,
 *     `aura/component/common`, `aura/component/light|dark`, `aura/custom`,
 *     `aura/app`, `aura/effects` (+ `source`, metadato del plugin).
 *   - Hojas DTCG: `{ $value, $type }`.
 *   - Referencias con PUNTO relativas al árbol completo: `{scale.0-5}`,
 *     `{form.field.padding.x}`, `{typography.font.size.100}`, `{blue.500}`.
 *     La resolución es por sufijo de ruta dentro del grupo más cercano: se
 *     indexa cada hoja por su ruta con puntos y se resuelve buscando la ruta
 *     completa en los espacios de nombres conocidos (primitive → semantic →
 *     custom → component), que es como las resuelve el runtime de PrimeUIX.
 *
 * Hereda del `convert-tokens.js` del repo de desarrollo la idea del import
 * DTCG (parseo + resolución de referencias); las ~20 ramas muertas de aquel
 * script no se portan.
 */
import { readFileSync } from 'node:fs';

/** Aplana un grupo DTCG a Map<rutaConPuntos, hoja>. */
function flatten(group, prefix, into) {
  for (const [key, value] of Object.entries(group)) {
    if (key.startsWith('$') || value == null || typeof value !== 'object') continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (value.$value !== undefined) into.set(path, value);
    else flatten(value, path, into);
  }
  return into;
}

export function loadKitExport(path) {
  let raw = JSON.parse(readFileSync(path, 'utf8'));
  if (typeof raw === 'string') raw = JSON.parse(raw); // export como string escapado

  const groups = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === 'source') continue;
    groups[key] = flatten(value, '', new Map());
  }

  // Espacios de búsqueda para resolver referencias `{a.b.c}`, en orden de
  // prioridad (primitivos primero: una ref `{blue.500}` debe caer en
  // aura/primitive aunque exista `blue` en otro grupo).
  const SEARCH_ORDER = [
    'aura/primitive',
    'aura/semantic/common',
    'aura/semantic/light',
    'aura/custom',
    'aura/app',
    'aura/component/common',
  ];

  function lookup(path, mode) {
    const spaces = [...SEARCH_ORDER];
    if (mode === 'dark') spaces.splice(2, 1, 'aura/semantic/dark');
    for (const space of spaces) {
      const leaf = groups[space]?.get(path);
      if (leaf) return leaf;
    }
    return undefined;
  }

  /**
   * Resuelve un $value a su valor final (número o string). `mode` decide el
   * scheme para las refs semánticas ('light' por defecto).
   */
  function resolve(value, mode = 'light', seen = new Set()) {
    if (typeof value !== 'string') return value;
    const m = value.match(/^\{([^}]+)\}$/);
    if (!m) return value;
    const path = m[1];
    if (seen.has(path)) throw new Error(`Referencia circular: {${path}}`);
    seen.add(path);
    // `typography.*` vive bajo `custom.typography` en aura/custom; las refs
    // del export la nombran sin el prefijo del grupo.
    const leaf =
      lookup(path, mode) ??
      lookup(`custom.${path}`, mode) ??
      lookup(`app.${path}`, mode) ??
      lookup(`border.${path}`, mode);
    if (!leaf) throw new Error(`Referencia sin destino en el export: {${path}}`);
    return resolve(leaf.$value, mode, seen);
  }

  return { groups, resolve };
}
