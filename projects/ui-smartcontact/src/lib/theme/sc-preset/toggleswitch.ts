import type { ToggleSwitchDesignTokens } from '@primeuix/themes/types/toggleswitch';

export default {
    root: {
        gap: "var(--sc-cmp-toggleswitch-gap)",
        width: "var(--sc-cmp-toggleswitch-width)",
        height: "var(--sc-cmp-toggleswitch-height)",
        shadow: "0 0.071429rem 0.142857rem 0 #1212170d",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        borderColor: "#00000000",
        borderWidth: "0.071429rem",
        borderRadius: "2.142857rem",
        slideDuration: "0.2s",
        hoverBorderColor: "#00000000",
        checkedBorderColor: "#00000000",
        invalidBorderColor: "{form.field.invalid.border.color}",
        transitionDuration: "{transition.duration}",
        checkedHoverBorderColor: "#00000000"
    },
    handle: {
        size: "var(--sc-cmp-toggleswitch-handle-size)",
        borderRadius: "var(--sc-cmp-toggleswitch-handle-border-radius)"
    },
    colorScheme: {
        dark: {
            root: {
                background: "{surface.700}",
                hoverBackground: "{surface.600}",
                checkedBackground: "{primary.color}",
                disabledBackground: "{surface.600}",
                checkedHoverBackground: "{primary.hover.color}"
            },
            handle: {
                color: "{surface.900}",
                background: "{surface.400}",
                hoverColor: "{surface.800}",
                checkedColor: "{primary.color}",
                hoverBackground: "{surface.300}",
                checkedBackground: "{surface.900}",
                checkedHoverColor: "{primary.hover.color}",
                disabledBackground: "{surface.900}",
                checkedHoverBackground: "{surface.900}"
            }
        },
        light: {
            root: {
                background: "{surface.300}",
                hoverBackground: "{surface.400}",
                checkedBackground: "{primary.color}",
                disabledBackground: "{form.field.disabled.background}",
                checkedHoverBackground: "{primary.hover.color}"
            },
            handle: {
                color: "{text.muted.color}",
                background: "var(--sc-cmp-toggleswitch-handle-background)",
                hoverColor: "{text.color}",
                checkedColor: "{primary.color}",
                hoverBackground: "var(--sc-cmp-toggleswitch-handle-hover-background)",
                checkedBackground: "var(--sc-cmp-toggleswitch-handle-checked-background)",
                checkedHoverColor: "{primary.hover.color}",
                disabledBackground: "{form.field.disabled.color}",
                checkedHoverBackground: "var(--sc-cmp-toggleswitch-handle-checked-hover-background)"
            }
        }
    }
} satisfies ToggleSwitchDesignTokens;
