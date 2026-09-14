/**
 * Base del preset — primitivos + semántica.
 *
 * Cada valor apunta a los tokens `--sc-*` de @smartcontact-hub/styles (la única
 * fuente de verdad). Aquí no se escribe ningún color en hex ni ninguna métrica
 * en px: el preset REDIRIGE (`--p-*` → `var(--sc-*)`), no declara.
 *
 * Mapa de familias (verificado por valor contra el export del Kit):
 *   sky    → --sc-color-sky-*  (mismo nombre que en el Kit)
 *   slate  → --sc-color-slate-*           (gris de marca SC)
 *   orange → --sc-color-yellow-*         (warn = lo que diga el Theme Designer, y
 *            desde el export del 24-ago dice YELLOW. La familia
 *            --sc-color-orange-* de la paleta de labels no pasa por aquí)
 *   yellow → --sc-color-yellow-*         (ídem: severities warn de toast/message)
 *
 *   Las DOS apuntan a yellow a propósito. El Kit habla de warn en slots que
 *   PrimeNG llama unas veces `orange` y otras `yellow`; si solo se remapeara una,
 *   el tag saldría de un color en claro y de otro en oscuro — que es exactamente
 *   lo que pasaba antes de esto (medido el 2026-08-24). Y no basta con BORRAR el
 *   remap: `tag.ts` y `button.ts` referencian `{orange.N}`, así que sin fila se
 *   irían al naranja real de la paleta de labels.
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
  sky: 'sky',
  blue: 'blue',
  slate: 'slate',
  zinc: 'zinc',
  // `amber` ya no lo referencia nada nuestro (0 `{amber.N}` en el repo tras mover
  // warn a yellow), pero se queda: esto alimenta el bloque `primitive` del preset y
  // Aura puede resolver `{amber.N}` por dentro. Borrarlo ahorra una rampa de
  // custom properties y arriesga un slot de PrimeNG que no podemos enumerar.
  amber: 'amber',
  green: 'green',
  purple: 'purple',
  orange: 'yellow',
  yellow: 'yellow',
} as const;

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

const ramp = (scToken: string) =>
  Object.fromEntries(STEPS.map((step) => [step, `var(--sc-color-${scToken}-${step})`]));

const surface = {
  0: 'var(--sc-color-slate-0)',
  ...ramp('slate'),
};

/* En OSCURO la superficie es zinc desde el 2026-09-13, lo que dicen Aura y el Kit (antes
 * era el mismo gris de marca que en claro, declarado divergencia en `color-map.mjs`). El
 * blanco se queda en `slate-0`: zinc no tiene paso 0 y el blanco no tiene tinte. */
const surfaceDark = {
  0: 'var(--sc-color-slate-0)',
  ...ramp('zinc'),
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
  mutedColor: 'var(--sc-text-secondary)',
};

const contentScheme = {
  background: 'var(--sc-bg-surface)',
  hoverBackground: 'var(--sc-bg-secondary-hover)',
  borderColor: 'var(--sc-border-default)',
  color: 'var(--sc-text-primary)',
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
  focusBorderColor: 'var(--sc-bg-primary)',
  invalidPlaceholderColor: 'var(--sc-text-danger)',
  floatLabelColor: 'var(--sc-text-subtle)',
  floatLabelFocusColor: 'var(--sc-text-subtle)',
  floatLabelActiveColor: 'var(--sc-text-subtle)',
  floatLabelInvalidColor: '{form.field.invalid.placeholder.color}',
  shadow: 'var(--sc-cmp-form-field-shadow)',
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
    iconSize: 'var(--sc-cmp-icon-size)',
    /*
     * `lineHeight: 'inherit'` DEVUELVE LA HERENCIA que había antes de Aura (2026-09-13).
     * PrimeNG pone en la raíz de TODOS sus componentes
     * `.p-component { line-height: var(--p-typography-line-height) }`. Sin Aura esa variable
     * no existía, el valor salía inválido y cada componente heredaba el de su página. Aura
     * la define a `1.5`, que en el Supervisor no se nota (su body ya va a 1.5) pero en sc-docs
     * movió 15 componentes de 20px a 21px, medido por `component-styles`.
     * Cómo funciona: `inherit` en una variable declarada en `:root` no tiene de quién
     * heredar, así que la variable queda sin valor y `var()` vuelve a ser inválido, que es
     * justo el estado de antes. Los tamaños de letra de Aura SÍ se quedan: esos arreglaban
     * menús y desplegables que se abrían a 16px en el `<body>`.
     */
    typography: {
      lineHeight: 'inherit',
    },
    focusRing: {
      // Divergencia consciente vs Kit (navy, width 1): sky-500 más ancho por
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
        padding: 'var(--sc-cmp-overlay-modal-padding)',
        borderRadius: 'var(--sc-cmp-overlay-modal-border-radius)',
        shadow: 'var(--sc-cmp-overlay-modal-shadow)',
      },
      popover: {
        padding: 'var(--sc-cmp-overlay-popover-padding)',
        borderRadius: 'var(--sc-cmp-overlay-popover-border-radius)',
        shadow: 'var(--sc-cmp-overlay-popover-shadow)',
      },
      select: {
        borderRadius: 'var(--sc-cmp-overlay-select-border-radius)',
        shadow: 'var(--sc-cmp-overlay-select-shadow)',
      },
      navigation: {
        shadow: 'var(--sc-cmp-overlay-navigation-shadow)',
      },
    },
    formField: {
      // Padding 10/6 + sm/lg 1:1 del export del Kit (valores de Aura desde DD-81) (form.field.*) — los
      // tokens de escala caen exactos. Aplica a todos los form fields PrimeNG.
      paddingX: 'var(--sc-cmp-form-field-padding-x)',
      paddingY: 'var(--sc-cmp-form-field-padding-y)',
      sm: {
        fontSize: 'var(--sc-cmp-form-field-sm-font-size)',
        paddingX: 'var(--sc-cmp-form-field-sm-padding-x)',
        paddingY: 'var(--sc-cmp-form-field-sm-padding-y)',
      },
      lg: {
        fontSize: 'var(--sc-cmp-form-field-lg-font-size)',
        paddingX: 'var(--sc-cmp-form-field-lg-padding-x)',
        paddingY: 'var(--sc-cmp-form-field-lg-padding-y)',
      },
      borderRadius: 'var(--sc-cmp-form-field-border-radius)',
      transitionDuration: 'var(--sc-transition-base)',
      shadow: 'var(--sc-cmp-form-field-shadow)',
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
        surface: surfaceDark,
        primary: primaryScheme,
        text: textScheme,
        content: contentScheme,
        overlay: overlayScheme,
        list: listScheme,
        navigation: navigationScheme,
        formField: {
          ...formFieldScheme,
          // Inputs "embebidos" en dark: mismo fondo que el lienzo (frame
          // 9795:26786 del Kit), no un paso más claro.
          background: 'var(--sc-bg-default)',
        },
        // Sin token semántico propio: receta de Aura (el primario oscuro translúcido
        // al 16 % y al 24 %). Hasta DD-81 era esmeralda-400, copiado tal cual del
        // verde de Aura: los seleccionados en oscuro salían verdes. Ahora cuelga del
        // primario, que en oscuro es sky-300.
        highlight: {
          color: 'color-mix(in srgb, var(--sc-color-slate-0) 87%, transparent)',
          background: 'color-mix(in srgb, var(--sc-bg-primary) 16%, transparent)',
          focusColor: 'color-mix(in srgb, var(--sc-color-slate-0) 87%, transparent)',
          focusBackground: 'color-mix(in srgb, var(--sc-bg-primary) 24%, transparent)',
        },
      },
    },
  },
};
