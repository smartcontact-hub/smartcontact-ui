import type { FieldsetDesignTokens } from '@primeuix/themes/types/fieldset';

 export default {
    root: {
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}",
        color: "{content.color}",
        padding: "1.125rem",
        transitionDuration: "{transition.duration}"
    },
    legend: {
        background: "{content.background}",
        hoverBackground: "{content.hover.background}",
        color: "{content.color}",
        hoverColor: "{content.hover.color}",
        borderRadius: "{content.border.radius}",
        borderWidth: "1px",
        borderColor: "#00000000",
        padding: "0.5rem 0.75rem",
        gap: "0.5rem",
        fontWeight: "{primitive.typography.font.weight.semibold}",
        focusRing: {
            width: "{focus.ring.width}",
            style: "{focus.ring.style}",
            color: "{focus.ring.color}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        }
    },
    toggleIcon: {
        color: "{text.muted.color}",
        hoverColor: "{text.hover.muted.color}"
    },
    content: {
        padding: "0"
    }
} satisfies FieldsetDesignTokens;