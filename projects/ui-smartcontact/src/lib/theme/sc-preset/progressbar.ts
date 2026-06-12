import type { ProgressBarDesignTokens } from '@primeuix/themes/types/progressbar';

 export default {
    root: {
        height: "1.25rem",
        background: "{content.border.color}",
        borderRadius: "{content.border.radius}"
    },
    label: {
        color: "{primary.contrast.color}",
        fontSize: "0.75rem",
        fontWeight: "600"
    },
    value: {
        background: "{primary.color}"
    }
} satisfies ProgressBarDesignTokens;