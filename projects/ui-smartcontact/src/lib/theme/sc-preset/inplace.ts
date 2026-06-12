import type { InplaceDesignTokens } from '@primeuix/themes/types/inplace';

 export default {
    root: {
        padding: "{form.field.padding.y} {form.field.padding.x}",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        borderRadius: "{content.border.radius}",
        transitionDuration: "{transition.duration}"
    },
    display: {
        hoverColor: "{content.hover.color}",
        hoverBackground: "{content.hover.background}"
    }
} satisfies InplaceDesignTokens;