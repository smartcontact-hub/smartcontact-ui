import type { ToggleButtonDesignTokens } from '@primeuix/themes/types/togglebutton';

 export default {
    icon: {
        disabledColor: "{form.field.disabled.color}"
    },
    root: {
        lg: {
            padding: "0.25rem",
            fontSize: "{form.field.lg.font.size}"
        },
        sm: {
            padding: "0.25rem",
            fontSize: "{form.field.sm.font.size}"
        },
        gap: "0.5rem",
        padding: "0.25rem",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        fontWeight: "500",
        borderRadius: "{content.border.radius}",
        disabledColor: "{form.field.disabled.color}",
        disabledBackground: "{form.field.disabled.background}",
        invalidBorderColor: "{form.field.invalid.border.color}",
        transitionDuration: "{form.field.transition.duration}",
        disabledBorderColor: "{form.field.disabled.background}"
    },
    content: {
        lg: {
            padding: "0.25rem 0.75rem"
        },
        sm: {
            padding: "0.25rem 0.75rem"
        },
        padding: "0.25rem 0.75rem",
        borderRadius: "{content.border.radius}",
        checkedShadow: "0 0.071429rem 0.142857rem 0 #0000000a, 0 0.071429rem 0.142857rem 0 #00000005"
    },
    colorScheme: {
        dark: {
            icon: {
                color: "{surface.400}",
                hoverColor: "{surface.300}",
                checkedColor: "{surface.0}"
            },
            root: {
                color: "{surface.400}",
                background: "{surface.950}",
                hoverColor: "{surface.300}",
                borderColor: "{surface.950}",
                checkedColor: "{surface.0}",
                hoverBackground: "{surface.950}",
                checkedBackground: "{surface.950}",
                checkedBorderColor: "{surface.950}"
            },
            content: {
                checkedBackground: "{surface.800}"
            }
        },
        light: {
            icon: {
                color: "{surface.500}",
                hoverColor: "{surface.700}",
                checkedColor: "{surface.900}"
            },
            root: {
                color: "{surface.500}",
                background: "{surface.100}",
                hoverColor: "{surface.700}",
                borderColor: "{surface.100}",
                checkedColor: "{surface.900}",
                hoverBackground: "{surface.100}",
                checkedBackground: "{surface.100}",
                checkedBorderColor: "{surface.100}"
            },
            content: {
                checkedBackground: "{surface.0}"
            }
        }
    }
} satisfies ToggleButtonDesignTokens;