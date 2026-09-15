import type { ChipDesignTokens } from '@primeuix/themes/types/chip';

 export default {
    icon: {
        size: "var(--sc-cmp-chip-icon-size)"
    },
    root: {
        gap: "var(--sc-cmp-chip-gap)",
        paddingX: "var(--sc-cmp-chip-padding-x)",
        paddingY: "var(--sc-cmp-chip-padding-y)",
        borderRadius: "var(--sc-cmp-chip-border-radius)",
        transitionDuration: "{transition.duration}"
    },
    image: {
        width: "var(--sc-cmp-chip-image-width)",
        height: "var(--sc-cmp-chip-image-height)"
    },
    removeIcon: {
        size: "var(--sc-cmp-chip-remove-icon-size)",
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
                color: "var(--sc-cmp-chip-color)",
                background: "var(--sc-cmp-chip-background)"
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
                color: "var(--sc-cmp-chip-color)",
                background: "var(--sc-cmp-chip-background)"
            },
            removeIcon: {
                color: "var(--sc-cmp-chip-remove-icon-color)"
            }
        }
    }
} satisfies ChipDesignTokens;