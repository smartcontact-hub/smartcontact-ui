import type { ChipDesignTokens } from '@primeuix/themes/types/chip';

 export default {
    root: {
        background: "light-dark({surface.100}, {surface.800})",
        color: "light-dark({surface.800}, {surface.0})",
        borderRadius: "16px",
        paddingX: "0.75rem",
        paddingY: "0.5rem",
        gap: "0.5rem",
        transitionDuration: "{transition.duration}"
    },
    image: {
        width: "2rem",
        height: "2rem"
    },
    icon: {
        color: "light-dark({surface.800}, {surface.0})",
        size: "1rem"
    },
    removeIcon: {
        color: "light-dark({surface.800}, {surface.0})",
        size: "1rem",
        focusRing: {
            width: "{focus.ring.width}",
            style: "{focus.ring.style}",
            color: "{focus.ring.color}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        }
    }
} satisfies ChipDesignTokens;