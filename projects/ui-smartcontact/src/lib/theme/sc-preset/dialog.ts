import type { DialogDesignTokens } from '@primeuix/themes/types/dialog';

 export default {
    root: {
        color: "{overlay.modal.color}",
        shadow: "0 0.571429rem 0.714286rem -0.428571rem #0000001a, 0 1.428571rem 1.785714rem -0.357143rem #0000001a",
        background: "{overlay.modal.background}",
        borderColor: "{overlay.modal.border.color}",
        borderRadius: "{overlay.modal.border.radius}"
    },
    title: {
        fontSize: "var(--sc-font-size-400)",
        fontWeight: "600"
    },
    footer: {
        gap: "var(--sc-scale-0-5)",
        padding: "0 {overlay.modal.padding} {overlay.modal.padding}"
    },
    header: {
        gap: "var(--sc-scale-0-5)",
        padding: "{overlay.modal.padding}"
    },
    content: {
        padding: "0 {overlay.modal.padding} {overlay.modal.padding}"
    }
} satisfies DialogDesignTokens;