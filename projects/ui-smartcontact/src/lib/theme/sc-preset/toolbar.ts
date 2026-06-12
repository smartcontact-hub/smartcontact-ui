import type { ToolbarDesignTokens } from '@primeuix/themes/types/toolbar';

 export default {
    root: {
        gap: "var(--sc-scale-0-5)",
        color: "{content.color}",
        padding: "var(--sc-scale-0-75)",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}"
    }
} satisfies ToolbarDesignTokens;