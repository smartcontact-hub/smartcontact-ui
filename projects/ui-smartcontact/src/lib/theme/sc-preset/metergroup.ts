import type { MeterGroupDesignTokens } from '@primeuix/themes/types/metergroup';

 export default {
    root: {
        gap: "var(--sc-cmp-metergroup-gap)",
        borderRadius: "{content.border.radius}"
    },
    label: {
        gap: "var(--sc-cmp-metergroup-label-gap)"
    },
    meters: {
        size: "var(--sc-cmp-metergroup-meters-size)",
        background: "{content.border.color}"
    },
    labelIcon: {
        size: "var(--sc-cmp-metergroup-label-icon-size)"
    },
    labelList: {
        verticalGap: "var(--sc-cmp-metergroup-label-list-vertical-gap)",
        horizontalGap: "var(--sc-cmp-metergroup-label-list-horizontal-gap)"
    },
    labelMarker: {
        size: "var(--sc-cmp-metergroup-label-marker-size)"
    }
} satisfies MeterGroupDesignTokens;