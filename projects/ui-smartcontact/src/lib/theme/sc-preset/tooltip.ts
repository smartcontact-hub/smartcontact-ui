import type { TooltipDesignTokens } from '@primeuix/themes/types/tooltip';

 export default {
    root: {
        gutter: "var(--sc-scale-0-25)",
        shadow: "0 0.142857rem 0.285714rem -0.142857rem #0000001a, 0 0.285714rem 0.428571rem -0.071429rem #0000001a",
        padding: "var(--sc-scale-0-5) var(--sc-scale-0-75)",
        maxWidth: "var(--sc-scale-12-5)",
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