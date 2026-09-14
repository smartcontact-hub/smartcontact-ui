import type { DialogDesignTokens } from '@primeuix/themes/types/dialog';

 export default {
    root: {
        color: "{overlay.modal.color}",
        shadow: "var(--sc-cmp-dialog-shadow)",
        background: "{overlay.modal.background}",
        borderColor: "{overlay.modal.border.color}",
        borderRadius: "{overlay.modal.border.radius}"
    },
    title: {
        fontSize: "var(--sc-font-size-400)",
        fontWeight: "600"
    },
    footer: {
        gap: "var(--sc-cmp-dialog-footer-gap)",
        padding: "0 {overlay.modal.padding} {overlay.modal.padding}"
    },
    header: {
        gap: "var(--sc-cmp-dialog-header-gap)",
        padding: "{overlay.modal.padding}"
    },
    content: {
        padding: "0 {overlay.modal.padding} {overlay.modal.padding}"
    }
} satisfies DialogDesignTokens;