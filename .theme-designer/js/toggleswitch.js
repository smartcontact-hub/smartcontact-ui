export default {
    root: {
        gap: "0.25rem",
        width: "2.5rem",
        height: "1.5rem",
        shadow: "0 1px 2px 0 #1212170d",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        borderColor: "#00000000",
        borderWidth: "1px",
        borderRadius: "30px",
        slideDuration: "0.2s",
        hoverBorderColor: "#00000000",
        checkedBorderColor: "#00000000",
        invalidBorderColor: "{form.field.invalid.border.color}",
        transitionDuration: "{transition.duration}",
        checkedHoverBorderColor: "#00000000"
    },
    handle: {
        size: "1rem",
        borderRadius: "0.5rem"
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
                background: "{surface.0}",
                hoverColor: "{text.color}",
                checkedColor: "{primary.color}",
                hoverBackground: "{surface.0}",
                checkedBackground: "{surface.0}",
                checkedHoverColor: "{primary.hover.color}",
                disabledBackground: "{form.field.disabled.color}",
                checkedHoverBackground: "{surface.0}"
            }
        }
    }
}