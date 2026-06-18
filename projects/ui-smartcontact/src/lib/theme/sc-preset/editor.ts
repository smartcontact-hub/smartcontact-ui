import type { EditorDesignTokens } from '@primeuix/themes/types/editor';

 export default {
    content: {
        color: "{content.color}",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}"
    },
    overlay: {
        color: "{overlay.select.color}",
        shadow: "var(--sc-cmp-editor-overlay-shadow)",
        padding: "{list.padding}",
        background: "{overlay.select.background}",
        borderColor: "{overlay.select.border.color}",
        borderRadius: "{overlay.select.border.radius}"
    },
    toolbar: {
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}"
    },
    toolbarItem: {
        color: "{text.muted.color}",
        hoverColor: "{text.color}",
        activeColor: "{primary.color}"
    },
    overlayOption: {
        color: "{list.option.color}",
        padding: "{list.option.padding}",
        focusColor: "{list.option.focus.color}",
        borderRadius: "{list.option.border.radius}",
        focusBackground: "{list.option.focus.background}"
    }
} satisfies EditorDesignTokens;