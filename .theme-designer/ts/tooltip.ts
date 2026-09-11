import type { TooltipDesignTokens } from '@primeuix/themes/types/tooltip';

 export default {
    root: {
        background: "{surface.700}",
        color: "{surface.0}",
        maxWidth: "12.5rem",
        gutter: "0.25rem",
        shadow: "0 2px 4px -2px #0000001a, 0 4px 6px -1px #0000001a",
        padding: "0.5rem 0.75rem",
        borderRadius: "{overlay.popover.border.radius}"
    }
} satisfies TooltipDesignTokens;