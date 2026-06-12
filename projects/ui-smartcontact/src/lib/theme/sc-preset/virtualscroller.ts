import type { VirtualScrollerDesignTokens } from '@primeuix/themes/types/virtualscroller';

 export default {
    loader: {
        icon: {
            size: "var(--sc-scale-2)"
        },
        mask: {
            color: "{text.muted.color}",
            background: "{content.background}"
        }
    }
} satisfies VirtualScrollerDesignTokens;