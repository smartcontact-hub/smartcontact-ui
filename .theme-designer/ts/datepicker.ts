import type { DatePickerDesignTokens } from '@primeuix/themes/types/datepicker';

 export default {
    date: {
        color: "{content.color}",
        width: "2rem",
        height: "2rem",
        padding: "0.25rem",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        hoverColor: "{content.hover.color}",
        borderRadius: "1rem",
        selectedColor: "{primary.contrast.color}",
        hoverBackground: "{content.hover.background}",
        rangeSelectedColor: "{highlight.color}",
        selectedBackground: "{primary.color}",
        rangeSelectedBackground: "{highlight.background}"
    },
    root: {
        transitionDuration: "{form.field.transition.duration}"
    },
    year: {
        padding: "0.375rem",
        borderRadius: "{content.border.radius}"
    },
    group: {
        gap: "{overlay.popover.padding}",
        borderColor: "{content.border.color}"
    },
    month: {
        padding: "0.375rem",
        borderRadius: "{content.border.radius}"
    },
    panel: {
        color: "{content.color}",
        shadow: "0 2px 4px -2px #0000001a, 0 4px 6px -1px #0000001a",
        padding: "{overlay.popover.padding}",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}"
    },
    title: {
        gap: "0.5rem",
        fontWeight: "500"
    },
    header: {
        color: "{content.color}",
        padding: "0 0 0.5rem",
        background: "{content.background}",
        borderColor: "{content.border.color}"
    },
    dayView: {
        margin: "0.5rem 0 0"
    },
    weekDay: {
        color: "{content.color}",
        padding: "0.25rem",
        fontWeight: "500"
    },
    dropdown: {
        lg: {
            width: "3rem"
        },
        sm: {
            width: "2rem"
        },
        width: "2.5rem",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        borderColor: "{form.field.border.color}",
        borderRadius: "{form.field.border.radius}",
        hoverBorderColor: "{form.field.border.color}",
        activeBorderColor: "{form.field.border.color}"
    },
    yearView: {
        margin: "0.5rem 0 0"
    },
    buttonbar: {
        padding: "0.5rem 0 0",
        borderColor: "{content.border.color}"
    },
    inputIcon: {
        color: "{form.field.icon.color}"
    },
    monthView: {
        margin: "0.5rem 0 0"
    },
    selectYear: {
        color: "{content.color}",
        padding: "0.25rem 0.5rem",
        hoverColor: "{content.hover.color}",
        borderRadius: "{content.border.radius}",
        hoverBackground: "{content.hover.background}"
    },
    timePicker: {
        gap: "0.5rem",
        padding: "0.5rem 0 0",
        buttonGap: "0.25rem",
        borderColor: "{content.border.color}"
    },
    colorScheme: {
        dark: {
            today: {
                color: "{surface.0}",
                background: "{surface.700}"
            },
            dropdown: {
                color: "{surface.300}",
                background: "{surface.800}",
                hoverColor: "{surface.200}",
                activeColor: "{surface.100}",
                hoverBackground: "{surface.700}",
                activeBackground: "{surface.600}"
            }
        },
        light: {
            today: {
                color: "{surface.900}",
                background: "{surface.200}"
            },
            dropdown: {
                color: "{surface.600}",
                background: "{surface.100}",
                hoverColor: "{surface.700}",
                activeColor: "{surface.800}",
                hoverBackground: "{surface.200}",
                activeBackground: "{surface.300}"
            }
        }
    },
    selectMonth: {
        color: "{content.color}",
        padding: "0.25rem 0.5rem",
        hoverColor: "{content.hover.color}",
        borderRadius: "{content.border.radius}",
        hoverBackground: "{content.hover.background}"
    }
} satisfies DatePickerDesignTokens;