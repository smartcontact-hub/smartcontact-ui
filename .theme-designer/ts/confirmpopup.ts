import type { ConfirmPopupDesignTokens } from '@primeuix/themes/types/confirmpopup';

 export default {
    root: {
        background: "{overlay.popover.background}",
        borderColor: "{overlay.popover.border.color}",
        color: "{overlay.popover.color}",
        borderRadius: "{overlay.popover.border.radius}",
        shadow: "0 2px 4px -2px #0000001a, 0 4px 6px -1px #0000001a",
        gutter: "10px",
        arrowOffset: "1.25rem"
    },
    content: {
        padding: "{overlay.popover.padding}",
        gap: "1rem"
    },
    icon: {
        size: "1.5rem",
        color: "{overlay.popover.color}"
    },
    footer: {
        gap: "0.5rem",
        padding: "0 {overlay.popover.padding} {overlay.popover.padding}"
    }
} satisfies ConfirmPopupDesignTokens;