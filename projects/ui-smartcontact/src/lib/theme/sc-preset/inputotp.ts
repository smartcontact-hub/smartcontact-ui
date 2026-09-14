import type { InputOtpDesignTokens } from '@primeuix/themes/types/inputotp';

 export default {
    root: {
        gap: "var(--sc-cmp-inputotp-gap)"
    },
    input: {
        lg: {
            width: "var(--sc-cmp-inputotp-input-lg-width)"
        },
        sm: {
            width: "var(--sc-cmp-inputotp-input-sm-width)"
        },
        width: "var(--sc-cmp-inputotp-input-width)"
    }
} satisfies InputOtpDesignTokens;