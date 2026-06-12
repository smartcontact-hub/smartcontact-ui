import type { IftaLabelDesignTokens } from '@primeuix/themes/types/iftalabel';

 export default {
    root: {
        top: "{form.field.padding.y}",
        color: "{form.field.float.label.color}",
        fontSize: "0.75rem",
        positionX: "{form.field.padding.x}",
        focusColor: "{form.field.float.label.focus.color}",
        fontWeight: "400",
        invalidColor: "{form.field.float.label.invalid.color}",
        transitionDuration: "{form.field.transition.duration}"
    },
    input: {
        paddingTop: "1.5rem",
        paddingBottom: "{form.field.padding.y}"
    }
} satisfies IftaLabelDesignTokens;