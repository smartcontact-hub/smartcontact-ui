import type { StyleOptions } from "@primeuix/styled";
import { fromDesignPx } from "./rem-scale";

const token = (dt: StyleOptions["dt"], key: string, fallback: string) => `${dt(key, fallback) ?? fallback}`;

const mdTypographySelectors = [
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
    ".p-component.p-togglebutton"
] as const;

const smTypographySelectors = [
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

const lgTypographySelectors = [
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

const typographyRule = (
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

const presetCss = ({ dt }: StyleOptions) => `
${typographyRule(
    mdTypographySelectors,
    dt,
    "app.typography.md.font.size",
    "app.typography.md.line.height",
    fromDesignPx(14),
    fromDesignPx(21)
)}

${typographyRule(
    smTypographySelectors,
    dt,
    "app.typography.sm.font.size",
    "app.typography.sm.line.height",
    fromDesignPx(12),
    fromDesignPx(18)
)}

${typographyRule(
    lgTypographySelectors,
    dt,
    "app.typography.lg.font.size",
    "app.typography.lg.line.height",
    fromDesignPx(16),
    fromDesignPx(24)
)}

.p-button .p-button-icon {
    line-height: 1;
}
`;

export default presetCss;
