export default {
    root: {
        color: "{form.field.float.label.color}",
        focusColor: "{form.field.float.label.focus.color}",
        activeColor: "{form.field.float.label.active.color}",
        invalidColor: "{form.field.float.label.invalid.color}",
        transitionDuration: "{form.field.transition.duration}",
        positionX: "{form.field.padding.x}",
        positionY: "{form.field.padding.y}",
        fontWeight: "{primitive.typography.font.weight.medium}",
        active: {
            fontSize: "{primitive.typography.font.size.100}",
            fontWeight: "{primitive.typography.font.weight.regular}"
        }
    },
    over: {
        active: {
            top: "-1.25rem"
        }
    },
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
        borderRadius: "{border.radius.xs}",
        active: {
            background: "{form.field.background}",
            padding: "0 0.125rem"
        }
    }
}