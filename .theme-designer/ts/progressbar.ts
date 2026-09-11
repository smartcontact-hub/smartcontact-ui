import type { ProgressBarDesignTokens } from '@primeuix/themes/types/progressbar';

 export default {
    root: {
        background: "{content.border.color}",
        borderRadius: "{content.border.radius}",
        height: "1.25rem"
    },
    value: {
        background: "{primary.color}"
    },
    label: {
        color: "{primary.contrast.color}",
        fontSize: "{primitive.typography.font.size.100}",
        fontWeight: "{primitive.typography.font.weight.semibold}"
    }
} satisfies ProgressBarDesignTokens;