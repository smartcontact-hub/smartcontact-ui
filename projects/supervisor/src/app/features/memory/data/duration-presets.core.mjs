// @ts-check
/**
 * Presets de duración (constructor v2). Valores típicos de contact center para
 * que el supervisor elija sin teclear y sin valores inválidos (idea de la PPT del
 * jefe). Lógica PURA, cubierta por `test:unit`; el builder los consume y ofrece
 * además "Personalizado…" (escape a input libre).
 *
 * El modelo NO cambia (sigue siendo amount+unit, el motor intacto): cada preset
 * mapea a un par natural ('5 min' = {amount:5, unit:'minutes'}); `secs` es la
 * clave canónica para casar/seleccionar.
 */

/** @type {ReadonlyArray<{secs:number,label:string,amount:number,unit:'seconds'|'minutes'}>} */
export const DURATION_PRESETS = [
  { secs: 15, label: '15 s', amount: 15, unit: 'seconds' },
  { secs: 30, label: '30 s', amount: 30, unit: 'seconds' },
  { secs: 45, label: '45 s', amount: 45, unit: 'seconds' },
  { secs: 60, label: '1 min', amount: 1, unit: 'minutes' },
  { secs: 120, label: '2 min', amount: 2, unit: 'minutes' },
  { secs: 180, label: '3 min', amount: 3, unit: 'minutes' },
  { secs: 300, label: '5 min', amount: 5, unit: 'minutes' },
  { secs: 600, label: '10 min', amount: 10, unit: 'minutes' },
  { secs: 900, label: '15 min', amount: 15, unit: 'minutes' },
  { secs: 1800, label: '30 min', amount: 30, unit: 'minutes' },
  { secs: 2700, label: '45 min', amount: 45, unit: 'minutes' },
  { secs: 3600, label: '1 h', amount: 60, unit: 'minutes' },
  { secs: 5400, label: '1,5 h', amount: 90, unit: 'minutes' },
  { secs: 7200, label: '2 h', amount: 120, unit: 'minutes' },
];

/** Segundos de un valor número. @param {number} amount @param {'seconds'|'minutes'} unit */
export function durationToSecs(amount, unit) {
  return unit === 'minutes' ? amount * 60 : amount;
}

/** Preset que coincide EXACTO con amount+unit (por segundos), o null si es
 *  personalizado. @param {number} amount @param {'seconds'|'minutes'} unit */
export function matchDurationPreset(amount, unit) {
  const secs = durationToSecs(amount, unit);
  return DURATION_PRESETS.find((p) => p.secs === secs) ?? null;
}

/** Preset por su clave de segundos. @param {number} secs */
export function durationPresetBySecs(secs) {
  return DURATION_PRESETS.find((p) => p.secs === secs);
}
