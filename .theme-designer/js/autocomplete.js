export default {
    root: {
        background: "{form.field.background}",
        disabledBackground: "{form.field.disabled.background}",
        filledBackground: "{form.field.filled.background}",
        filledHoverBackground: "{form.field.filled.hover.background}",
        filledFocusBackground: "{form.field.filled.focus.background}",
        borderColor: "{form.field.border.color}",
        hoverBorderColor: "{form.field.hover.border.color}",
        focusBorderColor: "{form.field.focus.border.color}",
        invalidBorderColor: "{form.field.invalid.border.color}",
        color: "{form.field.color}",
        disabledColor: "{form.field.disabled.color}",
        placeholderColor: "{form.field.placeholder.color}",
        invalidPlaceholderColor: "{form.field.invalid.placeholder.color}",
        shadow: "0 1px 2px 0 #1212170d",
        paddingX: "{form.field.padding.x}",
        paddingY: "{form.field.padding.y}",
        borderRadius: "{form.field.border.radius}",
        focusRing: {
            width: "{form.field.focus.ring.width}",
            style: "{form.field.focus.ring.style}",
            color: "{form.field.focus.ring.color}",
            offset: "{form.field.focus.ring.offset}",
            shadow: "none"
        },
        transitionDuration: "{form.field.transition.duration}"
    },
    overlay: {
        background: "{overlay.select.background}",
        borderColor: "{overlay.select.border.color}",
        borderRadius: "{overlay.select.border.radius}",
        color: "{overlay.select.color}",
        shadow: "0 2px 4px -2px #0000001a, 0 4px 6px -1px #0000001a"
    },
    list: {
        padding: "{list.padding}",
        gap: "{list.gap}"
    },
    option: {
        focusBackground: "{list.option.focus.background}",
        selectedBackground: "{list.option.selected.background}",
        selectedFocusBackground: "{list.option.selected.focus.background}",
        color: "{list.option.color}",
        focusColor: "{list.option.focus.color}",
        selectedColor: "{list.option.selected.color}",
        selectedFocusColor: "{list.option.selected.focus.color}",
        padding: "{list.option.padding}",
        borderRadius: "{list.option.border.radius}"
    },
    optionGroup: {
        background: "{list.option.group.background}",
        color: "{list.option.group.color}",
        fontWeight: "{list.option.group.font.weight}",
        padding: "{list.option.group.padding}"
    },
    dropdown: {
        background: "light-dark({surface.100}, {surface.800})",
        hoverBackground: "light-dark({surface.200}, {surface.700})",
        activeBackground: "light-dark({surface.300}, {surface.600})",
        color: "light-dark({surface.600}, {surface.300})",
        hoverColor: "light-dark({surface.700}, {surface.200})",
        activeColor: "light-dark({surface.800}, {surface.100})",
        width: "2.5rem",
        sm: {
            width: "2rem"
        },
        lg: {
            width: "3rem"
        },
        borderColor: "{form.field.border.color}",
        hoverBorderColor: "{form.field.border.color}",
        activeBorderColor: "{form.field.border.color}",
        borderRadius: "{form.field.border.radius}",
        focusRing: {
            width: "{focus.ring.width}",
            style: "{focus.ring.style}",
            color: "{focus.ring.color}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        }
    },
    chip: {
        borderRadius: "{border.radius.sm}",
        focusBackground: "light-dark({surface.200}, {surface.700})",
        focusColor: "light-dark({surface.800}, {surface.0})"
    },
    emptyMessage: {
        padding: "{list.option.padding}"
    }
}