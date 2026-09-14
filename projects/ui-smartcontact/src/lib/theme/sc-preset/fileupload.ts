import type { FileUploadDesignTokens } from '@primeuix/themes/types/fileupload';

 export default {
    file: {
        gap: "var(--sc-cmp-fileupload-file-gap)",
        info: {
            gap: "var(--sc-cmp-fileupload-file-info-gap)"
        },
        padding: "var(--sc-cmp-fileupload-file-padding)",
        borderColor: "{content.border.color}"
    },
    root: {
        color: "{content.color}",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}",
        transitionDuration: "{transition.duration}"
    },
    basic: {
        gap: "var(--sc-cmp-fileupload-basic-gap)"
    },
    header: {
        gap: "var(--sc-cmp-fileupload-header-gap)",
        color: "{text.color}",
        padding: "var(--sc-cmp-fileupload-header-padding)",
        background: "#00000000",
        borderColor: "#00000000",
        borderWidth: "0",
        borderRadius: "0"
    },
    content: {
        gap: "var(--sc-cmp-fileupload-content-gap)",
        padding: "var(--sc-cmp-fileupload-content-padding-top) var(--sc-cmp-fileupload-content-padding-right) var(--sc-cmp-fileupload-content-padding-bottom) var(--sc-cmp-fileupload-content-padding-left)",
        highlightBorderColor: "{primary.color}"
    },
    fileList: {
        gap: "var(--sc-cmp-fileupload-file-list-gap)"
    },
    progressbar: {
        height: "var(--sc-cmp-fileupload-progressbar-height)"
    }
} satisfies FileUploadDesignTokens;