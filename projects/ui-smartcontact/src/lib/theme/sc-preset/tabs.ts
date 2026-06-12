import type { TabsDesignTokens } from '@primeuix/themes/types/tabs';

 export default {
    tab: {
        gap: "var(--sc-scale-0-5)",
        color: "{text.muted.color}",
        margin: "0 0 -0.071429rem 0",
        padding: "var(--sc-scale-1) var(--sc-scale-1-125)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "-0.071429rem",
            shadow: "none"
        },
        background: "#00000000",
        fontWeight: "600",
        hoverColor: "{text.color}",
        activeColor: "{primary.color}",
        borderColor: "{content.border.color}",
        borderWidth: "0.071429rem",
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
        borderWidth: "0.071429rem"
    },
    tabpanel: {
        color: "{content.color}",
        padding: "var(--sc-scale-0-875) var(--sc-scale-1-125) var(--sc-scale-1-125)",
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
        bottom: "-0.071429rem",
        height: "0.071429rem",
        background: "{primary.color}"
    },
    navButton: {
        color: "{text.muted.color}",
        width: "var(--sc-scale-2-5)",
        shadow: "0 0 0.714286rem 3.571429rem #ffffff99",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "-0.071429rem",
            shadow: "none"
        },
        background: "{content.background}",
        hoverColor: "{text.color}"
    }
} satisfies TabsDesignTokens;