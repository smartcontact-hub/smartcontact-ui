import type { PasswordDesignTokens } from '@primeuix/themes/types/password';

 export default {
    icon: {
        color: "{form.field.icon.color}"
    },
    meter: {
        height: "0.75rem",
        background: "{content.border.color}",
        borderRadius: "{content.border.radius}"
    },
    content: {
        gap: "0.5rem"
    },
    overlay: {
        color: "{overlay.popover.color}",
        shadow: "0 2px 4px -2px #0000001a, 0 4px 6px -1px #0000001a",
        padding: "{overlay.popover.padding}",
        background: "{overlay.popover.background}",
        borderColor: "{overlay.popover.border.color}",
        borderRadius: "{overlay.popover.border.radius}"
    },
    colorScheme: {
        dark: {
            strength: {
                weakBackground: "{red.400}",
                mediumBackground: "{amber.400}",
                strongBackground: "{green.400}"
            }
        },
        light: {
            strength: {
                weakBackground: "{red.500}",
                mediumBackground: "{amber.500}",
                strongBackground: "{green.500}"
            }
        }
    }
} satisfies PasswordDesignTokens;