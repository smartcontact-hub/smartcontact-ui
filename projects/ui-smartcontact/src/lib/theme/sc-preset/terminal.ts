import type { TerminalDesignTokens } from '@primeuix/themes/types/terminal';

 export default {
    root: {
        color: "{form.field.color}",
        height: "var(--sc-cmp-terminal-height)",
        padding: "{form.field.padding.y} {form.field.padding.x}",
        background: "{form.field.background}",
        borderColor: "{form.field.border.color}",
        borderRadius: "{form.field.border.radius}"
    },
    prompt: {
        gap: "var(--sc-cmp-terminal-prompt-gap)"
    },
    commandResponse: {
        margin: "0.142857rem 0"
    }
} satisfies TerminalDesignTokens;