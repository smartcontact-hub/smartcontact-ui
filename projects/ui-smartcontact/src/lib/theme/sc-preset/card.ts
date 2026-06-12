import type { CardDesignTokens } from '@primeuix/themes/types/card';

 export default {
    body: {
        gap: "var(--sc-scale-0-5)",
        padding: "var(--sc-scale-1-25)"
    },
    root: {
        color: "{content.color}",
        shadow: "0 0.071429rem 0.142857rem -0.071429rem #0000001a, 0 0.071429rem 0.214286rem 0 #0000001a",
        background: "{content.background}",
        borderRadius: "{border.radius.xl}"
    },
    title: {
        fontSize: "var(--sc-scale-1-25)",
        fontWeight: "500"
    },
    caption: {
        gap: "var(--sc-scale-0-5)"
    },
    subtitle: {
        color: "{text.muted.color}"
    }
} satisfies CardDesignTokens;