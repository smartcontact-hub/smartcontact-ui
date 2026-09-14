import type { CheckboxDesignTokens } from '@primeuix/themes/types/checkbox';

 export default {
    icon: {
        lg: {
            size: "var(--sc-cmp-checkbox-icon-lg-size)"
        },
        sm: {
            size: "var(--sc-cmp-checkbox-icon-sm-size)"
        },
        size: "var(--sc-cmp-checkbox-icon-size)",
        color: "{form.field.color}",
        checkedColor: "{primary.contrast.color}",
        disabledColor: "{form.field.disabled.color}",
        checkedHoverColor: "{primary.contrast.color}"
    },
    root: {
        lg: {
            width: "var(--sc-cmp-checkbox-lg-width)",
            height: "var(--sc-cmp-checkbox-lg-height)"
        },
        sm: {
            width: "var(--sc-cmp-checkbox-sm-width)",
            height: "var(--sc-cmp-checkbox-sm-height)"
        },
        width: "var(--sc-cmp-checkbox-width)",
        height: "var(--sc-cmp-checkbox-height)",
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