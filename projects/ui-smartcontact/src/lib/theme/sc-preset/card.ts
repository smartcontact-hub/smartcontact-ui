import type { CardDesignTokens } from '@primeuix/themes/types/card';

 export default {
    body: {
        gap: "0.5rem",
        padding: "1.25rem"
    },
    root: {
        color: "{content.color}",
        shadow: "0 0.071429rem 0.142857rem -0.071429rem #0000001a, 0 0.071429rem 0.214286rem 0 #0000001a",
        background: "{content.background}",
        borderRadius: "{border.radius.xl}"
    },
    title: {
        fontSize: "1.25rem",
        fontWeight: "500"
    },
    caption: {
        gap: "0.5rem"
    },
    subtitle: {
        color: "{text.muted.color}"
    }
} satisfies CardDesignTokens;