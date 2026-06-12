import type { TimelineDesignTokens } from '@primeuix/themes/types/timeline';

 export default {
    event: {
        minHeight: "var(--sc-scale-5)"
    },
    vertical: {
        eventContent: {
            padding: "0 var(--sc-scale-1)"
        }
    },
    horizontal: {
        eventContent: {
            padding: "var(--sc-scale-1) 0"
        }
    },
    eventMarker: {
        size: "var(--sc-scale-1-125)",
        content: {
            size: "var(--sc-scale-0-375)",
            background: "{primary.color}",
            insetShadow: "0 0.071429rem 0.071429rem 0 #0000001f, 0 0.071429rem 0 0 #0000000f",
            borderRadius: "0.1875rem"
        },
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderWidth: "0.142857rem",
        borderRadius: "0.5625rem"
    },
    eventConnector: {
        size: "0.142857rem",
        color: "{content.border.color}"
    }
} satisfies TimelineDesignTokens;