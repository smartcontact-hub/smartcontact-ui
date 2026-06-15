import type { CheckboxDesignTokens } from '@primeuix/themes/types/checkbox';

 export default {
    icon: {
        lg: {
            size: "1rem"
        },
        sm: {
            size: "0.75rem"
        },
        size: "0.875rem",
        color: "{form.field.color}",
        checkedColor: "{primary.contrast.color}",
        disabledColor: "{form.field.disabled.color}",
        checkedHoverColor: "{primary.contrast.color}"
    },
    root: {
        lg: {
            width: "1.5rem",
            height: "1.5rem"
        },
        sm: {
            width: "1rem",
            height: "1rem"
        },
        width: "1.25rem",
        height: "1.25rem",
        shadow: "0 1px 2px 0 #1212170d",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        background: "{form.field.background}",
        borderColor: "{form.field.border.color}",
        borderRadius: "{border.radius.sm}",
        filledBackground: "{form.field.filled.background}",
        focusBorderColor: "{form.field.border.color}",
        hoverBorderColor: "{form.field.hover.border.color}",
        checkedBackground: "{primary.color}",
        checkedBorderColor: "{primary.color}",
        disabledBackground: "{form.field.disabled.background}",
        invalidBorderColor: "{form.field.invalid.border.color}",
        transitionDuration: "{form.field.transition.duration}",
        checkedHoverBackground: "{primary.hover.color}",
        checkedFocusBorderColor: "{primary.color}",
        checkedHoverBorderColor: "{primary.hover.color}",
        checkedDisabledBorderColor: "{form.field.border.color}"
    }
} satisfies CheckboxDesignTokens;