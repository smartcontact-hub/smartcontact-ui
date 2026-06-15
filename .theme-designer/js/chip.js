export default {
    icon: {
        size: "1rem"
    },
    root: {
        gap: "0.5rem",
        paddingX: "0.75rem",
        paddingY: "0.5rem",
        borderRadius: "16px",
        transitionDuration: "{transition.duration}"
    },
    image: {
        width: "2rem",
        height: "2rem"
    },
    removeIcon: {
        size: "1rem",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        }
    },
    colorScheme: {
        dark: {
            icon: {
                color: "{surface.0}"
            },
            root: {
                color: "{surface.0}",
                background: "{surface.800}"
            },
            removeIcon: {
                color: "{surface.0}"
            }
        },
        light: {
            icon: {
                color: "{surface.800}"
            },
            root: {
                color: "{surface.800}",
                background: "{surface.100}"
            },
            removeIcon: {
                color: "{surface.800}"
            }
        }
    }
}