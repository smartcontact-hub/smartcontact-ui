import type { TerminalDesignTokens } from '@primeuix/themes/types/terminal';

 export default {
    root: {
        color: "{form.field.color}",
        height: "var(--sc-scale-18)",
        padding: "{form.field.padding.y} {form.field.padding.x}",
        background: "{form.field.background}",
        borderColor: "{form.field.border.color}",
        borderRadius: "{form.field.border.radius}"
    },
    prompt: {
        gap: "var(--sc-scale-0-25)"
    },
    commandResponse: {
        margin: "0.142857rem 0"
    }
} satisfies TerminalDesignTokens;