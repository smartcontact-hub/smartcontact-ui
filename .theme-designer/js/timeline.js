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
            insetShadow: "0 1px 1px 0 #0000001f, 0 1px 0 0 #0000000f",
            borderRadius: "2.625px"
        },
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderWidth: "2px",
        borderRadius: "7.875px"
    },
    eventConnector: {
        size: "2px",
        color: "{content.border.color}"
    }
}