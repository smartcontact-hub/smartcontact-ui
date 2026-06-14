import type { TerminalDesignTokens } from '@primeuix/themes/types/terminal';

 export default {
    root: {
        color: "{form.field.color}",
        height: "18rem",
        padding: "{form.field.padding.y} {form.field.padding.x}",
        background: "{form.field.background}",
        borderColor: "{form.field.border.color}",
        borderRadius: "{form.field.border.radius}"
    },
    prompt: {
        gap: "0.25rem"
    },
    commandResponse: {
        margin: "2px 0"
    }
} satisfies TerminalDesignTokens;