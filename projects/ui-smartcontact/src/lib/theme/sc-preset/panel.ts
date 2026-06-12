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
        padding: "0 var(--sc-scale-1-125) var(--sc-scale-1-125)"
    },
    header: {
        color: "{text.color}",
        padding: "var(--sc-scale-1-125)",
        background: "#00000000",
        borderColor: "{content.border.color}",
        borderWidth: "0",
        borderRadius: "0"
    },
    content: {
        padding: "0 var(--sc-scale-1-125) var(--sc-scale-1-125)"
    },
    toggleableHeader: {
        padding: "var(--sc-scale-0-375) var(--sc-scale-1-125)"
    }
} satisfies PanelDesignTokens;