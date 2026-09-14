import type { ConfirmDialogDesignTokens } from '@primeuix/themes/types/confirmdialog';

 export default {
    icon: {
        size: "var(--sc-cmp-confirmdialog-icon-size)",
        color: "{overlay.modal.color}"
    },
    content: {
        gap: "var(--sc-cmp-confirmdialog-content-gap)"
    }
} satisfies ConfirmDialogDesignTokens;