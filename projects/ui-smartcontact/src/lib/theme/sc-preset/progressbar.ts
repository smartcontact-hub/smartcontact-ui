import type { ProgressBarDesignTokens } from '@primeuix/themes/types/progressbar';

 export default {
    root: {
        height: "var(--sc-scale-1-25)",
        background: "{content.border.color}",
        borderRadius: "{content.border.radius}"
    },
    label: {
        color: "{primary.contrast.color}",
        fontSize: "var(--sc-scale-0-75)",
        fontWeight: "600"
    },
    value: {
        background: "{primary.color}"
    }
} satisfies ProgressBarDesignTokens;