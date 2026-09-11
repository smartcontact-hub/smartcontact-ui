import type { DockDesignTokens } from '@primeuix/themes/types/dock';

 export default {
    root: {
        background: "#ffffff1a",
        borderColor: "#ffffff33",
        padding: "0.5rem",
        borderRadius: "{border.radius.xl}"
    },
    item: {
        borderRadius: "{content.border.radius}",
        padding: "0.5rem",
        size: "3rem",
        focusRing: {
            width: "{focus.ring.width}",
            style: "{focus.ring.style}",
            color: "{focus.ring.color}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        }
    }
} satisfies DockDesignTokens;