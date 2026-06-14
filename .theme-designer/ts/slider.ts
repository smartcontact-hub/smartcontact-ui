import type { SliderDesignTokens } from '@primeuix/themes/types/slider';

 export default {
    root: {
        transitionDuration: "{transition.duration}"
    },
    range: {
        background: "{primary.color}"
    },
    track: {
        size: "3px",
        background: "{content.border.color}",
        borderRadius: "{content.border.radius}"
    },
    handle: {
        width: "20px",
        height: "20px",
        content: {
            width: "16px",
            height: "16px",
            shadow: "0 1px 1px 0 #00000024, 0 1px 0 0 #00000014",
            borderRadius: "8px",
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
        borderRadius: "10px",
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
                    background: "{surface.0}"
                }
            }
        }
    }
} satisfies SliderDesignTokens;