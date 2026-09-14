import type { TreeDesignTokens } from '@primeuix/themes/types/tree';

 export default {
    node: {
        gap: "var(--sc-cmp-tree-node-gap)",
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
        indent: "var(--sc-cmp-tree-indent)",
        padding: "var(--sc-cmp-tree-padding)",
        background: "{content.background}",
        transitionDuration: "{transition.duration}"
    },
    filter: {
        margin: "var(--sc-cmp-tree-filter-margin)"
    },
    nodeIcon: {
        color: "{text.muted.color}",
        hoverColor: "{text.hover.muted.color}",
        selectedColor: "{highlight.color}"
    },
    loadingIcon: {
        size: "var(--sc-cmp-tree-loading-icon-size)"
    },
    nodeToggleButton: {
        size: "var(--sc-cmp-tree-node-toggle-button-size)",
        color: "{text.muted.color}",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        hoverColor: "{text.hover.muted.color}",
        borderRadius: "var(--sc-cmp-tree-node-toggle-button-border-radius)",
        hoverBackground: "{content.hover.background}",
        selectedHoverColor: "{primary.color}",
        selectedHoverBackground: "{content.background}"
    }
} satisfies TreeDesignTokens;