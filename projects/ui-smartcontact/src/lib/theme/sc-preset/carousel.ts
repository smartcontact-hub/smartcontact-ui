import type { CarouselDesignTokens } from '@primeuix/themes/types/carousel';

 export default {
    root: {
        transitionDuration: "{transition.duration}"
    },
    content: {
        gap: "var(--sc-scale-0-25)"
    },
    indicator: {
        width: "var(--sc-scale-2)",
        height: "var(--sc-scale-0-5)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        borderRadius: "{content.border.radius}",
        activeBackground: "{primary.color}"
    },
    colorScheme: {
        dark: {
            indicator: {
                background: "{surface.700}",
                hoverBackground: "{surface.600}"
            }
        },
        light: {
            indicator: {
                background: "{surface.200}",
                hoverBackground: "{surface.300}"
            }
        }
    },
    indicatorList: {
        gap: "var(--sc-scale-0-5)",
        padding: "var(--sc-scale-1)"
    }
} satisfies CarouselDesignTokens;