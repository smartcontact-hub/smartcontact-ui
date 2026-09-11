import type { ToastDesignTokens } from '@primeuix/themes/types/toast';

 export default {
    root: {
        width: "25rem",
        borderRadius: "{content.border.radius}",
        borderWidth: "1px",
        transitionDuration: "{transition.duration}",
        blur: "light-dark(1.5px, 10px)",
        focusRing: {
            style: "solid"
        }
    },
    icon: {
        size: "1.125rem"
    },
    content: {
        padding: "{overlay.popover.padding}",
        gap: "0.5rem"
    },
    text: {
        gap: "0.5rem"
    },
    summary: {
        fontWeight: "{primitive.typography.font.weight.medium}",
        fontSize: "{primitive.typography.font.size.200}"
    },
    detail: {
        fontWeight: "{primitive.typography.font.weight.medium}",
        fontSize: "{primitive.typography.font.size.100}"
    },
    closeButton: {
        width: "1.75rem",
        height: "1.75rem",
        borderRadius: "0.875rem",
        focusRing: {
            width: "{focus.ring.width}",
            style: "{focus.ring.style}",
            offset: "{focus.ring.offset}"
        }
    },
    closeIcon: {
        size: "1rem"
    },
    info: {
        background: "light-dark(#eef4fff2, #eef4ff29)",
        borderColor: "light-dark({sky.200}, #0369a15c)",
        color: "light-dark({sky.600}, {sky.300})",
        detailColor: "light-dark({surface.700}, {surface.0})",
        shadow: "0 4px 8px 0 #02050a0a",
        closeButton: {
            hoverBackground: "light-dark({sky.100}, #ffffff0d)",
            focusRing: {
                color: "light-dark({sky.600}, {sky.500})",
                shadow: "none"
            }
        }
    },
    success: {
        background: "light-dark(#f0fdf4f2, #22c55e29)",
        borderColor: "light-dark({green.200}, #15803d5c)",
        color: "light-dark({green.600}, {green.500})",
        detailColor: "light-dark({surface.700}, {surface.0})",
        shadow: "0 4px 8px 0 #0108040a",
        closeButton: {
            hoverBackground: "light-dark({green.100}, #ffffff0d)",
            focusRing: {
                color: "light-dark({green.600}, {green.500})",
                shadow: "none"
            }
        }
    },
    warn: {
        background: "light-dark(#fefce8f2, #eab30829)",
        borderColor: "light-dark({yellow.200}, #a162075c)",
        color: "light-dark({yellow.700}, {yellow.300})",
        detailColor: "light-dark({surface.700}, {surface.0})",
        shadow: "0 4px 8px 0 #0907000a",
        closeButton: {
            hoverBackground: "light-dark({yellow.100}, #ffffff0d)",
            focusRing: {
                color: "light-dark({yellow.700}, {yellow.300})",
                shadow: "none"
            }
        }
    },
    error: {
        background: "light-dark(#fef2f2f2, #ef444429)",
        borderColor: "light-dark({red.200}, #b91c1c5c)",
        color: "light-dark({red.600}, {red.500})",
        detailColor: "light-dark({surface.700}, {surface.0})",
        shadow: "0 4px 8px 0 #0a03030a",
        closeButton: {
            hoverBackground: "light-dark({red.100}, #ffffff0d)",
            focusRing: {
                color: "light-dark({red.600}, {red.500})",
                shadow: "none"
            }
        }
    },
    secondary: {
        background: "light-dark({surface.100}, {surface.800})",
        borderColor: "light-dark({surface.200}, {surface.700})",
        color: "light-dark({surface.600}, {surface.300})",
        detailColor: "light-dark({surface.700}, {surface.0})",
        shadow: "0 4px 8px 0 #0405060a",
        closeButton: {
            hoverBackground: "light-dark({surface.200}, {surface.700})",
            focusRing: {
                color: "light-dark({surface.600}, {surface.300})",
                shadow: "none"
            }
        }
    },
    contrast: {
        background: "light-dark({surface.900}, {surface.0})",
        borderColor: "light-dark({surface.950}, {surface.100})",
        color: "light-dark({surface.50}, {surface.950})",
        detailColor: "light-dark({surface.0}, {surface.950})",
        shadow: "0 4px 8px 0 #0000010a",
        closeButton: {
            hoverBackground: "light-dark({surface.800}, {surface.100})",
            focusRing: {
                color: "light-dark({surface.50}, {surface.950})",
                shadow: "none"
            }
        }
    }
} satisfies ToastDesignTokens;