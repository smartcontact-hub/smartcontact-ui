import type { OrganizationChartDesignTokens } from '@primeuix/themes/types/organizationchart';

 export default {
    node: {
        color: "{content.color}",
        padding: "var(--sc-scale-0-75) var(--sc-scale-1)",
        background: "{content.background}",
        hoverColor: "{content.hover.color}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}",
        selectedColor: "{highlight.color}",
        hoverBackground: "{content.hover.background}",
        toggleablePadding: "var(--sc-scale-0-75) var(--sc-scale-1) var(--sc-scale-1-25)",
        selectedBackground: "{highlight.background}"
    },
    root: {
        gutter: "var(--sc-scale-0-75)",
        transitionDuration: "{transition.duration}"
    },
    connector: {
        color: "{content.border.color}",
        height: "1.714286rem",
        borderRadius: "{content.border.radius}"
    },
    nodeToggleButton: {
        size: "var(--sc-scale-1-5)",
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
        borderRadius: "var(--sc-scale-0-75)",
        hoverBackground: "{content.hover.background}"
    }
} satisfies OrganizationChartDesignTokens;