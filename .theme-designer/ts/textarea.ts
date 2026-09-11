import type { TextareaDesignTokens } from '@primeuix/themes/types/textarea';

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
        transitionDuration: "{form.field.transition.duration}",
        sm: {
            fontSize: "{primitive.typography.font.size.100}",
            paddingX: "{form.field.sm.padding.x}",
            paddingY: "{form.field.sm.padding.y}"
        },
        lg: {
            fontSize: "{primitive.typography.font.size.300}",
            paddingX: "{form.field.lg.padding.x}",
            paddingY: "{form.field.lg.padding.y}"
        }
    }
} satisfies TextareaDesignTokens;