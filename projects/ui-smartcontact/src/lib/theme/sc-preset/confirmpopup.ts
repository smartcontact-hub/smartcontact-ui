import type { ConfirmPopupDesignTokens } from '@primeuix/themes/types/confirmpopup';

 export default {
    icon: {
        size: "var(--sc-scale-1-5)",
        color: "{overlay.popover.color}"
    },
    root: {
        color: "{overlay.popover.color}",
        gutter: "0.714286rem",
        shadow: "0 0.142857rem 0.285714rem -0.142857rem #0000001a, 0 0.285714rem 0.428571rem -0.071429rem #0000001a",
        background: "{overlay.popover.background}",
        arrowOffset: "var(--sc-scale-1-25)",
        borderColor: "{overlay.popover.border.color}",
        borderRadius: "{overlay.popover.border.radius}"
    },
    footer: {
        gap: "var(--sc-scale-0-5)",
        padding: "0 {overlay.popover.padding} {overlay.popover.padding}"
    },
    content: {
        gap: "var(--sc-scale-1)",
        padding: "{overlay.popover.padding}"
    }
} satisfies ConfirmPopupDesignTokens;