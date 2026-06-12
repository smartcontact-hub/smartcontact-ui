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
        margin: "0 1rem",
        content: {
            padding: "0.5rem 0"
        },
        padding: "0"
    },
    horizontal: {
        margin: "1rem 0",
        content: {
            padding: "0 0.5rem"
        },
        padding: "0"
    }
} satisfies DividerDesignTokens;