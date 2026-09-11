import type { IftaLabelDesignTokens } from '@primeuix/themes/types/iftalabel';

 export default {
    root: {
        color: "{form.field.float.label.color}",
        focusColor: "{form.field.float.label.focus.color}",
        invalidColor: "{form.field.float.label.invalid.color}",
        transitionDuration: "{form.field.transition.duration}",
        positionX: "{form.field.padding.x}",
        top: "{form.field.padding.y}",
        fontSize: "{primitive.typography.font.size.100}",
        fontWeight: "{primitive.typography.font.weight.regular}"
    },
    input: {
        paddingTop: "1.5rem",
        paddingBottom: "{form.field.padding.y}"
    }
} satisfies IftaLabelDesignTokens;