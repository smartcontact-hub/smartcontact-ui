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
        padding: "0 1.125rem 1.125rem"
    },
    header: {
        color: "{text.color}",
        padding: "1.125rem",
        background: "#00000000",
        borderColor: "{content.border.color}",
        borderWidth: "0",
        borderRadius: "0"
    },
    content: {
        padding: "0 1.125rem 1.125rem"
    },
    toggleableHeader: {
        padding: "0.375rem 1.125rem"
    }
} satisfies PanelDesignTokens;