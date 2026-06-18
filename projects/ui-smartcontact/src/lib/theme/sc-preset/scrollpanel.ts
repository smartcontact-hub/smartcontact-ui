import type { ScrollPanelDesignTokens } from '@primeuix/themes/types/scrollpanel';

 export default {
    bar: {
        size: "0.642857rem",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        borderRadius: "{border.radius.sm}"
    },
    root: {
        transitionDuration: "{transition.duration}"
    },
    colorScheme: {
        dark: {
            bar: {
                background: "{surface.800}"
            }
        },
        light: {
            bar: {
                background: "var(--sc-cmp-scrollpanel-bar-background)"
            }
        }
    }
} satisfies ScrollPanelDesignTokens;