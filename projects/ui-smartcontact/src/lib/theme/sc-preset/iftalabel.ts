import type { IftaLabelDesignTokens } from '@primeuix/themes/types/iftalabel';

 export default {
    root: {
        top: "{form.field.padding.y}",
        color: "{form.field.float.label.color}",
        fontSize: "var(--sc-scale-0-75)",
        positionX: "{form.field.padding.x}",
        focusColor: "{form.field.float.label.focus.color}",
        fontWeight: "400",
        invalidColor: "{form.field.float.label.invalid.color}",
        transitionDuration: "{form.field.transition.duration}"
    },
    input: {
        paddingTop: "var(--sc-scale-1-5)",
        paddingBottom: "{form.field.padding.y}"
    }
} satisfies IftaLabelDesignTokens;