import type { DockDesignTokens } from '@primeuix/themes/types/dock';

 export default {
    item: {
        size: "var(--sc-cmp-dock-item-size)",
        padding: "var(--sc-cmp-dock-item-padding)",
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
        padding: "var(--sc-cmp-dock-padding)",
        background: "#ffffff1a",
        borderColor: "#ffffff33",
        borderRadius: "{border.radius.xl}"
    }
} satisfies DockDesignTokens;