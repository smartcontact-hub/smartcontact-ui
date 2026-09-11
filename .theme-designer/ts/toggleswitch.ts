import type { ToggleSwitchDesignTokens } from '@primeuix/themes/types/toggleswitch';

 export default {
    root: {
        background: "light-dark({surface.300}, {surface.700})",
        disabledBackground: "light-dark({form.field.disabled.background}, {surface.600})",
        hoverBackground: "light-dark({surface.400}, {surface.600})",
        checkedBackground: "{primary.color}",
        checkedHoverBackground: "{primary.hover.color}",
        width: "2.5rem",
        height: "1.5rem",
        borderRadius: "30px",
        gap: "0.25rem",
        shadow: "0 1px 2px 0 #1212170d",
        focusRing: {
            width: "{focus.ring.width}",
            style: "{focus.ring.style}",
            color: "{focus.ring.color}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        borderWidth: "1px",
        borderColor: "#00000000",
        hoverBorderColor: "#00000000",
        checkedBorderColor: "#00000000",
        checkedHoverBorderColor: "#00000000",
        invalidBorderColor: "{form.field.invalid.border.color}",
        transitionDuration: "{transition.duration}",
        slideDuration: "0.2s"
    },
    handle: {
        background: "light-dark({surface.0}, {surface.400})",
        disabledBackground: "light-dark({form.field.disabled.color}, {surface.900})",
        hoverBackground: "light-dark({surface.0}, {surface.300})",
        checkedBackground: "light-dark({surface.0}, {surface.900})",
        checkedHoverBackground: "light-dark({surface.0}, {surface.900})",
        color: "light-dark({text.muted.color}, {surface.900})",
        hoverColor: "light-dark({text.color}, {surface.800})",
        checkedColor: "{primary.color}",
        checkedHoverColor: "{primary.hover.color}",
        borderRadius: "0.5rem",
        size: "1rem"
    }
} satisfies ToggleSwitchDesignTokens;