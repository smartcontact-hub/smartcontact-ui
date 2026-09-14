import type { VirtualScrollerDesignTokens } from '@primeuix/themes/types/virtualscroller';

 export default {
    loader: {
        icon: {
            size: "var(--sc-cmp-virtualscroller-loader-icon-size)"
        },
        mask: {
            color: "{text.muted.color}",
            background: "{content.background}"
        }
    }
} satisfies VirtualScrollerDesignTokens;