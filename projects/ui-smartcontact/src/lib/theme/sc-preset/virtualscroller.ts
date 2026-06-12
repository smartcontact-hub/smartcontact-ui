import type { VirtualScrollerDesignTokens } from '@primeuix/themes/types/virtualscroller';

 export default {
    loader: {
        icon: {
            size: "2rem"
        },
        mask: {
            color: "{text.muted.color}",
            background: "{content.background}"
        }
    }
} satisfies VirtualScrollerDesignTokens;