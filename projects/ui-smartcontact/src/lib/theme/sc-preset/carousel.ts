import type { CarouselDesignTokens } from '@primeuix/themes/types/carousel';

 export default {
    root: {
        transitionDuration: "{transition.duration}"
    },
    content: {
        gap: "var(--sc-cmp-carousel-content-gap)"
    },
    indicator: {
        width: "var(--sc-cmp-carousel-indicator-width)",
        height: "var(--sc-cmp-carousel-indicator-height)",
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
                background: "var(--sc-cmp-carousel-indicator-background)",
                hoverBackground: "var(--sc-cmp-carousel-indicator-hover-background)"
            }
        }
    },
    indicatorList: {
        gap: "var(--sc-cmp-carousel-indicator-list-gap)",
        padding: "var(--sc-cmp-carousel-indicator-list-padding)"
    }
} satisfies CarouselDesignTokens;