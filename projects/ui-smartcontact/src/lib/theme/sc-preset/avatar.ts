import type { AvatarDesignTokens } from '@primeuix/themes/types/avatar';

 export default {
    lg: {
        icon: {
            size: "var(--sc-scale-1-5)"
        },
        group: {
            offset: "var(--sc-scale-neg-1)"
        },
        width: "var(--sc-scale-3)",
        height: "var(--sc-scale-3)",
        fontSize: "var(--sc-scale-1-5)"
    },
    xl: {
        icon: {
            size: "var(--sc-scale-2)"
        },
        group: {
            offset: "var(--sc-scale-neg-1-5)"
        },
        width: "var(--sc-scale-4)",
        height: "var(--sc-scale-4)",
        fontSize: "var(--sc-scale-2)"
    },
    icon: {
        size: "var(--sc-scale-1)"
    },
    root: {
        color: "{content.color}",
        width: "var(--sc-scale-2)",
        height: "var(--sc-scale-2)",
        fontSize: "var(--sc-scale-1)",
        background: "{content.border.color}",
        borderRadius: "{content.border.radius}"
    },
    group: {
        offset: "var(--sc-scale-neg-0-75)",
        borderColor: "{content.background}"
    }
} satisfies AvatarDesignTokens;