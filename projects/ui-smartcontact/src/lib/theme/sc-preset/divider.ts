import type { DividerDesignTokens } from '@primeuix/themes/types/divider';

 export default {
    root: {
        borderColor: "{content.border.color}"
    },
    content: {
        color: "{text.color}",
        background: "{content.background}"
    },
    vertical: {
        margin: "0 var(--sc-scale-1)",
        content: {
            padding: "var(--sc-scale-0-5) 0"
        },
        padding: "0"
    },
    horizontal: {
        margin: "var(--sc-scale-1) 0",
        content: {
            padding: "0 var(--sc-scale-0-5)"
        },
        padding: "0"
    }
} satisfies DividerDesignTokens;