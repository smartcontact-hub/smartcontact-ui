import type { InputNumberDesignTokens } from '@primeuix/themes/types/inputnumber';

 export default {
    root: {
        transitionDuration: "{transition.duration}"
    },
    button: {
        width: "2.5rem",
        borderRadius: "{form.field.border.radius}",
        verticalPadding: "{form.field.padding.y}"
    },
    colorScheme: {
        dark: {
            button: {
                color: "{surface.400}",
                background: "#00000000",
                hoverColor: "{surface.300}",
                activeColor: "{surface.200}",
                borderColor: "{form.field.border.color}",
                hoverBackground: "{surface.800}",
                activeBackground: "{surface.700}",
                hoverBorderColor: "{form.field.border.color}",
                activeBorderColor: "{form.field.border.color}"
            }
        },
        light: {
            button: {
                color: "{surface.400}",
                background: "#00000000",
                hoverColor: "{surface.500}",
                activeColor: "{surface.600}",
                borderColor: "{form.field.border.color}",
                hoverBackground: "{surface.100}",
                activeBackground: "{surface.200}",
                hoverBorderColor: "{form.field.border.color}",
                activeBorderColor: "{form.field.border.color}"
            }
        }
    }
} satisfies InputNumberDesignTokens;