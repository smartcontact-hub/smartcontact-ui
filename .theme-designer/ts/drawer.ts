import type { DrawerDesignTokens } from '@primeuix/themes/types/drawer';

 export default {
    root: {
        color: "{overlay.modal.color}",
        shadow: "0 8px 10px -6px #0000001a, 0 20px 25px -5px #0000001a",
        background: "{overlay.modal.background}",
        borderColor: "{overlay.modal.border.color}"
    },
    title: {
        fontSize: "{typography.font.size.450}",
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