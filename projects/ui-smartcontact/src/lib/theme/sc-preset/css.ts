import type { StyleOptions } from "@primeuix/styled";
import { fromDesignPx } from "./rem-scale";

const token = (dt: StyleOptions["dt"], key: string, fallback: string) => `${dt(key, fallback) ?? fallback}`;

/*
 * DOS FAMILIAS, Y LA DIFERENCIA LA ARBITRA FIGMA.
 *
 * Todo lo de aquí abajo recibe el MISMO `font-size` (el del Kit: 12/14/16). Lo que
 * cambia es el `line-height`, y no por gusto: medido maestro a maestro en el Kit el
 * 2026-09-05 con el Desktop Bridge.
 *
 *   CONTROLES  → el texto va en `AUTO` en Figma, o sea la métrica de la fuente.
 *                Inter da 17px a 14, 15px a 12 y 19px a 16. Aquí eso es `normal`.
 *   ETIQUETAS  → el texto lleva line-height ATADO en Figma, y vale exactamente lo
 *                que la rampa: chip 20, tag 18, toast 20/18.
 *
 * Antes TODO llevaba la rampa, y por eso los controles salían más altos que el
 * diseño: botón md 36 contra 33, sm 30.5 contra 27.5, lg 43.5 contra 38.5, campo 36
 * contra 34. El padding, la letra y el borde siempre casaron; el sobrante era este.
 *
 * ⚠️ La regla NO desaparece para los controles, cambia de valor. Quitarla los dejaría
 * heredando el `line-height` del body de cada app (1.5 en el supervisor = 21px), que
 * es lo que DD-39 vino a arreglar y sería PEOR que la rampa. `normal` desacopla igual.
 */
const mdControlSelectors = [
    ".p-component.p-button",
    ".p-component.p-inputtext",
    ".p-component.p-textarea",
    ".p-datepicker-day-view",
    ".p-datepicker-time-picker span",
    ".p-editor .ql-container",
    ".p-editor .ql-snow .ql-editor h4",
    ".p-editor .ql-snow .ql-picker.ql-header .ql-picker-item[data-value='4']::before",
    ".p-inputchips .p-inputchips-input-item input",
    ".p-select .p-select-label",
    ".p-multiselect .p-multiselect-label",
    ".p-treeselect .p-treeselect-label",
    ".p-cascadeselect .p-cascadeselect-label",
    ".p-autocomplete .p-autocomplete-input-multiple",
    ".p-autocomplete .p-autocomplete-input-chip input",
    ".p-terminal .p-terminal-prompt-value",
    ".p-component.p-togglebutton",
    ".p-select-option",
    ".p-multiselect-option",
    ".p-listbox-option"
] as const;

/* Estos tres SÍ atan line-height en Figma, y coincide con la rampa. No se tocan. */
const mdRampSelectors = [
    ".p-chip",
    ".p-toast-summary",
    ".p-breadcrumb-item-label",
    ".p-contextmenu-item-label"
] as const;

const smControlSelectors = [
    ".p-component.p-button-sm",
    ".p-component.p-inputtext-sm",
    ".p-component.p-textarea-sm",
    ".p-select.p-select-sm .p-select-label",
    ".p-multiselect.p-multiselect-sm .p-multiselect-label",
    ".p-treeselect.p-treeselect-sm .p-treeselect-label",
    ".p-cascadeselect.p-cascadeselect-sm .p-cascadeselect-label",
    ".p-autocomplete:has(.p-inputtext-sm) .p-autocomplete-input-multiple",
    ".p-autocomplete:has(.p-inputtext-sm) .p-autocomplete-input-chip input",
    ".p-component.p-togglebutton-sm"
] as const;

const smRampSelectors = [".p-tag", ".p-toast-detail"] as const;

const lgControlSelectors = [
    ".p-component.p-button-lg",
    ".p-component.p-inputtext-lg",
    ".p-component.p-textarea-lg",
    ".p-select.p-select-lg .p-select-label",
    ".p-multiselect.p-multiselect-lg .p-multiselect-label",
    ".p-treeselect.p-treeselect-lg .p-treeselect-label",
    ".p-cascadeselect.p-cascadeselect-lg .p-cascadeselect-label",
    ".p-autocomplete:has(.p-inputtext-lg) .p-autocomplete-input-multiple",
    ".p-autocomplete:has(.p-inputtext-lg) .p-autocomplete-input-chip input",
    ".p-component.p-togglebutton-lg"
] as const;

/** Familia CONTROL: la letra del Kit y el interlineado de la fuente (el `AUTO` de Figma). */
const controlRule = (
    selectors: readonly string[],
    dt: StyleOptions["dt"],
    fontSizeToken: string,
    fontSizeFallback: string
) => `${selectors.join(",\n")} {
    font-size: ${token(dt, fontSizeToken, fontSizeFallback)};
    line-height: normal;
}`;

/** Familia ETIQUETA: letra e interlineado del Kit, los dos atados en Figma. */
const rampRule = (
    selectors: readonly string[],
    dt: StyleOptions["dt"],
    fontSizeToken: string,
    lineHeightToken: string,
    fontSizeFallback: string,
    lineHeightFallback: string
) => `${selectors.join(",\n")} {
    font-size: ${token(dt, fontSizeToken, fontSizeFallback)};
    line-height: ${token(dt, lineHeightToken, lineHeightFallback)};
}`;

/* `@primeuix/themes` 3 cambió `ExtendedCSS` a `(options?: StyleOptions) => string`:
 * el argumento pasó a ser OPCIONAL. La firma se relaja igual para casar con el tipo;
 * en la práctica PrimeUIX siempre lo pasa, y si no lo hiciera reventaría al usar `dt`,
 * que es lo correcto — mejor un fallo ruidoso que un CSS silenciosamente vacío. */
const presetCss = ({ dt }: StyleOptions = {} as StyleOptions) => `
${controlRule(mdControlSelectors, dt, "app.typography.md.font.size", fromDesignPx(14))}

${rampRule(
    mdRampSelectors,
    dt,
    "app.typography.md.font.size",
    "app.typography.md.line.height",
    fromDesignPx(14),
    /* 20, no 21: DD-39 unificó el line-height md. El fallback solo entra si la variable
     * no resuelve, y hasta ahora contradecía al token — habría reintroducido justo el
     * 21 que costó semanas cazar. */
    fromDesignPx(20)
)}

${controlRule(smControlSelectors, dt, "app.typography.sm.font.size", fromDesignPx(12))}

${rampRule(
    smRampSelectors,
    dt,
    "app.typography.sm.font.size",
    "app.typography.sm.line.height",
    fromDesignPx(12),
    fromDesignPx(18)
)}

${controlRule(lgControlSelectors, dt, "app.typography.lg.font.size", fromDesignPx(16))}

.p-button .p-button-icon {
    line-height: 1;
}
`;

export default presetCss;
