import type { ListboxDesignTokens } from '@primeuix/themes/types/listbox';

 export default {
    list: {
        gap: "{list.gap}",
        header: {
            padding: "{list.header.padding}"
        },
        padding: "{list.padding}"
    },
    root: {
        color: "{form.field.color}",
        shadow: "0 0.071429rem 0.142857rem 0 #1212170d",
        background: "{form.field.background}",
        borderColor: "{form.field.border.color}",
        borderRadius: "{form.field.border.radius}",
        disabledColor: "{form.field.disabled.color}",
        disabledBackground: "{form.field.disabled.background}",
        invalidBorderColor: "{form.field.invalid.border.color}",
        transitionDuration: "{form.field.transition.duration}"
    },
    option: {
        color: "{list.option.color}",
        padding: "{list.option.padding}",
        focusColor: "{list.option.focus.color}",
        borderRadius: "{list.option.border.radius}",
        selectedColor: "{list.option.selected.color}",
        focusBackground: "{list.option.focus.background}",
        selectedBackground: "{list.option.selected.background}",
        selectedFocusColor: "{list.option.selected.focus.color}",
        selectedFocusBackground: "{list.option.selected.focus.background}"
    },
    checkmark: {
        color: "{list.option.color}",
        gutterEnd: "var(--sc-scale-0-375)",
        gutterStart: "var(--sc-scale-neg-0-375)"
    },
    colorScheme: {
        dark: {
            option: {
                stripedBackground: "{surface.900}"
            }
        },
        light: {
            option: {
                stripedBackground: "{surface.50}"
            }
        }
    },
    optionGroup: {
        color: "{list.option.group.color}",
        padding: "{list.option.group.padding}",
        background: "{list.option.group.background}",
        fontWeight: "{list.option.group.font.weight}"
    },
    emptyMessage: {
        padding: "{list.option.padding}"
    }
} satisfies ListboxDesignTokens;