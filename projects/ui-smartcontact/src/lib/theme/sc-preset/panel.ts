import type { PanelDesignTokens } from '@primeuix/themes/types/panel';

 export default {
    root: {
        color: "{content.color}",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}"
    },
    title: {
        fontWeight: "600"
    },
    footer: {
        padding: "var(--sc-cmp-panel-footer-padding-top) var(--sc-cmp-panel-footer-padding-right) var(--sc-cmp-panel-footer-padding-bottom) var(--sc-cmp-panel-footer-padding-left)"
    },
    header: {
        color: "{text.color}",
        padding: "var(--sc-cmp-panel-header-padding)",
        background: "#00000000",
        borderColor: "{content.border.color}",
        borderWidth: "0",
        borderRadius: "0"
    },
    content: {
        padding: "var(--sc-cmp-panel-content-padding-top) var(--sc-cmp-panel-content-padding-right) var(--sc-cmp-panel-content-padding-bottom) var(--sc-cmp-panel-content-padding-left)"
    },
    toggleableHeader: {
        padding: "var(--sc-cmp-panel-toggleable-header-padding-y) var(--sc-cmp-panel-toggleable-header-padding-x)"
    }
} satisfies PanelDesignTokens;