import type { TooltipDesignTokens } from '@primeuix/themes/types/tooltip';

 export default {
    root: {
        gutter: "var(--sc-cmp-tooltip-gutter)",
        shadow: "var(--sc-cmp-tooltip-shadow)",
        padding: "var(--sc-cmp-tooltip-padding-y) var(--sc-cmp-tooltip-padding-x)",
        maxWidth: "var(--sc-cmp-tooltip-max-width)",
        borderRadius: "{overlay.popover.border.radius}"
    },
    colorScheme: {
        dark: {
            root: {
                color: "{surface.0}",
                background: "{surface.700}"
            }
        },
        light: {
            root: {
                color: "{surface.0}",
                background: "{surface.700}"
            }
        }
    }
} satisfies TooltipDesignTokens;