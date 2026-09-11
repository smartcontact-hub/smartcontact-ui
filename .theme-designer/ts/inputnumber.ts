import type { InputNumberDesignTokens } from '@primeuix/themes/types/inputnumber';

 export default {
    root: {
        transitionDuration: "{transition.duration}"
    },
    button: {
        background: "#00000000",
        hoverBackground: "light-dark({surface.100}, {surface.800})",
        activeBackground: "light-dark({surface.200}, {surface.700})",
        borderColor: "{form.field.border.color}",
        hoverBorderColor: "{form.field.border.color}",
        activeBorderColor: "{form.field.border.color}",
        color: "{surface.400}",
        hoverColor: "light-dark({surface.500}, {surface.300})",
        activeColor: "light-dark({surface.600}, {surface.200})",
        width: "2.5rem",
        borderRadius: "{form.field.border.radius}",
        verticalPadding: "{form.field.padding.y}"
    }
} satisfies InputNumberDesignTokens;