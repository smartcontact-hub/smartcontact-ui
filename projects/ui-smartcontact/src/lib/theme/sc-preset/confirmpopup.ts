import type { ConfirmPopupDesignTokens } from '@primeuix/themes/types/confirmpopup';

 export default {
    icon: {
        size: "1.5rem",
        color: "{overlay.popover.color}"
    },
    root: {
        color: "{overlay.popover.color}",
        gutter: "0.714286rem",
        shadow: "0 0.142857rem 0.285714rem -0.142857rem #0000001a, 0 0.285714rem 0.428571rem -0.071429rem #0000001a",
        background: "{overlay.popover.background}",
        arrowOffset: "1.25rem",
        borderColor: "{overlay.popover.border.color}",
        borderRadius: "{overlay.popover.border.radius}"
    },
    footer: {
        gap: "0.5rem",
        padding: "0 {overlay.popover.padding} {overlay.popover.padding}"
    },
    content: {
        gap: "1rem",
        padding: "{overlay.popover.padding}"
    }
} satisfies ConfirmPopupDesignTokens;