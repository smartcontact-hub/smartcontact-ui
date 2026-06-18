import type { ConfirmPopupDesignTokens } from '@primeuix/themes/types/confirmpopup';

 export default {
    icon: {
        size: "var(--sc-scale-1-5)",
        color: "{overlay.popover.color}"
    },
    root: {
        color: "{overlay.popover.color}",
        gutter: "0.714286rem",
        shadow: "var(--sc-cmp-confirmpopup-shadow)",
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