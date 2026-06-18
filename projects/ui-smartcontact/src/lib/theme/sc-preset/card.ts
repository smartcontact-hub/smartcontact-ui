import type { CardDesignTokens } from '@primeuix/themes/types/card';

 export default {
    body: {
        gap: "var(--sc-scale-0-5)",
        padding: "var(--sc-scale-1-25)"
    },
    root: {
        color: "{content.color}",
        shadow: "var(--sc-cmp-card-shadow)",
        background: "{content.background}",
        borderRadius: "{border.radius.xl}"
    },
    title: {
        fontSize: "var(--sc-font-size-400)",
        fontWeight: "500"
    },
    caption: {
        gap: "var(--sc-scale-0-5)"
    },
    subtitle: {
        color: "{text.muted.color}"
    }
} satisfies CardDesignTokens;