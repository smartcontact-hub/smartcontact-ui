import type { PopoverDesignTokens } from '@primeuix/themes/types/popover';

 export default {
    root: {
        color: "{overlay.popover.color}",
        gutter: "0.714286rem",
        shadow: "var(--sc-cmp-popover-shadow)",
        background: "{overlay.popover.background}",
        arrowOffset: "var(--sc-cmp-popover-arrow-offset)",
        borderColor: "{overlay.popover.border.color}",
        borderRadius: "{overlay.popover.border.radius}"
    },
    content: {
        padding: "{overlay.popover.padding}"
    }
} satisfies PopoverDesignTokens;