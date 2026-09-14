import type { InputGroupDesignTokens } from '@primeuix/themes/types/inputgroup';

 export default {
    addon: {
        color: "{form.field.icon.color}",
        padding: "var(--sc-cmp-inputgroup-addon-padding)",
        minWidth: "var(--sc-cmp-inputgroup-addon-min-width)",
        background: "{form.field.background}",
        borderColor: "{form.field.border.color}",
        borderRadius: "{form.field.border.radius}"
    }
} satisfies InputGroupDesignTokens;