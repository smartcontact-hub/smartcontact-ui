import type { InputNumberDesignTokens } from '@primeuix/themes/types/inputnumber';

 export default {
    root: {
        transitionDuration: "{transition.duration}"
    },
    button: {
        width: "var(--sc-scale-2-5)",
        borderRadius: "{form.field.border.radius}",
        verticalPadding: "{form.field.padding.y}"
    },
    colorScheme: {
        dark: {
            button: {
                color: "{surface.400}",
                background: "var(--sc-cmp-inputnumber-button-background)",
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
                color: "var(--sc-cmp-inputnumber-button-color)",
                background: "var(--sc-cmp-inputnumber-button-background)",
                hoverColor: "var(--sc-cmp-inputnumber-button-hover-color)",
                activeColor: "var(--sc-cmp-inputnumber-button-active-color)",
                borderColor: "{form.field.border.color}",
                hoverBackground: "var(--sc-cmp-inputnumber-button-hover-background)",
                activeBackground: "var(--sc-cmp-inputnumber-button-active-background)",
                hoverBorderColor: "{form.field.border.color}",
                activeBorderColor: "{form.field.border.color}"
            }
        }
    }
} satisfies InputNumberDesignTokens;