import type { PasswordDesignTokens } from '@primeuix/themes/types/password';

 export default {
    icon: {
        color: "{form.field.icon.color}"
    },
    meter: {
        height: "var(--sc-scale-0-75)",
        background: "{content.border.color}",
        borderRadius: "{content.border.radius}"
    },
    content: {
        gap: "var(--sc-scale-0-5)"
    },
    overlay: {
        color: "{overlay.popover.color}",
        shadow: "0 0.142857rem 0.285714rem -0.142857rem #0000001a, 0 0.285714rem 0.428571rem -0.071429rem #0000001a",
        padding: "{overlay.popover.padding}",
        background: "{overlay.popover.background}",
        borderColor: "{overlay.popover.border.color}",
        borderRadius: "{overlay.popover.border.radius}"
    },
    colorScheme: {
        dark: {
            strength: {
                weakBackground: "var(--sc-cmp-password-strength-weak-background)",
                mediumBackground: "var(--sc-cmp-password-strength-medium-background)",
                strongBackground: "var(--sc-cmp-password-strength-strong-background)"
            }
        },
        light: {
            strength: {
                weakBackground: "var(--sc-cmp-password-strength-weak-background)",
                mediumBackground: "var(--sc-cmp-password-strength-medium-background)",
                strongBackground: "var(--sc-cmp-password-strength-strong-background)"
            }
        }
    }
} satisfies PasswordDesignTokens;