import type { TimelineDesignTokens } from '@primeuix/themes/types/timeline';

 export default {
    event: {
        minHeight: "5rem"
    },
    vertical: {
        eventContent: {
            padding: "0 1rem"
        }
    },
    horizontal: {
        eventContent: {
            padding: "1rem 0"
        }
    },
    eventMarker: {
        size: "1.125rem",
        content: {
            size: "0.375rem",
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