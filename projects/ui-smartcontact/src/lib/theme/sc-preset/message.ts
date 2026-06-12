import type { MessageDesignTokens } from '@primeuix/themes/types/message';

 export default {
    icon: {
        lg: {
            size: "1.25rem"
        },
        sm: {
            size: "1rem"
        },
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
        borderWidth: "0.071429rem",
        borderRadius: "{content.border.radius}",
        transitionDuration: "{transition.duration}"
    },
    text: {
        lg: {
            fontSize: "1.125rem"
        },
        sm: {
            fontSize: "0.875rem"
        },
        fontSize: "1rem",
        fontWeight: "500"
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
    simple: {
        content: {
            padding: "0"
        }
    },
    content: {
        lg: {
            padding: "0.625rem 0.875rem"
        },
        sm: {
            padding: "0.375rem 0.625rem"
        },
        gap: "0.5rem",
        padding: "0.5rem 0.75rem"
    },
    success: {
        shadow: "0 0.285714rem 0.571429rem 0 #0108040a",
        closeButton: {
            focusRing: {
                shadow: "none"
            }
        }
    },
    contrast: {
        shadow: "0 0.285714rem 0.571429rem 0 #0000010a",
        closeButton: {
            focusRing: {
                shadow: "none"
            }
        }
    },
    outlined: {
        root: {
            borderWidth: "0.071429rem"
        }
    },
    closeIcon: {
        lg: {
            size: "1.125rem"
        },
        sm: {
            size: "0.875rem"
        },
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
                simple: {
                    color: "{blue.500}"
                },
                outlined: {
                    color: "{blue.500}",
                    borderColor: "{blue.500}"
                },
                background: "#3b82f629",
                borderColor: "#1d4ed85c",
                closeButton: {
                    focusRing: {
                        color: "{blue.500}"
                    },
                    hoverBackground: "#ffffff0d"
                }
            },
            warn: {
                color: "{yellow.500}",
                simple: {
                    color: "{yellow.500}"
                },
                outlined: {
                    color: "{yellow.500}",
                    borderColor: "{yellow.500}"
                },
                background: "#eab30829",
                borderColor: "#a162075c",
                closeButton: {
                    focusRing: {
                        color: "{yellow.500}"
                    },
                    hoverBackground: "#ffffff0d"
                }
            },
            error: {
                color: "{red.500}",
                simple: {
                    color: "{red.500}"
                },
                outlined: {
                    color: "{red.500}",
                    borderColor: "{red.500}"
                },
                background: "#ef444429",
                borderColor: "#b91c1c5c",
                closeButton: {
                    focusRing: {
                        color: "{red.500}"
                    },
                    hoverBackground: "#ffffff0d"
                }
            },
            success: {
                color: "{green.500}",
                simple: {
                    color: "{green.500}"
                },
                outlined: {
                    color: "{green.500}",
                    borderColor: "{green.500}"
                },
                background: "#22c55e29",
                borderColor: "#15803d5c",
                closeButton: {
                    focusRing: {
                        color: "{green.500}"
                    },
                    hoverBackground: "#ffffff0d"
                }
            },
            contrast: {
                color: "{surface.950}",
                simple: {
                    color: "{surface.0}"
                },
                outlined: {
                    color: "{surface.0}",
                    borderColor: "{surface.0}"
                },
                background: "{surface.0}",
                borderColor: "{surface.100}",
                closeButton: {
                    focusRing: {
                        color: "{surface.950}"
                    },
                    hoverBackground: "{surface.100}"
                }
            },
            secondary: {
                color: "{surface.300}",
                simple: {
                    color: "{surface.400}"
                },
                outlined: {
                    color: "{surface.400}",
                    borderColor: "{surface.400}"
                },
                background: "{surface.800}",
                borderColor: "{surface.700}",
                closeButton: {
                    focusRing: {
                        color: "{surface.300}"
                    },
                    hoverBackground: "{surface.700}"
                }
            }
        },
        light: {
            info: {
                color: "{blue.600}",
                simple: {
                    color: "{blue.600}"
                },
                outlined: {
                    color: "{blue.600}",
                    borderColor: "{blue.600}"
                },
                background: "#eff6fff2",
                borderColor: "{blue.200}",
                closeButton: {
                    focusRing: {
                        color: "{blue.600}"
                    },
                    hoverBackground: "{blue.100}"
                }
            },
            warn: {
                color: "{yellow.600}",
                simple: {
                    color: "{yellow.600}"
                },
                outlined: {
                    color: "{yellow.600}",
                    borderColor: "{yellow.600}"
                },
                background: "#fefce8f2",
                borderColor: "{yellow.200}",
                closeButton: {
                    focusRing: {
                        color: "{yellow.600}"
                    },
                    hoverBackground: "{yellow.100}"
                }
            },
            error: {
                color: "{red.600}",
                simple: {
                    color: "{red.600}"
                },
                outlined: {
                    color: "{red.600}",
                    borderColor: "{red.600}"
                },
                background: "#fef2f2f2",
                borderColor: "{red.200}",
                closeButton: {
                    focusRing: {
                        color: "{red.600}"
                    },
                    hoverBackground: "{red.100}"
                }
            },
            success: {
                color: "{green.600}",
                simple: {
                    color: "{green.600}"
                },
                outlined: {
                    color: "{green.600}",
                    borderColor: "{green.600}"
                },
                background: "#f0fdf4f2",
                borderColor: "{green.200}",
                closeButton: {
                    focusRing: {
                        color: "{green.600}"
                    },
                    hoverBackground: "{green.100}"
                }
            },
            contrast: {
                color: "{surface.50}",
                simple: {
                    color: "{surface.950}"
                },
                outlined: {
                    color: "{surface.950}",
                    borderColor: "{surface.950}"
                },
                background: "{surface.900}",
                borderColor: "{surface.950}",
                closeButton: {
                    focusRing: {
                        color: "{surface.50}"
                    },
                    hoverBackground: "{surface.800}"
                }
            },
            secondary: {
                color: "{surface.600}",
                simple: {
                    color: "{surface.500}"
                },
                outlined: {
                    color: "{surface.500}",
                    borderColor: "{surface.500}"
                },
                background: "{surface.100}",
                borderColor: "{surface.200}",
                closeButton: {
                    focusRing: {
                        color: "{surface.600}"
                    },
                    hoverBackground: "{surface.200}"
                }
            }
        }
    }
} satisfies MessageDesignTokens;