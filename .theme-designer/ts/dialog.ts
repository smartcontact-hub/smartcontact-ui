import type { DialogDesignTokens } from '@primeuix/themes/types/dialog';

 export default {
    root: {
        background: "{overlay.modal.background}",
        borderColor: "{overlay.modal.border.color}",
        color: "{overlay.modal.color}",
        borderRadius: "{overlay.modal.border.radius}",
        shadow: "0 8px 10px -6px #0000001a, 0 20px 25px -5px #0000001a"
    },
    header: {
        padding: "{overlay.modal.padding}",
        gap: "0.5rem"
    },
    title: {
        fontSize: "{primitive.typography.font.size.400}",
        fontWeight: "{primitive.typography.font.weight.semibold}"
    },
    content: {
        padding: "0 {overlay.modal.padding} {overlay.modal.padding}"
    },
    footer: {
        padding: "0 {overlay.modal.padding} {overlay.modal.padding}",
        gap: "0.5rem"
    }
} satisfies DialogDesignTokens;