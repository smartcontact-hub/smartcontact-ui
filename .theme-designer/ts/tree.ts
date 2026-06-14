import type { TreeDesignTokens } from '@primeuix/themes/types/tree';

 export default {
    node: {
        gap: "0.25rem",
        color: "{text.color}",
        padding: "0.25rem 0.5rem",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "-1px",
            shadow: "none"
        },
        hoverColor: "{text.hover.color}",
        borderRadius: "{content.border.radius}",
        selectedColor: "{highlight.color}",
        hoverBackground: "{content.hover.background}",
        selectedBackground: "{highlight.background}"
    },
    root: {
        gap: "2px",
        color: "{content.color}",
        indent: "1rem",
        padding: "1rem",
        background: "{content.background}",
        transitionDuration: "{transition.duration}"
    },
    filter: {
        margin: "0.5rem"
    },
    nodeIcon: {
        color: "{text.muted.color}",
        hoverColor: "{text.hover.muted.color}",
        selectedColor: "{highlight.color}"
    },
    loadingIcon: {
        size: "2rem"
    },
    nodeToggleButton: {
        size: "1.75rem",
        color: "{text.muted.color}",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        hoverColor: "{text.hover.muted.color}",
        borderRadius: "0.875rem",
        hoverBackground: "{content.hover.background}",
        selectedHoverColor: "{primary.color}",
        selectedHoverBackground: "{content.background}"
    }
} satisfies TreeDesignTokens;