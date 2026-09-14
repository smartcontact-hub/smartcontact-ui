import type { TimelineDesignTokens } from '@primeuix/themes/types/timeline';

 export default {
    event: {
        minHeight: "var(--sc-cmp-timeline-event-min-height)"
    },
    vertical: {
        eventContent: {
            padding: "var(--sc-cmp-timeline-vertical-event-content-padding-y) var(--sc-cmp-timeline-vertical-event-content-padding-x)"
        }
    },
    horizontal: {
        eventContent: {
            padding: "var(--sc-cmp-timeline-horizontal-event-content-padding-y) var(--sc-cmp-timeline-horizontal-event-content-padding-x)"
        }
    },
    eventMarker: {
        size: "var(--sc-cmp-timeline-event-marker-size)",
        content: {
            size: "var(--sc-cmp-timeline-event-marker-content-size)",
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