import type { OrganizationChartDesignTokens } from '@primeuix/themes/types/organizationchart';

 export default {
    node: {
        color: "{content.color}",
        padding: "var(--sc-cmp-organizationchart-node-padding-y) var(--sc-cmp-organizationchart-node-padding-x)",
        background: "{content.background}",
        hoverColor: "{content.hover.color}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}",
        selectedColor: "{highlight.color}",
        hoverBackground: "{content.hover.background}",
        toggleablePadding: "var(--sc-cmp-organizationchart-node-toggleable-padding-top) var(--sc-cmp-organizationchart-node-toggleable-padding-right) var(--sc-cmp-organizationchart-node-toggleable-padding-bottom) var(--sc-cmp-organizationchart-node-toggleable-padding-left)",
        selectedBackground: "{highlight.background}"
    },
    root: {
        gutter: "var(--sc-cmp-organizationchart-gutter)",
        transitionDuration: "{transition.duration}"
    },
    connector: {
        color: "{content.border.color}",
        height: "1.714286rem",
        borderRadius: "{content.border.radius}"
    },
    nodeToggleButton: {
        size: "var(--sc-cmp-organizationchart-node-toggle-button-size)",
        color: "{text.muted.color}",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        background: "{content.background}",
        hoverColor: "{text.color}",
        borderColor: "{content.border.color}",
        borderRadius: "var(--sc-cmp-organizationchart-node-toggle-button-border-radius)",
        hoverBackground: "{content.hover.background}"
    }
} satisfies OrganizationChartDesignTokens;