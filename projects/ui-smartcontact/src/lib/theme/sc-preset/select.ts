import type { SelectDesignTokens } from '@primeuix/themes/types/select';

 export default {
    list: {
        gap: "{list.gap}",
        header: {
            padding: "{list.header.padding}"
        },
        padding: "{list.padding}"
    },
    root: {
        lg: {
            fontSize: "{form.field.lg.font.size}",
            paddingX: "{form.field.lg.padding.x}",
            paddingY: "{form.field.lg.padding.y}"
        },
        sm: {
            fontSize: "{form.field.sm.font.size}",
            paddingX: "{form.field.sm.padding.x}",
            paddingY: "{form.field.sm.padding.y}"
        },
        color: "{form.field.color}",
        shadow: "var(--sc-cmp-select-shadow)",
        paddingX: "{form.field.padding.x}",
        paddingY: "{form.field.padding.y}",
        focusRing: {
            color: "{form.field.focus.ring.color}",
            style: "{form.field.focus.ring.style}",
            width: "{form.field.focus.ring.width}",
            offset: "{form.field.focus.ring.offset}",
            shadow: "none"
        },
        background: "{form.field.background}",
        borderColor: "{form.field.border.color}",
        borderRadius: "{form.field.border.radius}",
        disabledColor: "{form.field.disabled.color}",
        filledBackground: "{form.field.filled.background}",
        focusBorderColor: "{form.field.focus.border.color}",
        hoverBorderColor: "{form.field.hover.border.color}",
        placeholderColor: "{form.field.placeholder.color}",
        disabledBackground: "{form.field.disabled.background}",
        invalidBorderColor: "{form.field.invalid.border.color}",
        transitionDuration: "{form.field.transition.duration}",
        filledFocusBackground: "{form.field.filled.focus.background}",
        filledHoverBackground: "{form.field.filled.hover.background}",
        invalidPlaceholderColor: "{form.field.invalid.placeholder.color}"
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
    overlay: {
        color: "{overlay.select.color}",
        shadow: "var(--sc-cmp-select-overlay-shadow)",
        background: "{overlay.select.background}",
        borderColor: "{overlay.select.border.color}",
        borderRadius: "{overlay.select.border.radius}"
    },
    dropdown: {
        color: "{form.field.icon.color}",
        width: "var(--sc-scale-2-5)"
    },
    checkmark: {
        color: "{list.option.color}",
        gutterEnd: "var(--sc-scale-0-375)",
        gutterStart: "var(--sc-scale-neg-0-375)"
    },
    clearIcon: {
        color: "{form.field.icon.color}"
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
} satisfies SelectDesignTokens;