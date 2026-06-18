import type { DatePickerDesignTokens } from '@primeuix/themes/types/datepicker';

 export default {
    date: {
        color: "{content.color}",
        width: "var(--sc-scale-2)",
        height: "var(--sc-scale-2)",
        padding: "var(--sc-scale-0-25)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        hoverColor: "{content.hover.color}",
        borderRadius: "var(--sc-scale-1)",
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
        padding: "var(--sc-scale-0-375)",
        borderRadius: "{content.border.radius}"
    },
    group: {
        gap: "{overlay.popover.padding}",
        borderColor: "{content.border.color}"
    },
    month: {
        padding: "var(--sc-scale-0-375)",
        borderRadius: "{content.border.radius}"
    },
    panel: {
        color: "{content.color}",
        shadow: "0 0.142857rem 0.285714rem -0.142857rem #0000001a, 0 0.285714rem 0.428571rem -0.071429rem #0000001a",
        padding: "{overlay.popover.padding}",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}"
    },
    title: {
        gap: "var(--sc-scale-0-5)",
        fontWeight: "500"
    },
    header: {
        color: "{content.color}",
        padding: "0 0 var(--sc-scale-0-5)",
        background: "{content.background}",
        borderColor: "{content.border.color}"
    },
    dayView: {
        margin: "var(--sc-scale-0-5) 0 0"
    },
    weekDay: {
        color: "{content.color}",
        padding: "var(--sc-scale-0-25)",
        fontWeight: "500"
    },
    dropdown: {
        lg: {
            width: "var(--sc-scale-3)"
        },
        sm: {
            width: "var(--sc-scale-2)"
        },
        width: "var(--sc-scale-2-5)",
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
        margin: "var(--sc-scale-0-5) 0 0"
    },
    buttonbar: {
        padding: "var(--sc-scale-0-5) 0 0",
        borderColor: "{content.border.color}"
    },
    inputIcon: {
        color: "{form.field.icon.color}"
    },
    monthView: {
        margin: "var(--sc-scale-0-5) 0 0"
    },
    selectYear: {
        color: "{content.color}",
        padding: "var(--sc-scale-0-25) var(--sc-scale-0-5)",
        hoverColor: "{content.hover.color}",
        borderRadius: "{content.border.radius}",
        hoverBackground: "{content.hover.background}"
    },
    timePicker: {
        gap: "var(--sc-scale-0-5)",
        padding: "var(--sc-scale-0-5) 0 0",
        buttonGap: "var(--sc-scale-0-25)",
        borderColor: "{content.border.color}"
    },
    colorScheme: {
        dark: {
            today: {
                color: "var(--sc-cmp-datepicker-today-color)",
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
                color: "var(--sc-cmp-datepicker-today-color)",
                background: "var(--sc-cmp-datepicker-today-background)"
            },
            dropdown: {
                color: "var(--sc-cmp-datepicker-dropdown-color)",
                background: "var(--sc-cmp-datepicker-dropdown-background)",
                hoverColor: "var(--sc-cmp-datepicker-dropdown-hover-color)",
                activeColor: "var(--sc-cmp-datepicker-dropdown-active-color)",
                hoverBackground: "var(--sc-cmp-datepicker-dropdown-hover-background)",
                activeBackground: "var(--sc-cmp-datepicker-dropdown-active-background)"
            }
        }
    },
    selectMonth: {
        color: "{content.color}",
        padding: "var(--sc-scale-0-25) var(--sc-scale-0-5)",
        hoverColor: "{content.hover.color}",
        borderRadius: "{content.border.radius}",
        hoverBackground: "{content.hover.background}"
    }
} satisfies DatePickerDesignTokens;