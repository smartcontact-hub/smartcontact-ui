import type { ToolbarDesignTokens } from '@primeuix/themes/types/toolbar';

 export default {
    root: {
        gap: "var(--sc-cmp-toolbar-gap)",
        color: "{content.color}",
        padding: "var(--sc-cmp-toolbar-padding)",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}"
    }
} satisfies ToolbarDesignTokens;