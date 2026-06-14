import type { FieldsetDesignTokens } from '@primeuix/themes/types/fieldset';

 export default {
    root: {
        color: "{content.color}",
        padding: "1.125rem",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}",
        transitionDuration: "{transition.duration}"
    },
    legend: {
        gap: "0.5rem",
        color: "{content.color}",
        padding: "0.5rem 0.75rem",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        background: "{content.background}",
        fontWeight: "600",
        hoverColor: "{content.hover.color}",
        borderColor: "#00000000",
        borderWidth: "1px",
        borderRadius: "{content.border.radius}",
        hoverBackground: "{content.hover.background}"
    },
    content: {
        padding: "0"
    },
    toggleIcon: {
        color: "{text.muted.color}",
        hoverColor: "{text.hover.muted.color}"
    }
} satisfies FieldsetDesignTokens;