import type { SelectButtonDesignTokens } from '@primeuix/themes/types/selectbutton';

 export default {
    root: {
        borderRadius: "{form.field.border.radius}"
    },
    colorScheme: {
        dark: {
            root: {
                invalidBorderColor: "{form.field.invalid.border.color}"
            }
        },
        light: {
            root: {
                invalidBorderColor: "{form.field.invalid.border.color}"
            }
        }
    }
} satisfies SelectButtonDesignTokens;