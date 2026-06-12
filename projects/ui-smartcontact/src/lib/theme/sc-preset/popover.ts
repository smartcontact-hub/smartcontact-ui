import type { PopoverDesignTokens } from '@primeuix/themes/types/popover';

 export default {
    root: {
        color: "{overlay.popover.color}",
        gutter: "0.714286rem",
        shadow: "0 0.142857rem 0.285714rem -0.142857rem #0000001a, 0 0.285714rem 0.428571rem -0.071429rem #0000001a",
        background: "{overlay.popover.background}",
        arrowOffset: "1.25rem",
        borderColor: "{overlay.popover.border.color}",
        borderRadius: "{overlay.popover.border.radius}"
    },
    content: {
        padding: "{overlay.popover.padding}"
    }
} satisfies PopoverDesignTokens;