import type { DockDesignTokens } from '@primeuix/themes/types/dock';

 export default {
    item: {
        size: "3rem",
        padding: "0.5rem",
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
        padding: "0.5rem",
        background: "#ffffff1a",
        borderColor: "#ffffff33",
        borderRadius: "{border.radius.xl}"
    }
} satisfies DockDesignTokens;