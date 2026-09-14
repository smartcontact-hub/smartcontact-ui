import type { DatePickerDesignTokens } from '@primeuix/themes/types/datepicker';

 export default {
    date: {
        color: "{content.color}",
        width: "var(--sc-cmp-datepicker-date-width)",
        height: "var(--sc-cmp-datepicker-date-height)",
        padding: "var(--sc-cmp-datepicker-date-padding)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        hoverColor: "{content.hover.color}",
        borderRadius: "var(--sc-cmp-datepicker-date-border-radius)",
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
        padding: "var(--sc-cmp-datepicker-year-padding)",
        borderRadius: "{content.border.radius}"
    },
    group: {
        gap: "{overlay.popover.padding}",
        borderColor: "{content.border.color}"
    },
    month: {
        padding: "var(--sc-cmp-datepicker-month-padding)",
        borderRadius: "{content.border.radius}"
    },
    panel: {
        color: "{content.color}",
        shadow: "var(--sc-cmp-datepicker-panel-shadow)",
        padding: "{overlay.popover.padding}",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}"
    },
    /*
     * `fontSize: "1em"` en título, mes y año = «lo que mida la cabecera». Hasta que Aura
     * fue la base del tema (2026-09-13) estos tres no tenían tamaño propio y lo heredaban
     * de `.p-datepicker-header`, que es donde `sc-datepicker` fija el de cada talla (sm 12,
     * lg 16). Aura les trae 14px fijos, y un valor propio le gana al heredado: medido en
     * Conversaciones (talla sm), mes y año a 14 con los días a 12. `1em` devuelve la
     * herencia sin añadir clases `.p-*` al componente (`audit:primeng-coupling`).
     */
    title: {
        gap: "var(--sc-cmp-datepicker-title-gap)",
        fontSize: "1em",
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
        padding: "var(--sc-cmp-datepicker-week-day-padding)",
        fontWeight: "500"
    },
    dropdown: {
        lg: {
            width: "var(--sc-cmp-datepicker-dropdown-lg-width)"
        },
        sm: {
            width: "var(--sc-cmp-datepicker-dropdown-sm-width)"
        },
        width: "var(--sc-cmp-datepicker-dropdown-width)",
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
        fontSize: "1em",
        color: "{content.color}",
        padding: "var(--sc-scale-0-25) var(--sc-scale-0-5)",
        hoverColor: "{content.hover.color}",
        borderRadius: "{content.border.radius}",
        hoverBackground: "{content.hover.background}"
    },
    timePicker: {
        gap: "var(--sc-cmp-datepicker-time-picker-gap)",
        padding: "var(--sc-scale-0-5) 0 0",
        buttonGap: "var(--sc-cmp-datepicker-time-picker-button-gap)",
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
        fontSize: "1em",
        color: "{content.color}",
        padding: "var(--sc-scale-0-25) var(--sc-scale-0-5)",
        hoverColor: "{content.hover.color}",
        borderRadius: "{content.border.radius}",
        hoverBackground: "{content.hover.background}"
    }
} satisfies DatePickerDesignTokens;