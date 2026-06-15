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
        margin: "var(--sc-cmp-divider-vertical-margin-y) var(--sc-cmp-divider-vertical-margin-x)",
        content: {
            padding: "var(--sc-cmp-divider-vertical-content-padding-y) var(--sc-cmp-divider-vertical-content-padding-x)"
        },
        padding: "0"
    },
    horizontal: {
        margin: "var(--sc-cmp-divider-horizontal-margin-y) var(--sc-cmp-divider-horizontal-margin-x)",
        content: {
            padding: "var(--sc-cmp-divider-horizontal-content-padding-y) var(--sc-cmp-divider-horizontal-content-padding-x)"
        },
        padding: "0"
    }
} satisfies DividerDesignTokens;