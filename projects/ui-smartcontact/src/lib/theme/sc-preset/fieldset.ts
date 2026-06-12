import type { FieldsetDesignTokens } from '@primeuix/themes/types/fieldset';

 export default {
    root: {
        color: "{content.color}",
        padding: "var(--sc-scale-1-125)",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}",
        transitionDuration: "{transition.duration}"
    },
    legend: {
        gap: "var(--sc-scale-0-5)",
        color: "{content.color}",
        padding: "var(--sc-scale-0-5) var(--sc-scale-0-75)",
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
        borderWidth: "0.071429rem",
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