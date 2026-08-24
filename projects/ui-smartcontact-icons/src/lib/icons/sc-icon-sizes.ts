/**
 * Smart Contact icon size scale — TS-side mirror del CSS layer
 * `--sc-icon-size-*` (S54 C3). Se consume desde los templates Angular donde
 * `<sc-icon [size]="N">` necesita un literal numérico (el input `size` es un
 * `number`, no una CSS variable).
 *
 * ⚠️ **El espejo estuvo roto y esto es lo que lo arregló (2026-08-24).** La
 * rampa del CSS pasó a píxeles REDONDOS bajo **DD-13** —`01-primitive.css:430`
 * lo documenta: «un icono junto a texto 16 = 16, no 15.75», divergencia SC
 * consciente sin contrapartida en Figma— y este fichero, que se declara espejo
 * suyo, no siguió: se quedó en la rampa fraccionaria del Kit (7 · 10.5 · 15.75
 * · 17.5 · 21). Cinco constantes desfasadas y 21 sitios de llamada pintando
 * medio píxel menos que su token CSS homónimo.
 *
 * El audit lo listaba como «SC_ICON_SIZE_LG=15.75 vs token 16px», una sola
 * constante. Eran cinco. Si vuelves a ver aquí un valor fraccionario, no es que
 * siga al Kit: es que el espejo se ha vuelto a descolgar.
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

/** xs (8) — radio button check sm. */
export const SC_ICON_SIZE_XS = 8;
/** sm (10) — checkbox sm glyph, radio default. */
export const SC_ICON_SIZE_SM = 10;
/** md (12) — datatable sort, contextmenu submenu, checkbox default,
 * badge label. Muchos usos chrome-específicos pequeños. */
export const SC_ICON_SIZE_MD = 12;
/** Default (14) — iconSize semanticCommon PrimeOne. Default de la app:
 * iconos en buttons, toast close, radio lg, navigation items, badges
 * default, etc. */
export const SC_ICON_SIZE_DEFAULT = 14;
/** lg (16) — toast default, message default, message close lg,
 * accordion headers. */
export const SC_ICON_SIZE_LG = 16;
/** xl (18) — message lg, button icon-only lg. */
export const SC_ICON_SIZE_XL = 18;
/** 2xl (20) — image action, confirm popup, card title icon, drawer
 * title. Heading-level iconography. */
export const SC_ICON_SIZE_2XL = 20;
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
