/**
 * Smart Contact icon size scale — TS-side mirror del CSS layer
 * `--sc-icon-size-*` (S54 C3). Mapea 1:1 a la escala PrimeOne 4.0
 * (Smart Contact Prime UI Kit Pro Variables) y se consume desde los
 * templates Angular donde `<sc-icon [size]="N">` necesita un literal
 * numérico (el input `size` es un `number`, no una CSS variable).
 *
 * **Por qué constants TS**: `<sc-icon>` aplica `size` como `font-size`
 * px inline + alimenta el eje `opsz`; recibe un número, no lee CSS
 * variables. Single source of truth requiere por tanto un mirror TS.
 * Cada cambio de escala se aplica aquí + en `01-primitive.css` (sync).
 *
 * **Resiliencia a updates PrimeNG**: si PrimeOne 5.0 actualiza
 * `iconSize` de 14 → 16, cambio en 1 línea aquí + 1 en CSS. Sin
 * constants, requiere refactor de 85+ hits manuales.
 *
 * **Mapping a escala PrimeOne**: cada const equivale al token CSS
 * homónimo (`SC_ICON_SIZE_DEFAULT` ↔ `--sc-icon-size`). Usados por
 * componentes wrapper SCDS (button, badge, message, toast, dialog...)
 * + features AED/Memory que pintan iconos Material vía `<sc-icon>`.
 */

/** xs (7) — radio button check sm. */
export const SC_ICON_SIZE_XS = 7;
/** sm (10.5) — checkbox sm glyph, radio default. */
export const SC_ICON_SIZE_SM = 10.5;
/** md (12.25) — datatable sort, contextmenu submenu, checkbox default,
 * badge label. Muchos usos chrome-específicos pequeños. */
export const SC_ICON_SIZE_MD = 12.25;
/** Default (14) — iconSize semanticCommon PrimeOne. Default de la app:
 * iconos en buttons, toast close, radio lg, navigation items, badges
 * default, etc. */
export const SC_ICON_SIZE_DEFAULT = 14;
/** lg (15.75) — toast default, message default, message close lg,
 * accordion headers. */
export const SC_ICON_SIZE_LG = 15.75;
/** xl (17.5) — message lg, button icon-only lg. */
export const SC_ICON_SIZE_XL = 17.5;
/** 2xl (21) — image action, confirm popup, card title icon, drawer
 * title. Heading-level iconography. */
export const SC_ICON_SIZE_2XL = 21;
/** 3xl (28) — confirm dialog hero icon, avatar lg, empty state. */
export const SC_ICON_SIZE_3XL = 28;

/**
 * Display sizes (above-scale). Used by illustrations + empty states
 * + brand hero compositions. No mapping a tokens PrimeOne — escala
 * SC-extension consciente.
 */
export const SC_ICON_SIZE_DISPLAY_SM = 32;
export const SC_ICON_SIZE_DISPLAY_MD = 44;
export const SC_ICON_SIZE_DISPLAY_LG = 56;
export const SC_ICON_SIZE_DISPLAY_XL = 64;
