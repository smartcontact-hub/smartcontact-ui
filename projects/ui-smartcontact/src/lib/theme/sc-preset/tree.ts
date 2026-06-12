import type { TreeDesignTokens } from '@primeuix/themes/types/tree';

 export default {
    node: {
        gap: "var(--sc-scale-0-25)",
        color: "{text.color}",
        padding: "var(--sc-scale-0-25) var(--sc-scale-0-5)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "-0.071429rem",
            shadow: "none"
        },
        hoverColor: "{text.hover.color}",
        borderRadius: "{content.border.radius}",
        selectedColor: "{highlight.color}",
        hoverBackground: "{content.hover.background}",
        selectedBackground: "{highlight.background}"
    },
    root: {
        gap: "0.142857rem",
        color: "{content.color}",
        indent: "var(--sc-scale-1)",
        padding: "var(--sc-scale-1)",
        background: "{content.background}",
        transitionDuration: "{transition.duration}"
    },
    filter: {
        margin: "var(--sc-scale-0-5)"
    },
    nodeIcon: {
        color: "{text.muted.color}",
        hoverColor: "{text.hover.muted.color}",
        selectedColor: "{highlight.color}"
    },
    loadingIcon: {
        size: "var(--sc-scale-2)"
    },
    nodeToggleButton: {
        size: "var(--sc-scale-1-75)",
        color: "{text.muted.color}",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        hoverColor: "{text.hover.muted.color}",
        borderRadius: "var(--sc-scale-0-875)",
        hoverBackground: "{content.hover.background}",
        selectedHoverColor: "{primary.color}",
        selectedHoverBackground: "{content.background}"
    }
} satisfies TreeDesignTokens;