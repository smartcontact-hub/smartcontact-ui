import type { DrawerDesignTokens } from '@primeuix/themes/types/drawer';

 export default {
    root: {
        color: "{overlay.modal.color}",
        shadow: "0 0.571429rem 0.714286rem -0.428571rem #0000001a, 0 1.428571rem 1.785714rem -0.357143rem #0000001a",
        background: "{overlay.modal.background}",
        borderColor: "{overlay.modal.border.color}"
    },
    title: {
        fontSize: "1.5rem",
        fontWeight: "600"
    },
    footer: {
        padding: "{overlay.modal.padding}"
    },
    header: {
        padding: "{overlay.modal.padding}"
    },
    content: {
        padding: "0 {overlay.modal.padding} {overlay.modal.padding}"
    }
} satisfies DrawerDesignTokens;