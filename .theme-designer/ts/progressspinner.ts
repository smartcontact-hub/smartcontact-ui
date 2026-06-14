import type { ProgressSpinnerDesignTokens } from '@primeuix/themes/types/progressspinner';

 export default {
    colorScheme: {
        dark: {
            root: {
                colorOne: "{red.400}",
                colorTwo: "{blue.400}",
                colorFour: "{yellow.400}",
                colorThree: "{green.400}"
            }
        },
        light: {
            root: {
                colorOne: "{red.500}",
                colorTwo: "{blue.500}",
                colorFour: "{yellow.500}",
                colorThree: "{green.500}"
            }
        }
    }
} satisfies ProgressSpinnerDesignTokens;