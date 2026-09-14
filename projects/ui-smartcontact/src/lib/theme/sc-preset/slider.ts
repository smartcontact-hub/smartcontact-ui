import type { SliderDesignTokens } from '@primeuix/themes/types/slider';

 export default {
    root: {
        transitionDuration: "{transition.duration}"
    },
    range: {
        background: "{primary.color}"
    },
    track: {
        size: "0.214286rem",
        background: "{content.border.color}",
        borderRadius: "{content.border.radius}"
    },
    handle: {
        width: "1.428571rem",
        height: "1.428571rem",
        content: {
            width: "var(--sc-cmp-slider-handle-content-width)",
            height: "var(--sc-cmp-slider-handle-content-height)",
            shadow: "var(--sc-cmp-slider-handle-content-shadow)",
            borderRadius: "0.571429rem",
            hoverBackground: "{content.background}"
        },
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        background: "{content.border.color}",
        borderRadius: "0.714286rem",
        hoverBackground: "{content.border.color}"
    },
    colorScheme: {
        dark: {
            handle: {
                content: {
                    background: "{surface.950}"
                }
            }
        },
        light: {
            handle: {
                content: {
                    background: "var(--sc-cmp-slider-handle-content-background)"
                }
            }
        }
    }
} satisfies SliderDesignTokens;