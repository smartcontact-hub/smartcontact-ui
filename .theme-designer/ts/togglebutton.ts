import type { ToggleButtonDesignTokens } from '@primeuix/themes/types/togglebutton';

 export default {
    root: {
        background: "light-dark({surface.100}, {surface.950})",
        checkedBackground: "light-dark({surface.100}, {surface.950})",
        hoverBackground: "light-dark({surface.100}, {surface.950})",
        borderColor: "light-dark({surface.100}, {surface.950})",
        color: "light-dark({surface.500}, {surface.400})",
        hoverColor: "light-dark({surface.700}, {surface.300})",
        checkedColor: "light-dark({surface.900}, {surface.0})",
        checkedBorderColor: "light-dark({surface.100}, {surface.950})",
        padding: "0.25rem",
        borderRadius: "{content.border.radius}",
        gap: "0.5rem",
        fontWeight: "{primitive.typography.font.weight.medium}",
        disabledBackground: "{form.field.disabled.background}",
        disabledBorderColor: "{form.field.disabled.background}",
        disabledColor: "{form.field.disabled.color}",
        invalidBorderColor: "{form.field.invalid.border.color}",
        focusRing: {
            width: "{focus.ring.width}",
            style: "{focus.ring.style}",
            color: "{focus.ring.color}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        transitionDuration: "{form.field.transition.duration}",
        sm: {
            fontSize: "{primitive.typography.font.size.100}",
            padding: "0.25rem"
        },
        lg: {
            fontSize: "{primitive.typography.font.size.300}",
            padding: "0.25rem"
        }
    },
    icon: {
        color: "light-dark({surface.500}, {surface.400})",
        hoverColor: "light-dark({surface.700}, {surface.300})",
        checkedColor: "light-dark({surface.900}, {surface.0})",
        disabledColor: "{form.field.disabled.color}"
    },
    content: {
        padding: "0.25rem 0.75rem",
        borderRadius: "{content.border.radius}",
        checkedBackground: "light-dark({surface.0}, {surface.800})",
        checkedShadow: "0 1px 2px 0 #0000000a, 0 1px 2px 0 #00000005",
        sm: {
            padding: "0.25rem 0.75rem"
        },
        lg: {
            padding: "0.25rem 0.75rem"
        }
    }
} satisfies ToggleButtonDesignTokens;