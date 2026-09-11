import type { CarouselDesignTokens } from '@primeuix/themes/types/carousel';

 export default {
    root: {
        transitionDuration: "{transition.duration}"
    },
    content: {
        gap: "0.25rem"
    },
    indicatorList: {
        padding: "1rem",
        gap: "0.5rem"
    },
    indicator: {
        background: "light-dark({surface.200}, {surface.700})",
        hoverBackground: "light-dark({surface.300}, {surface.600})",
        activeBackground: "{primary.color}",
        width: "2rem",
        height: "0.5rem",
        borderRadius: "{content.border.radius}",
        focusRing: {
            width: "{focus.ring.width}",
            style: "{focus.ring.style}",
            color: "{focus.ring.color}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        }
    }
} satisfies CarouselDesignTokens;