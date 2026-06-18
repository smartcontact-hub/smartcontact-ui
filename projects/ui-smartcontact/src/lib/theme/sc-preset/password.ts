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
        shadow: "var(--sc-cmp-password-overlay-shadow)",
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