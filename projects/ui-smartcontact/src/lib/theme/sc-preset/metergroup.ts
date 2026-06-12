import type { MeterGroupDesignTokens } from '@primeuix/themes/types/metergroup';

 export default {
    root: {
        gap: "var(--sc-scale-1)",
        borderRadius: "{content.border.radius}"
    },
    label: {
        gap: "var(--sc-scale-0-5)"
    },
    meters: {
        size: "var(--sc-scale-0-5)",
        background: "{content.border.color}"
    },
    labelIcon: {
        size: "var(--sc-scale-1)"
    },
    labelList: {
        verticalGap: "var(--sc-scale-0-5)",
        horizontalGap: "var(--sc-scale-1)"
    },
    labelMarker: {
        size: "var(--sc-scale-0-5)"
    }
} satisfies MeterGroupDesignTokens;