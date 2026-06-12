import type { ToastDesignTokens } from '@primeuix/themes/types/toast';

 export default {
    icon: {
        size: "1.125rem"
    },
    info: {
        shadow: "0 0.285714rem 0.571429rem 0 #02050a0a",
        closeButton: {
            focusRing: {
                shadow: "none"
            }
        }
    },
    root: {
        width: "25rem",
        borderWidth: "0.071429rem",
        borderRadius: "{content.border.radius}",
        transitionDuration: "{transition.duration}"
    },
    text: {
        gap: "0.5rem"
    },
    warn: {
        shadow: "0 0.285714rem 0.571429rem 0 #0907000a",
        closeButton: {
            focusRing: {
                shadow: "none"
            }
        }
    },
    error: {
        shadow: "0 0.285714rem 0.571429rem 0 #0a03030a",
        closeButton: {
            focusRing: {
                shadow: "none"
            }
        }
    },
    detail: {
        fontSize: "0.875rem",
        fontWeight: "500"
    },
    content: {
        gap: "0.5rem",
        padding: "{overlay.popover.padding}"
    },
    success: {
        shadow: "0 0.285714rem 0.571429rem 0 #0108040a",
        closeButton: {
            focusRing: {
                shadow: "none"
            }
        }
    },
    summary: {
        fontSize: "1rem",
        fontWeight: "500"
    },
    contrast: {
        shadow: "0 0.285714rem 0.571429rem 0 #0000010a",
        closeButton: {
            focusRing: {
                shadow: "none"
            }
        }
    },
    closeIcon: {
        size: "1rem"
    },
    secondary: {
        shadow: "0 0.285714rem 0.571429rem 0 #0405060a",
        closeButton: {
            focusRing: {
                shadow: "none"
            }
        }
    },
    closeButton: {
        width: "1.75rem",
        height: "1.75rem",
        focusRing: {
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}"
        },
        borderRadius: "0.875rem"
    },
    colorScheme: {
        dark: {
            info: {
                color: "{blue.500}",
                background: "#3b82f629",
                borderColor: "#1d4ed85c",
                closeButton: {
                    focusRing: {
                        color: "{blue.500}"
                    },
                    hoverBackground: "#ffffff0d"
                },
                detailColor: "{surface.0}"
            },
            root: {
                blur: "0.714286rem"
            },
            warn: {
                color: "{yellow.500}",
                background: "#eab30829",
                borderColor: "#a162075c",
                closeButton: {
                    focusRing: {
                        color: "{yellow.500}"
                    },
                    hoverBackground: "#ffffff0d"
                },
                detailColor: "{surface.0}"
            },
            error: {
                color: "{red.500}",
                background: "#ef444429",
                borderColor: "#b91c1c5c",
                closeButton: {
                    focusRing: {
                        color: "{red.500}"
                    },
                    hoverBackground: "#ffffff0d"
                },
                detailColor: "{surface.0}"
            },
            success: {
                color: "{green.500}",
                background: "#22c55e29",
                borderColor: "#15803d5c",
                closeButton: {
                    focusRing: {
                        color: "{green.500}"
                    },
                    hoverBackground: "#ffffff0d"
                },
                detailColor: "{surface.0}"
            },
            contrast: {
                color: "{surface.950}",
                background: "{surface.0}",
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
                detailColor: "{surface.0}"
            }
        },
        light: {
            info: {
                color: "{blue.600}",
                background: "#eff6fff2",
                borderColor: "{blue.200}",
                closeButton: {
                    focusRing: {
                        color: "{blue.600}"
                    },
                    hoverBackground: "{blue.100}"
                },
                detailColor: "{surface.700}"
            },
            root: {
                blur: "0.107143rem"
            },
            warn: {
                color: "{yellow.600}",
                background: "#fefce8f2",
                borderColor: "{yellow.200}",
                closeButton: {
                    focusRing: {
                        color: "{yellow.600}"
                    },
                    hoverBackground: "{yellow.100}"
                },
                detailColor: "{surface.700}"
            },
            error: {
                color: "{red.600}",
                background: "#fef2f2f2",
                borderColor: "{red.200}",
                closeButton: {
                    focusRing: {
                        color: "{red.600}"
                    },
                    hoverBackground: "{red.100}"
                },
                detailColor: "{surface.700}"
            },
            success: {
                color: "{green.600}",
                background: "#f0fdf4f2",
                borderColor: "{green.200}",
                closeButton: {
                    focusRing: {
                        color: "{green.600}"
                    },
                    hoverBackground: "{green.100}"
                },
                detailColor: "{surface.700}"
            },
            contrast: {
                color: "{surface.50}",
                background: "{surface.900}",
                borderColor: "{surface.950}",
                closeButton: {
                    focusRing: {
                        color: "{surface.50}"
                    },
                    hoverBackground: "{surface.800}"
                },
                detailColor: "{surface.0}"
            },
            secondary: {
                color: "{surface.600}",
                background: "{surface.100}",
                borderColor: "{surface.200}",
                closeButton: {
                    focusRing: {
                        color: "{surface.600}"
                    },
                    hoverBackground: "{surface.200}"
                },
                detailColor: "{surface.700}"
            }
        }
    }
} satisfies ToastDesignTokens;