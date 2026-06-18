import type { ChipDesignTokens } from '@primeuix/themes/types/chip';

 export default {
    icon: {
        size: "var(--sc-scale-1)"
    },
    root: {
        gap: "var(--sc-scale-0-5)",
        paddingX: "var(--sc-scale-0-75)",
        paddingY: "var(--sc-scale-0-5)",
        borderRadius: "var(--sc-scale-1-143)",
        transitionDuration: "{transition.duration}"
    },
    image: {
        width: "var(--sc-scale-2)",
        height: "var(--sc-scale-2)"
    },
    removeIcon: {
        size: "var(--sc-scale-1)",
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
                color: "var(--sc-cmp-chip-icon-color)"
            },
            root: {
                color: "{surface.0}",
                background: "{surface.800}"
            },
            removeIcon: {
                color: "var(--sc-cmp-chip-remove-icon-color)"
            }
        },
        light: {
            icon: {
                color: "var(--sc-cmp-chip-icon-color)"
            },
            root: {
                color: "{surface.800}",
                background: "{surface.100}"
            },
            removeIcon: {
                color: "var(--sc-cmp-chip-remove-icon-color)"
            }
        }
    }
} satisfies ChipDesignTokens;