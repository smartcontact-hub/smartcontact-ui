/**
 * Base del preset — primitivos + semántica.
 *
 * Cada valor apunta a los tokens `--sc-*` de @smartcontact-hub/styles (la única
 * fuente de verdad). Aquí no se escribe ningún color en hex ni ninguna métrica
 * en px: el preset REDIRIGE (`--p-*` → `var(--sc-*)`), no declara.
 *
 * Mapa de familias (verificado por valor contra el export del Kit):
 *   sky    → --sc-color-electric-blue-*  (el Kit ya trae sky = electric blue)
 *   slate  → --sc-color-gray-*           (gris de marca SC)
 *   orange → --sc-color-amber-*          (warn de marca = amber; la familia
 *            --sc-color-orange-* de la paleta de labels no pasa por aquí)
 *   yellow → --sc-color-amber-*          (ídem: severities warn de toast/message)
 *   zinc   → --sc-color-zinc-*           (surface dark del Kit, bloque generado)
 *
 * Solo se declaran las familias primitivas que el preset referencia: los
 * consumidores usan `--sc-*`, nunca `--p-*` (regla del guard), así que la
 * superficie `--p-<familia>-*` no es contrato público.
 *
 * El modo oscuro vive en la capa 7 de tokens (`.sc-dark` redeclara los
 * `--sc-*`): el colorScheme.dark referencia los MISMOS tokens semánticos que
 * light y hereda el flip. Solo `highlight` (sin token semántico propio)
 * declara receta propia vía color-mix sobre primitivos.
 */

const families = {
  red: 'red',
  sky: 'electric-blue',
  blue: 'blue',
  slate: 'gray',
  zinc: 'zinc',
  amber: 'amber',
  green: 'green',
  purple: 'purple',
  orange: 'amber',
  yellow: 'amber',
} as const;

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

const ramp = (scToken: string) =>
  Object.fromEntries(STEPS.map((step) => [step, `var(--sc-color-${scToken}-${step})`]));

const surface = {
  0: 'var(--sc-color-gray-0)',
  ...ramp('gray'),
};

/** Bloques compartidos light/dark: el flip lo hace la capa 7 (`.sc-dark`). */
const primaryScheme = {
  color: 'var(--sc-bg-primary)',
  contrastColor: 'var(--sc-text-on-primary)',
  hoverColor: 'var(--sc-bg-primary-hover)',
  activeColor: 'var(--sc-bg-primary-active)',
};

const textScheme = {
  color: 'var(--sc-text-primary)',
  hoverColor: 'var(--sc-text-primary)',
  mutedColor: 'var(--sc-text-secondary)',
  hoverMutedColor: 'var(--sc-text-primary)',
};

const contentScheme = {
  background: 'var(--sc-bg-surface)',
  hoverBackground: 'var(--sc-bg-secondary-hover)',
  borderColor: 'var(--sc-border-default)',
  color: 'var(--sc-text-primary)',
  hoverColor: 'var(--sc-text-primary)',
};

const overlayScheme = {
  modal: {
    background: 'var(--sc-bg-surface)',
    borderColor: 'var(--sc-border-default)',
    color: 'var(--sc-text-primary)',
  },
  popover: {
    background: 'var(--sc-bg-surface)',
    borderColor: 'var(--sc-border-default)',
    color: 'var(--sc-text-primary)',
  },
  select: {
    background: 'var(--sc-bg-elevated)',
    borderColor: 'var(--sc-border-default)',
    color: 'var(--sc-text-primary)',
  },
};

const maskScheme = {
  background: 'rgb(var(--sc-shadow-color-rgb) / 0.4)',
  color: 'var(--sc-text-inverse)',
};

const listScheme = {
  option: {
    icon: {
      color: 'var(--sc-icon-subtle)',
      focusColor: 'var(--sc-text-secondary)',
    },
    color: '{text.color}',
    focusColor: '{text.hover.color}',
    selectedColor: '{highlight.color}',
    focusBackground: 'var(--sc-bg-secondary-hover)',
    selectedBackground: '{highlight.background}',
    selectedFocusColor: '{highlight.focus.color}',
    selectedFocusBackground: '{highlight.focus.background}',
  },
  optionGroup: {
    color: '{text.muted.color}',
    background: 'transparent',
  },
};

const navigationScheme = {
  item: {
    icon: {
      color: 'var(--sc-icon-subtle)',
      focusColor: 'var(--sc-text-secondary)',
      activeColor: 'var(--sc-text-secondary)',
    },
    color: '{text.color}',
    focusColor: '{text.hover.color}',
    activeColor: '{text.hover.color}',
    focusBackground: 'var(--sc-bg-secondary-hover)',
    activeBackground: 'var(--sc-bg-secondary-hover)',
  },
  submenuIcon: {
    color: 'var(--sc-icon-subtle)',
    focusColor: 'var(--sc-text-secondary)',
    activeColor: 'var(--sc-text-secondary)',
  },
  submenuLabel: {
    color: '{text.muted.color}',
    background: 'transparent',
  },
};

const formFieldScheme = {
  color: 'var(--sc-text-primary)',
  iconColor: 'var(--sc-icon-subtle)',
  disabledBackground: 'var(--sc-bg-disabled)',
  disabledColor: 'var(--sc-text-disabled)',
  placeholderColor: 'var(--sc-text-subtle)',
  borderColor: 'var(--sc-border-default)',
  hoverBorderColor: 'var(--sc-border-strong)',
  focusBorderColor: 'var(--sc-bg-primary)',
  invalidBorderColor: 'var(--sc-border-error)',
  invalidPlaceholderColor: 'var(--sc-text-danger)',
  filledBackground: 'var(--sc-bg-default)',
  filledFocusBackground: 'var(--sc-bg-default)',
  filledHoverBackground: 'var(--sc-bg-default)',
  floatLabelColor: 'var(--sc-text-subtle)',
  floatLabelFocusColor: 'var(--sc-text-subtle)',
  floatLabelActiveColor: 'var(--sc-text-subtle)',
  floatLabelInvalidColor: '{form.field.invalid.placeholder.color}',
  shadow: 'var(--sc-shadow-xs)',
};

export default {
  primitive: {
    ...Object.fromEntries(Object.entries(families).map(([kit, sc]) => [kit, ramp(sc)])),
    borderRadius: {
      none: '0',
      xs: 'var(--sc-radius-xs)',
      sm: 'var(--sc-radius-sm)',
      md: 'var(--sc-radius-md)',
      lg: 'var(--sc-radius-lg)',
      xl: 'var(--sc-radius-xl)',
    },
  },
  semantic: {
    primary: ramp('blue'),
    iconSize: 'var(--sc-scale-1)',
    focusRing: {
      // Divergencia consciente vs Kit (navy, width 1): electric-blue mas ancho por
      // contraste a11y — customs-catalog §1.1.
      color: 'var(--sc-border-focus)',
      style: 'solid',
      width: 'var(--sc-focus-ring-width)',
      offset: 'var(--sc-focus-ring-offset)',
      shadow: 'none',
    },
    disabledOpacity: '0.6',
    transitionDuration: 'var(--sc-transition-base)',
    anchorGutter: '0.142857rem',
    content: {
      borderRadius: '{border.radius.md}',
    },
    mask: {
      transitionDuration: 'var(--sc-transition-base)',
    },
    list: {
      gap: '0.142857rem',
      padding: 'var(--sc-scale-0-25)',
      header: {
        padding: 'var(--sc-scale-0-5) var(--sc-scale-1) var(--sc-scale-0-25)',
      },
      option: {
        padding: 'var(--sc-scale-0-5) var(--sc-scale-0-75)',
        borderRadius: '{border.radius.sm}',
      },
      optionGroup: {
        padding: 'var(--sc-scale-0-5) var(--sc-scale-0-75)',
        fontWeight: '600',
      },
    },
    overlay: {
      modal: {
        padding: 'var(--sc-scale-1-25)',
        borderRadius: '{border.radius.xl}',
        shadow: 'var(--sc-shadow-dialog)',
      },
      popover: {
        padding: 'var(--sc-scale-0-75)',
        borderRadius: '{border.radius.md}',
        shadow: 'var(--sc-shadow-popover)',
      },
      select: {
        borderRadius: '{border.radius.md}',
        shadow: 'var(--sc-shadow-dropdown)',
      },
      navigation: {
        shadow: 'var(--sc-shadow-dropdown)',
      },
    },
    formField: {
      // Padding 10.5/7 + sm/lg 1:1 del export del Kit (form.field.*) — los
      // tokens de escala caen exactos. Aplica a todos los form fields PrimeNG.
      paddingX: 'var(--sc-scale-0-75)',
      paddingY: 'var(--sc-scale-0-5)',
      sm: {
        fontSize: 'var(--sc-font-size-100)',
        paddingX: 'var(--sc-scale-0-625)',
        paddingY: 'var(--sc-scale-0-375)',
      },
      lg: {
        fontSize: 'var(--sc-font-size-300)',
        paddingX: 'var(--sc-scale-0-875)',
        paddingY: 'var(--sc-scale-0-625)',
      },
      borderRadius: '{border.radius.md}',
      transitionDuration: 'var(--sc-transition-base)',
      shadow: 'var(--sc-shadow-xs)',
      focusRing: {
        // El Kit apaga el ring del campo (focus = borde): width 0.
        color: 'transparent',
        style: 'solid',
        width: '0',
        offset: '0',
        shadow: 'none',
      },
    },
    navigation: {
      item: {
        gap: 'var(--sc-scale-0-5)',
        padding: 'var(--sc-scale-0-5) var(--sc-scale-0-75)',
        borderRadius: '{border.radius.sm}',
      },
      list: {
        gap: '0.142857rem',
        padding: 'var(--sc-scale-0-25)',
      },
      submenuIcon: {
        size: 'var(--sc-scale-0-875)',
      },
      submenuLabel: {
        padding: 'var(--sc-scale-0-5) var(--sc-scale-0-75)',
        fontWeight: '600',
      },
    },
    colorScheme: {
      light: {
        surface,
        primary: primaryScheme,
        text: textScheme,
        content: contentScheme,
        overlay: overlayScheme,
        mask: maskScheme,
        list: listScheme,
        navigation: navigationScheme,
        formField: {
          ...formFieldScheme,
          background: 'var(--sc-bg-surface)',
        },
        highlight: {
          color: '{primary.700}',
          background: '{primary.50}',
          focusColor: '{primary.800}',
          focusBackground: '{primary.100}',
        },
      },
      dark: {
        surface,
        primary: primaryScheme,
        text: textScheme,
        content: contentScheme,
        overlay: overlayScheme,
        mask: maskScheme,
        list: listScheme,
        navigation: navigationScheme,
        formField: {
          ...formFieldScheme,
          // Inputs "embebidos" en dark: mismo fondo que el lienzo (frame
          // 9795:26786 del Kit), no un paso más claro.
          background: 'var(--sc-bg-default)',
        },
        // Sin token semántico propio: receta Aura/Kit (emerald-400 translúcido
        // al 16 %) expresada sobre primitivos — sin hex en base.
        highlight: {
          color: 'color-mix(in srgb, var(--sc-color-gray-0) 87%, transparent)',
          background: 'color-mix(in srgb, var(--sc-color-emerald-400) 16%, transparent)',
          focusColor: 'color-mix(in srgb, var(--sc-color-gray-0) 87%, transparent)',
          focusBackground: 'color-mix(in srgb, var(--sc-color-emerald-400) 24%, transparent)',
        },
      },
    },
  },
};
