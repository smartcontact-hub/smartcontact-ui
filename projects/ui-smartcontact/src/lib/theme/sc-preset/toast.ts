import type { ToastDesignTokens } from '@primeuix/themes/types/toast';

 export default {
    icon: {
        size: "var(--sc-scale-1-125)"
    },
    info: {
        shadow: "var(--sc-cmp-toast-info-shadow)",
        closeButton: {
            focusRing: {
                shadow: "none"
            }
        }
    },
    root: {
        width: "var(--sc-scale-25)",
        borderWidth: "0.071429rem",
        borderRadius: "{content.border.radius}",
        transitionDuration: "{transition.duration}"
    },
    text: {
        gap: "var(--sc-scale-0-5)"
    },
    warn: {
        shadow: "var(--sc-cmp-toast-warn-shadow)",
        closeButton: {
            focusRing: {
                shadow: "none"
            }
        }
    },
    error: {
        shadow: "var(--sc-cmp-toast-error-shadow)",
        closeButton: {
            focusRing: {
                shadow: "none"
            }
        }
    },
    detail: {
        fontSize: "var(--sc-font-size-100)",
        fontWeight: "500"
    },
    content: {
        gap: "var(--sc-scale-0-5)",
        padding: "{overlay.popover.padding}"
    },
    success: {
        shadow: "var(--sc-cmp-toast-success-shadow)",
        closeButton: {
            focusRing: {
                shadow: "none"
            }
        }
    },
    summary: {
        fontSize: "var(--sc-scale-1)",
        fontWeight: "500"
    },
    contrast: {
        shadow: "var(--sc-cmp-toast-contrast-shadow)",
        closeButton: {
            focusRing: {
                shadow: "none"
            }
        }
    },
    closeIcon: {
        size: "var(--sc-scale-1)"
    },
    secondary: {
        shadow: "var(--sc-cmp-toast-secondary-shadow)",
        closeButton: {
            focusRing: {
                shadow: "none"
            }
        }
    },
    closeButton: {
        width: "var(--sc-scale-1-75)",
        height: "var(--sc-scale-1-75)",
        focusRing: {
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}"
        },
        borderRadius: "var(--sc-scale-0-875)"
    },
    colorScheme: {
        dark: {
            info: {
                color: "var(--sc-cmp-toast-info-color)",
                background: "var(--sc-cmp-toast-info-background)",
                borderColor: "var(--sc-cmp-toast-info-border-color)",
                closeButton: {
                    focusRing: {
                        color: "var(--sc-cmp-toast-info-close-button-focus-ring-color)"
                    },
                    hoverBackground: "var(--sc-cmp-toast-info-close-button-hover-background)"
                },
                detailColor: "var(--sc-cmp-toast-info-detail-color)"
            },
            root: {
                blur: "0.714286rem"
            },
            warn: {
                color: "{yellow.500}",
                background: "var(--sc-cmp-toast-warn-background)",
                borderColor: "var(--sc-cmp-toast-warn-border-color)",
                closeButton: {
                    focusRing: {
                        color: "{yellow.500}"
                    },
                    hoverBackground: "var(--sc-cmp-toast-warn-close-button-hover-background)"
                },
                detailColor: "var(--sc-cmp-toast-warn-detail-color)"
            },
            error: {
                color: "var(--sc-cmp-toast-error-color)",
                background: "var(--sc-cmp-toast-error-background)",
                borderColor: "var(--sc-cmp-toast-error-border-color)",
                closeButton: {
                    focusRing: {
                        color: "var(--sc-cmp-toast-error-close-button-focus-ring-color)"
                    },
                    hoverBackground: "var(--sc-cmp-toast-error-close-button-hover-background)"
                },
                detailColor: "var(--sc-cmp-toast-error-detail-color)"
            },
            success: {
                color: "var(--sc-cmp-toast-success-color)",
                background: "var(--sc-cmp-toast-success-background)",
                borderColor: "var(--sc-cmp-toast-success-border-color)",
                closeButton: {
                    focusRing: {
                        color: "var(--sc-cmp-toast-success-close-button-focus-ring-color)"
                    },
                    hoverBackground: "var(--sc-cmp-toast-success-close-button-hover-background)"
                },
                detailColor: "var(--sc-cmp-toast-success-detail-color)"
            },
            contrast: {
                color: "{surface.950}",
                background: "var(--sc-cmp-toast-contrast-background)",
                borderColor: "{surface.100}",
                closeButton: {
                    focusRing: {
                        color: "{surface.950}"
                    },
                    hoverBackground: "{surface.100}"
                },
                detailColor: "{surface.950}"
            },
            secondary: {
                color: "{surface.300}",
                background: "{surface.800}",
                borderColor: "{surface.700}",
                closeButton: {
                    focusRing: {
                        color: "{surface.300}"
                    },
                    hoverBackground: "{surface.700}"
                },
                detailColor: "var(--sc-cmp-toast-secondary-detail-color)"
            }
        },
        light: {
            info: {
                color: "var(--sc-cmp-toast-info-color)",
                background: "var(--sc-cmp-toast-info-background)",
                borderColor: "var(--sc-cmp-toast-info-border-color)",
                closeButton: {
                    focusRing: {
                        color: "var(--sc-cmp-toast-info-close-button-focus-ring-color)"
                    },
                    hoverBackground: "var(--sc-cmp-toast-info-close-button-hover-background)"
                },
                detailColor: "var(--sc-cmp-toast-info-detail-color)"
            },
            root: {
                blur: "0.107143rem"
            },
            warn: {
                color: "{yellow.600}",
                background: "var(--sc-cmp-toast-warn-background)",
                borderColor: "{yellow.200}",
                closeButton: {
                    focusRing: {
                        color: "{yellow.600}"
                    },
                    hoverBackground: "{yellow.100}"
                },
                detailColor: "var(--sc-cmp-toast-warn-detail-color)"
            },
            error: {
                color: "var(--sc-cmp-toast-error-color)",
                background: "var(--sc-cmp-toast-error-background)",
                borderColor: "var(--sc-cmp-toast-error-border-color)",
                closeButton: {
                    focusRing: {
                        color: "var(--sc-cmp-toast-error-close-button-focus-ring-color)"
                    },
                    hoverBackground: "var(--sc-cmp-toast-error-close-button-hover-background)"
                },
                detailColor: "var(--sc-cmp-toast-error-detail-color)"
            },
            success: {
                color: "var(--sc-cmp-toast-success-color)",
                background: "var(--sc-cmp-toast-success-background)",
                borderColor: "var(--sc-cmp-toast-success-border-color)",
                closeButton: {
                    focusRing: {
                        color: "var(--sc-cmp-toast-success-close-button-focus-ring-color)"
                    },
                    hoverBackground: "var(--sc-cmp-toast-success-close-button-hover-background)"
                },
                detailColor: "var(--sc-cmp-toast-success-detail-color)"
            },
            contrast: {
                color: "var(--sc-cmp-toast-contrast-color)",
                background: "var(--sc-cmp-toast-contrast-background)",
                borderColor: "var(--sc-cmp-toast-contrast-border-color)",
                closeButton: {
                    focusRing: {
                        color: "var(--sc-cmp-toast-contrast-close-button-focus-ring-color)"
                    },
                    hoverBackground: "var(--sc-cmp-toast-contrast-close-button-hover-background)"
                },
                detailColor: "var(--sc-cmp-toast-contrast-detail-color)"
            },
            secondary: {
                color: "var(--sc-cmp-toast-secondary-color)",
                background: "var(--sc-cmp-toast-secondary-background)",
                borderColor: "var(--sc-cmp-toast-secondary-border-color)",
                closeButton: {
                    focusRing: {
                        color: "var(--sc-cmp-toast-secondary-close-button-focus-ring-color)"
                    },
                    hoverBackground: "var(--sc-cmp-toast-secondary-close-button-hover-background)"
                },
                detailColor: "var(--sc-cmp-toast-secondary-detail-color)"
            }
        }
    }
} satisfies ToastDesignTokens;