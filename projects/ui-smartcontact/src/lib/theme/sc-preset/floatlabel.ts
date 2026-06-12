import type { FloatLabelDesignTokens } from '@primeuix/themes/types/floatlabel';

 export default {
    in: {
        input: {
            paddingTop: "1.5rem",
            paddingBottom: "{form.field.padding.y}"
        },
        active: {
            top: "{form.field.padding.y}"
        }
    },
    on: {
        active: {
            padding: "0 0.125rem",
            background: "{form.field.background}"
        },
        borderRadius: "{border.radius.xs}"
    },
    over: {
        active: {
            top: "-1.25rem"
        }
    },
    root: {
        color: "{form.field.float.label.color}",
        active: {
            fontSize: "0.75rem",
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