import type { MeterGroupDesignTokens } from '@primeuix/themes/types/metergroup';

 export default {
    root: {
        gap: "1rem",
        borderRadius: "{content.border.radius}"
    },
    label: {
        gap: "0.5rem"
    },
    meters: {
        size: "0.5rem",
        background: "{content.border.color}"
    },
    labelIcon: {
        size: "1rem"
    },
    labelList: {
        verticalGap: "0.5rem",
        horizontalGap: "1rem"
    },
    labelMarker: {
        size: "0.5rem"
    }
} satisfies MeterGroupDesignTokens;