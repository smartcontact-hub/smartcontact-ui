import type { DockDesignTokens } from '@primeuix/themes/types/dock';

 export default {
    item: {
        size: "var(--sc-scale-3)",
        padding: "var(--sc-scale-0-5)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        borderRadius: "{content.border.radius}"
    },
    root: {
        padding: "var(--sc-scale-0-5)",
        background: "#ffffff1a",
        borderColor: "#ffffff33",
        borderRadius: "{border.radius.xl}"
    }
} satisfies DockDesignTokens;