import type { CheckboxDesignTokens } from '@primeuix/themes/types/checkbox';

 export default {
    icon: {
        lg: {
            size: "var(--sc-scale-1)"
        },
        sm: {
            size: "var(--sc-scale-0-75)"
        },
        size: "var(--sc-scale-0-875)",
        color: "{form.field.color}",
        checkedColor: "{primary.contrast.color}",
        disabledColor: "{form.field.disabled.color}",
        checkedHoverColor: "{primary.contrast.color}"
    },
    root: {
        lg: {
            width: "var(--sc-scale-1-5)",
            height: "var(--sc-scale-1-5)"
        },
        sm: {
            width: "var(--sc-scale-1)",
            height: "var(--sc-scale-1)"
        },
        width: "var(--sc-scale-1-25)",
        height: "var(--sc-scale-1-25)",
        shadow: "var(--sc-cmp-checkbox-shadow)",
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