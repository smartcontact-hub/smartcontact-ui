import type { AccordionDesignTokens } from '@primeuix/themes/types/accordion';

 export default {
    root: {
        transitionDuration: "{transition.duration}"
    },
    panel: {
        borderColor: "{content.border.color}",
        borderWidth: "0.071429rem"
    },
    header: {
        last: {
            bottomBorderRadius: "{content.border.radius}",
            activeBottomBorderRadius: "0"
        },
        color: "{text.muted.color}",
        first: {
            borderWidth: "0",
            topBorderRadius: "{content.border.radius}"
        },
        padding: "1.125rem",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        background: "{content.background}",
        fontWeight: "600",
        hoverColor: "{text.color}",
        toggleIcon: {
            color: "{text.muted.color}",
            hoverColor: "{text.color}",
            activeColor: "{text.color}",
            activeHoverColor: "{text.color}"
        },
        activeColor: "{text.color}",
        borderColor: "{content.border.color}",
        borderWidth: "0",
        borderRadius: "0",
        hoverBackground: "{content.background}",
        activeBackground: "{content.background}",
        activeHoverColor: "{text.color}",
        activeHoverBackground: "{content.background}"
    },
    content: {
        color: "{text.color}",
        padding: "0 1.125rem 1.125rem",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderWidth: "0"
    }
} satisfies AccordionDesignTokens;