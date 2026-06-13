import type { FloatLabelDesignTokens } from '@primeuix/themes/types/floatlabel';

 export default {
    in: {
        input: {
            paddingTop: "var(--sc-scale-1-5)",
            paddingBottom: "{form.field.padding.y}"
        },
        active: {
            top: "{form.field.padding.y}"
        }
    },
    on: {
        active: {
            padding: "0 var(--sc-scale-0-125)",
            background: "{form.field.background}"
        },
        borderRadius: "{border.radius.xs}"
    },
    over: {
        active: {
            top: "var(--sc-scale-neg-1-25)"
        }
    },
    root: {
        color: "{form.field.float.label.color}",
        active: {
            fontSize: "var(--sc-font-size-100)",
            fontWeight: "400"
        },
        positionX: "{form.field.padding.x}",
        positionY: "{form.field.padding.y}",
        focusColor: "{form.field.float.label.focus.color}",
        fontWeight: "500",
        activeColor: "{form.field.float.label.active.color}",
        invalidColor: "{form.field.float.label.invalid.color}",
        transitionDuration: "{form.field.transition.duration}"
    }
} satisfies FloatLabelDesignTokens;