import type { RatingDesignTokens } from '@primeuix/themes/types/rating';

 export default {
    icon: {
        size: "var(--sc-cmp-rating-icon-size)",
        color: "{text.muted.color}",
        hoverColor: "{primary.color}",
        activeColor: "{primary.color}"
    },
    root: {
        gap: "var(--sc-cmp-rating-gap)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        transitionDuration: "{transition.duration}"
    }
} satisfies RatingDesignTokens;