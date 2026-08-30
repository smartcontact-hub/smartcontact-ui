import { computed, type Signal } from '@angular/core';

/**
 * Estado compartido de los campos del DS — la parte de LÓGICA del field-pattern,
 * la que quedaba duplicada tras extraer la plantilla (`sc-field-label`,
 * `sc-field-msg`, commit B2).
 *
 * Cinco componentes —inputtext, select, multiselect, datepicker, inputnumber—
 * repetían estos computeds carácter a carácter salvo el nombre del bloque BEM.
 * Ahí es donde nace el drift: el fix del bug de `hasPrimitiveOptions` (opciones
 * en blanco con `string[]`) hubo que pensarlo una vez y aplicarlo dos, y las dos
 * copias ya divergían en el comentario. Aquí viven una sola vez.
 *
 * Son FUNCIONES, no una clase base ni una directiva: cada componente sigue
 * declarando su propia API pública (que es lo que `audit:components` gatea y lo
 * que se lee en un fichero) y solo delega el cálculo. No hay export en
 * `public-api.ts` a propósito — esto es fontanería interna del DS.
 */

export type ScFieldSize = 'sm' | 'md' | 'lg';

/** Contador de ids de instancia. Global a propósito: el baseline de estructura
 *  normaliza `(sc-[a-z]+)-\d+` → `-N`, así que el número concreto nunca se fija;
 *  lo único que importa es que cada campo sin `inputId` reciba uno estable. */
let scFieldIdSeq = 0;

interface ScFieldStateInputs {
  /** El `inputId` explícito del consumidor, si lo hay. */
  readonly inputId: Signal<string | undefined>;
  readonly error: Signal<string | undefined>;
  readonly helperText: Signal<string | undefined>;
  /** Estado inválido explícito. Los campos que no lo exponen pasan `undefined`. */
  readonly invalid?: Signal<boolean>;
}

/**
 * `resolvedId` + `msgId` + `isInvalid` + `footerText`, idénticos en los cinco.
 *
 * `isInvalid` ya no mira el `NgControl`: con el `ControlValueAccessor` retirado
 * (DD, 2026-08-30) esa rama era inalcanzable —no hay ni un consumidor de Reactive
 * Forms en el repo— y su única señal real es `invalid()`/`error()`.
 */
export function createScFieldState(block: string, inputs: ScFieldStateInputs) {
  const seq = ++scFieldIdSeq;
  const resolvedId = computed(() => inputs.inputId() ?? `${block}-${seq}`);
  const msgId = computed(() => `${resolvedId()}-msg`);
  const isInvalid = computed(() => (inputs.invalid?.() ?? false) || !!inputs.error());
  const footerText = computed(() => inputs.error() || inputs.helperText() || '');
  return { resolvedId, msgId, isInvalid, footerText };
}

/**
 * Traducción de `sm/md/lg` al `size` de PrimeNG y a la clase del panel overlay.
 * La comparten los tres que abren panel: select, multiselect y datepicker.
 * `block` es el BEM del componente (`sc-select`), así que la clase sale
 * `sc-select-panel--sm`, tal cual la espera `_sc-overlay-sizes.scss`.
 */
export function createScPanelSizing(block: string, size: Signal<ScFieldSize>) {
  const pSize = computed<'small' | 'large' | undefined>(() => {
    const s = size();
    return s === 'sm' ? 'small' : s === 'lg' ? 'large' : undefined;
  });
  const panelStyleClass = computed(() => {
    const s = size();
    return s === 'sm' ? `${block}-panel--sm` : s === 'lg' ? `${block}-panel--lg` : '';
  });
  return { pSize, panelStyleClass };
}

interface ScOptionInputs {
  readonly options: Signal<readonly unknown[]>;
  readonly optionLabel: Signal<string | undefined>;
  readonly optionValue: Signal<string | undefined>;
}

/**
 * Los cuatro computeds de opciones que select y multiselect tenían idénticos.
 *
 * `hasPrimitiveOptions` es el que paga la extracción: cuando `options` es un
 * array de primitivas (`string[]`, `number[]`), PrimeNG NO debe recibir
 * `optionLabel`/`optionValue` — si los recibe intenta resolver `.label` en cada
 * string y todas las opciones renderizan vacías (el bug «empty empty…» de los
 * grupos: tipoVoz, prioridad, estrategia). Con una sola copia, ese fix vale para
 * los dos.
 */
export function createScOptionState(inputs: ScOptionInputs) {
  /** PrimeNG tipa `[options]` como `any[]` mutable; casteamos el readonly. */
  const optionsMutable = computed(() => inputs.options() as unknown[]);
  const hasPrimitiveOptions = computed(() => {
    const opts = inputs.options();
    return opts.length > 0 && opts.every((o) => o === null || typeof o !== 'object');
  });
  const resolvedOptionLabel = computed(() =>
    hasPrimitiveOptions() ? undefined : inputs.optionLabel(),
  );
  const resolvedOptionValue = computed(() =>
    hasPrimitiveOptions() ? undefined : inputs.optionValue(),
  );
  return { optionsMutable, hasPrimitiveOptions, resolvedOptionLabel, resolvedOptionValue };
}
