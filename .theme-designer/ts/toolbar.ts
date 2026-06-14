import type { ToolbarDesignTokens } from '@primeuix/themes/types/toolbar';

 export default {
    root: {
        gap: "0.5rem",
        color: "{content.color}",
        padding: "0.75rem",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}"
    }
} satisfies ToolbarDesignTokens;