import type { OrganizationChartDesignTokens } from '@primeuix/themes/types/organizationchart';

 export default {
    node: {
        color: "{content.color}",
        padding: "0.75rem 1rem",
        background: "{content.background}",
        hoverColor: "{content.hover.color}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}",
        selectedColor: "{highlight.color}",
        hoverBackground: "{content.hover.background}",
        toggleablePadding: "0.75rem 1rem 1.25rem",
        selectedBackground: "{highlight.background}"
    },
    root: {
        gutter: "0.75rem",
        transitionDuration: "{transition.duration}"
    },
    connector: {
        color: "{content.border.color}",
        height: "24px",
        borderRadius: "{content.border.radius}"
    },
    nodeToggleButton: {
        size: "1.5rem",
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
        borderRadius: "0.75rem",
        hoverBackground: "{content.hover.background}"
    }
} satisfies OrganizationChartDesignTokens;