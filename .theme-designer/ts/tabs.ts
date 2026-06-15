import type { TabsDesignTokens } from '@primeuix/themes/types/tabs';

 export default {
    tab: {
        gap: "0.5rem",
        color: "{text.muted.color}",
        margin: "0 0 -1px 0",
        padding: "1rem 1.125rem",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "-1px",
            shadow: "none"
        },
        background: "#00000000",
        fontWeight: "600",
        hoverColor: "{text.color}",
        activeColor: "{primary.color}",
        borderColor: "{content.border.color}",
        borderWidth: "1px",
        hoverBackground: "#00000000",
        activeBackground: "#00000000",
        hoverBorderColor: "{content.border.color}",
        activeBorderColor: "{primary.color}"
    },
    root: {
        transitionDuration: "{transition.duration}"
    },
    tablist: {
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderWidth: "1px"
    },
    tabpanel: {
        color: "{content.color}",
        padding: "0.875rem 1.125rem 1.125rem",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        background: "{content.background}"
    },
    activeBar: {
        bottom: "-1px",
        height: "1px",
        background: "{primary.color}"
    },
    navButton: {
        color: "{text.muted.color}",
        width: "2.5rem",
        shadow: "0 0 10px 50px #ffffff99",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "-1px",
            shadow: "none"
        },
        background: "{content.background}",
        hoverColor: "{text.color}"
    }
} satisfies TabsDesignTokens;