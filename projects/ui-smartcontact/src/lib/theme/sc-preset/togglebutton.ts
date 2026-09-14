import type { ToggleButtonDesignTokens } from '@primeuix/themes/types/togglebutton';

 export default {
    icon: {
        disabledColor: "{form.field.disabled.color}"
    },
    root: {
        lg: {
            padding: "var(--sc-cmp-togglebutton-lg-padding)",
            fontSize: "{form.field.lg.font.size}"
        },
        sm: {
            padding: "var(--sc-cmp-togglebutton-sm-padding)",
            fontSize: "{form.field.sm.font.size}"
        },
        gap: "var(--sc-cmp-togglebutton-gap)",
        padding: "var(--sc-cmp-togglebutton-padding)",
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
            padding: "var(--sc-cmp-togglebutton-content-lg-padding-y) var(--sc-cmp-togglebutton-content-lg-padding-x)"
        },
        sm: {
            padding: "var(--sc-cmp-togglebutton-content-sm-padding-y) var(--sc-cmp-togglebutton-content-sm-padding-x)"
        },
        padding: "var(--sc-cmp-togglebutton-content-padding-y) var(--sc-cmp-togglebutton-content-padding-x)",
        borderRadius: "{content.border.radius}",
        checkedShadow: "0 0.071429rem 0.142857rem 0 #0000000a, 0 0.071429rem 0.142857rem 0 #00000005"
    },
    colorScheme: {
        dark: {
            icon: {
                color: "{surface.400}",
                hoverColor: "{surface.300}",
                checkedColor: "var(--sc-cmp-togglebutton-icon-checked-color)"
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
                color: "var(--sc-cmp-togglebutton-icon-color)",
                hoverColor: "var(--sc-cmp-togglebutton-icon-hover-color)",
                checkedColor: "var(--sc-cmp-togglebutton-icon-checked-color)"
            },
            root: {
                /* DIVERGENCIA por AA (customs-catalog §1.10, 2026-09-14): el Kit da `surface.500` para la
                 * opción no elegida, 2,56:1 sobre su carril `surface.100` (lo cazó `theme-contrast` en las
                 * vistas de Conversaciones). `surface.700` da 6,40:1. El hover sube un paso más, a
                 * `surface.900`, para que siga respondiendo al ratón. Cuando el Kit suba el suyo y
                 * `cmp-color-rewire` acepte los slots de `root`, se lee `var(--sc-cmp-togglebutton-*)`. */
                color: "{surface.700}",
                background: "{surface.100}",
                hoverColor: "{surface.900}",
                borderColor: "{surface.100}",
                checkedColor: "{surface.900}",
                hoverBackground: "{surface.100}",
                checkedBackground: "{surface.100}",
                checkedBorderColor: "{surface.100}"
            },
            content: {
                checkedBackground: "var(--sc-cmp-togglebutton-content-checked-background)"
            }
        }
    }
} satisfies ToggleButtonDesignTokens;