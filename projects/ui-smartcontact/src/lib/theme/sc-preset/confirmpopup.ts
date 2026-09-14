import type { ConfirmPopupDesignTokens } from '@primeuix/themes/types/confirmpopup';

 export default {
    icon: {
        size: "var(--sc-cmp-confirmpopup-icon-size)",
        color: "{overlay.popover.color}"
    },
    root: {
        color: "{overlay.popover.color}",
        gutter: "0.714286rem",
        shadow: "var(--sc-cmp-confirmpopup-shadow)",
        background: "{overlay.popover.background}",
        arrowOffset: "var(--sc-cmp-confirmpopup-arrow-offset)",
        borderColor: "{overlay.popover.border.color}",
        borderRadius: "{overlay.popover.border.radius}"
    },
    footer: {
        gap: "var(--sc-cmp-confirmpopup-footer-gap)",
        padding: "0 {overlay.popover.padding} {overlay.popover.padding}"
    },
    content: {
        gap: "var(--sc-cmp-confirmpopup-content-gap)",
        padding: "{overlay.popover.padding}"
    }
} satisfies ConfirmPopupDesignTokens;