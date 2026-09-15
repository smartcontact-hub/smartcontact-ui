import type { ProgressSpinnerDesignTokens } from '@primeuix/themes/types/progressspinner';

 export default {
    colorScheme: {
        dark: {
            root: {
                colorOne: "var(--sc-cmp-progressspinner-color-one)",
                colorTwo: "var(--sc-cmp-progressspinner-color-two)",
                colorFour: "var(--sc-cmp-progressspinner-color-four)",
                colorThree: "var(--sc-cmp-progressspinner-color-three)"
            }
        },
        light: {
            root: {
                colorOne: "var(--sc-cmp-progressspinner-color-one)",
                colorTwo: "var(--sc-cmp-progressspinner-color-two)",
                colorFour: "var(--sc-cmp-progressspinner-color-four)",
                colorThree: "var(--sc-cmp-progressspinner-color-three)"
            }
        }
    }
} satisfies ProgressSpinnerDesignTokens;