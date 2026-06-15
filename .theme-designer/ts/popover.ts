import type { PopoverDesignTokens } from '@primeuix/themes/types/popover';

 export default {
    root: {
        color: "{overlay.popover.color}",
        gutter: "10px",
        shadow: "0 2px 4px -2px #0000001a, 0 4px 6px -1px #0000001a",
        background: "{overlay.popover.background}",
        arrowOffset: "1.25rem",
        borderColor: "{overlay.popover.border.color}",
        borderRadius: "{overlay.popover.border.radius}"
    },
    content: {
        padding: "{overlay.popover.padding}"
    }
} satisfies PopoverDesignTokens;