import type { TimelineDesignTokens } from '@primeuix/themes/types/timeline';

 export default {
    event: {
        minHeight: "5rem"
    },
    horizontal: {
        eventContent: {
            padding: "1rem 0"
        }
    },
    vertical: {
        eventContent: {
            padding: "0 1rem"
        }
    },
    eventMarker: {
        size: "1.125rem",
        borderRadius: "7.875px",
        borderWidth: "2px",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        content: {
            borderRadius: "2.625px",
            size: "0.375rem",
            background: "{primary.color}",
            insetShadow: "0 1px 1px 0 #0000001f, 0 1px 0 0 #0000000f"
        }
    },
    eventConnector: {
        color: "{content.border.color}",
        size: "2px"
    }
} satisfies TimelineDesignTokens;