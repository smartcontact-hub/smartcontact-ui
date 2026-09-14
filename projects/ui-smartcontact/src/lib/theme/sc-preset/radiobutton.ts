import type { RadioButtonDesignTokens } from '@primeuix/themes/types/radiobutton';

 export default {
    icon: {
        lg: {
            size: "var(--sc-cmp-radiobutton-icon-lg-size)"
        },
        sm: {
            size: "var(--sc-cmp-radiobutton-icon-sm-size)"
        },
        size: "var(--sc-cmp-radiobutton-icon-size)",
        checkedColor: "{primary.contrast.color}",
        disabledColor: "{form.field.disabled.color}",
        checkedHoverColor: "{primary.contrast.color}"
    },
    root: {
        lg: {
            width: "var(--sc-cmp-radiobutton-lg-width)",
            height: "var(--sc-cmp-radiobutton-lg-height)"
        },
        sm: {
            width: "var(--sc-cmp-radiobutton-sm-width)",
            height: "var(--sc-cmp-radiobutton-sm-height)"
        },
        width: "var(--sc-cmp-radiobutton-width)",
        height: "var(--sc-cmp-radiobutton-height)",
        shadow: "var(--sc-cmp-radiobutton-shadow)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        background: "{form.field.background}",
        borderColor: "{form.field.border.color}",
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
} satisfies RadioButtonDesignTokens;