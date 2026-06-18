/**
 * Fuente ÚNICA del mapa de PALETAS primitivas: familia del DS ← familia del export (Kit).
 *
 * El export usa nombres Tailwind; el DS los renombra a marca (la "piedra Rosetta"). Este mapa
 * deja la correspondencia EXPLÍCITA para que el chivato §7 de `token-parity.mjs` verifique que
 * cada primitiva de color del DS sigue 1:1 a su fuente del export — el hueco por el que
 * `soft-blue` se desfasó del `cyan` sin que nadie lo cazara (§1-6 nunca miran color primitivo).
 *
 * Renombres confirmados por VALOR 2026-06-18 (11/11 salvo divergencias listadas abajo):
 *   blue→blue · slate→gray · sky→electric-blue · cyan→soft-blue · (resto, identidad).
 */

/** DS family → export family (de dónde DEBE seguir su valor). `azure` no tiene fuente directa. */
export const PRIMITIVE_SOURCE = {
  blue: 'blue', // Primary (navy SC)
  gray: 'slate', // surface
  'electric-blue': 'sky', // info ("electric blue" del legacy = "sky" en Figma)
  'soft-blue': 'cyan', // accent
  green: 'green',
  amber: 'amber',
  red: 'red',
  yellow: 'yellow',
  zinc: 'zinc',
  orange: 'orange',
  purple: 'purple',
  violet: 'violet',
  teal: 'teal',
  emerald: 'emerald',
};

/**
 * Divergencias CONSCIENTES de primitiva (no fallan; se informan). Clave `familia.step`
 * (regex-friendly: `familia.*` cubre toda la familia). Lo demás que difiera del source → ROJO.
 */
export const PRIMITIVE_DIVERGE = [
  {
    match: 'green.950',
    reason: 'green-950 de MARCA (#0a2916, un punto más oscuro) vs el vanilla del export (#052e16) — consciente',
  },
  {
    match: 'azure.',
    reason:
      'azure (#3b82f6, Tailwind blue) NO tiene familia fuente en el export (el export "blue" es navy) — curado/huérfano, ' +
      'auto-importado de los fondos info. Revisar en la auditoría: ¿familia legítima o renombrar?',
  },
];

/**
 * ¿Está esta primitiva (familia.step) en la lista de divergencias conscientes?
 * Una entrada que acaba en `.` cubre TODA la familia (`soft-blue.`); si no, es step exacto (`green.950`).
 */
export const isPrimitiveDiverge = (family, step) => {
  const key = `${family}.${step}`;
  return PRIMITIVE_DIVERGE.some((d) => (d.match.endsWith('.') ? key.startsWith(d.match) : key === d.match));
};

/**
 * PURA (testeable): dadas las familias del DS y del export (cada una `{ family: { step: hex } }`),
 * devuelve los DESFASES MUDOS — pasos donde una primitiva del DS NO sigue a su fuente del export
 * y NO es divergencia consciente. Es el corazón del chivato §7. Lista vacía = todo 1:1.
 */
export function primitiveDrift(dsFamilies, exFamilies) {
  const drift = [];
  for (const [dsFam, dsSteps] of Object.entries(dsFamilies)) {
    const src = PRIMITIVE_SOURCE[dsFam];
    if (!src) continue; // familia curada sin fuente (azure…) → se informa aparte, no es drift
    const exSteps = exFamilies[src] || {};
    for (const [step, dsHex] of Object.entries(dsSteps)) {
      const exHex = exSteps[step];
      if (exHex === undefined || dsHex === exHex || isPrimitiveDiverge(dsFam, step)) continue;
      drift.push({ family: dsFam, step, dsHex, src, exHex });
    }
  }
  return drift;
}
