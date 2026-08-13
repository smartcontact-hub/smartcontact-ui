# @smartcontact-hub/styles — design tokens

![Design Tokens](https://img.shields.io/badge/Design%20Tokens-DTCG-5A45FF)
![CSS Variables](https://img.shields.io/badge/CSS-Custom%20Properties-1572B6?logo=css&logoColor=white)
![PrimeNG](https://img.shields.io/badge/PrimeNG-21-10B981)
![License](https://img.shields.io/badge/license-Proprietary-lightgrey)

> Looking for the friendly, design-side walkthrough in Spanish?
> See [`../../docs/guia-tokens.md`](../../docs/guia-tokens.md) — written for
> designers coming from Figma, with STAR-format walkthroughs of common
> situations ("I changed a brand color in Figma, how does it reach the
> product?", "I need a color that doesn't exist yet", etc.). This README is
> the technical reference.

The seven layers of the token system are the **single source of truth** for
every visual decision in Smart Contact products. All `--sc-*` custom
properties live in this package, and PrimeNG `--p-*` variables are bridged
to them in layer 6 (the preset, in `@smartcontact-hub/components`).

The structure mirrors PrimeNG's official design-token model
(primitive → semantic → component → preset overrides) and adds two layers
PrimeNG doesn't provide: domain palettes (3) and product extensions (5).

## Layout

```
projects/design-tokens/
├── scripts/
│   └── kit-export-dtcg.json       # DTCG export of the Kit — metric source of truth
├── src/lib/styles/
│   ├── index.css                  # single CSS entry — imports all layers in cascade order
│   ├── tokens/layers/
│   │   ├── 01-primitive.css       # raw values (color scales, font, scale, radius)
│   │   ├── 02-semantic.css        # purpose-bound aliases (text, surface, border, type roles)
│   │   ├── 03-palette.css         # domain palettes (label hues, agent presence, group priority)
│   │   ├── 04-component.css       # pre-baked component specs (button, modal, toast)
│   │   ├── 05-extensions.css      # product extensions (layout dims, shadows, z-index, motion)
│   │   └── 07-dark.css            # `.sc-dark` overrides for layers 2 / 3 / 4
│   └── base/                      # reset + globals
└── README.md
```

> **Layer 6 is not a CSS file.** The PrimeNG bridge lives as a **modular
> preset** in `@smartcontact-hub/components`:
> `projects/ui-smartcontact/src/lib/theme/sc-preset/` — one file per
> component (`button.ts`, `dialog.ts`, `datatable.ts`, …) plus the shared
> base. The preset is a **standalone** object — **not** `definePreset(Aura, …)`; verified
> 2026-08-13, `definePreset` has 0 occurrences under `projects/` and `sc-preset/base.ts` imports
> nothing from Aura. That matters: **what we don't declare does NOT inherit from Aura.** It is registered
> through the provider (`provideSmartContactUi`). Every preset slot resolves
> to a `var(--sc-*)` reference — PrimeNG components consume Smart Contact
> brand, and the source of truth stays in these layers.

Cascade matters. Each layer reads tokens declared earlier in the chain.
A semantic token (layer 2) can reference a primitive (layer 1); a
component token (layer 4) can reference primitives or semantics; the
PrimeNG preset (layer 6) reaches into all of them.

## Rules

1. **Never declare `--p-*` variables manually.** PrimeNG emits them at
   runtime from the preset registered via the provider. To change a
   `--p-*` mapping, edit the matching file under
   `projects/ui-smartcontact/src/lib/theme/sc-preset/`, not a CSS file.
2. Components must reference `--sc-*` tokens — never raw `#hex`, `Npx`,
   or numeric values for color, spacing, typography, or radius.
   **Fallback hex (`var(--sc-x, #aaa)`) counts as raw hex.** If you need
   a fallback, the token doesn't exist yet — add it to a layer.
3. When adding a token, place it in the lowest applicable layer first
   (primitive → semantic → palette/component → extension), never higher
   up. If PrimeNG components need to consume it, also map the matching
   `--p-*` slot in the preset.
4. To change a value globally, edit the lowest-layer declaration. Every
   alias above picks up the change automatically — including PrimeNG
   components, because the preset's values are `var(--sc-*)` references
   that resolve through the cascade.

## "Which layer does my new token belong to?"

The mental model mirrors PrimeNG's: **primitive → semantic → component**,
plus two product-specific layers for things PrimeNG doesn't model.

| You want to express... | Layer | Examples |
| --- | --- | --- |
| A raw value (a specific gray, a specific radius step) | **01-primitive** | `--sc-color-slate-200`, `--sc-radius-md`, `--sc-scale-1` |
| A *role* in the UI ("text-primary", "bg-surface", "border-default") | **02-semantic** | `--sc-text-primary`, `--sc-bg-surface`, `--sc-border-focus` |
| A Smart Contact domain palette (agent presence, group priority, label color) | **03-palette** | `--sc-presence-available`, `--sc-priority-medium-deep`, `--sc-label-amber-bg` |
| A pre-baked spec for a specific reusable component | **04-component** | `--sc-dialog-bg`, `--sc-toast-padding-x`, `--sc-cmp-button-contrast-background` |
| Something PrimeNG doesn't model: z-index scale, motion, layout dims, shadow recipes | **05-extensions** | `--sc-z-modal`, `--sc-transition-fast`, `--sc-shadow-card`, `--sc-topbar-height` |

**Quick test when you reach for a value in a component's SCSS:**

1. Is this a *role* (border on focus, text muted, surface elevated)?
   → semantic. Use it.
2. Is it a *specific scale step* (gray-200, blue-500, spacing-1-5)?
   → primitive. Use it directly only if no semantic role exists. If
   you're using `--sc-color-blue-500` for "the primary brand color",
   reach for `--sc-bg-primary` instead.
3. Is it a *component spec* (button padding, modal radius)?
   → component layer. If it's a one-off, declare locally in the
   component SCSS — don't pollute the global component layer.
4. Is it *specific to the Smart Contact domain* (agent state, group
   priority)? → palette.

**When in doubt:** semantic over primitive. The semantic alias rarely
needs to change, but if it does, every consumer updates with it.

## PrimeNG-as-reference

When PrimeNG names a concept (`text.mutedColor`, `formField.shadow`,
`overlay.select.background`), **map our token to PrimeNG's name in the
preset, not the other way around**. PrimeNG's vocabulary is the upstream
source — the `sc-preset` modules are the bridge.

Where a Smart Contact semantic name diverges from PrimeNG's (e.g. our
`--sc-text-secondary` ↔ PrimeNG's `text.mutedColor`), the divergence is
intentional but **documented in the preset comments**, never silent. New
contributors coming from PrimeNG docs should be able to trace any PrimeNG
concept to the `--sc-*` token it maps to.

## Figma parity — `scripts/kit-export-dtcg.json`

`scripts/kit-export-dtcg.json` is the **DTCG export of the Smart Contact
Kit** — produced via Theme Designer / the `primeui-figma-plugin-v4` plugin.
It groups tokens under slash keys (`aura/primitive`, `aura/semantic/common`,
`aura/component/light`, `aura/custom`, …) and expresses references with
dot syntax (`{scale.0-5}`, `{surface.100}`). It is the **metric source of
truth** when porting from Figma: every `scale`, `border.radius`, and
component sizing value (`buttonSmFontSize`, `formFieldSmPaddingY`,
`buttonIconOnlyWidth`…) is the exact number Figma shows. The seven
`layers/*.css` files remain the source of truth for the *running app*;
`kit-export-dtcg.json` is what we **check those layers against**.

`npm run tokens:parity` (`scripts/token-parity.mjs`) does the diff,
deterministically — it is the full audit:

1. **scale / radius** — every export value must have a matching
   `--sc-scale-*` / `--sc-radius-*`.
2. **value → token map** — prints e.g. `5.25px → --sc-scale-0-375`, so when
   you inspect a Figma node the mapping into our vocabulary is exact, never
   eyeballed.
3. **component sizing** — verifies the preset actually fixes the sm/lg
   paddings, font-sizes and icon-only widths the export declares.
4. **brand-colour parity (light + dark)** — resolves our `--sc-*` tokens to
   hex through the `var()` chain and asserts the primary ramp / surface
   scale / content match the export, so colour drift fails the build
   instead of slipping by.

Re-export from Figma and overwrite `kit-export-dtcg.json` whenever the
Kit's variables change; then run the parity check and reconcile.

## The scale — formal definition

The metric scale is a **single 14-based ramp**. Every `--sc-scale-{m}` token
represents exactly `m × 14px` of design space — but is **emitted in rem**:
`scripts/token-gen.mjs` writes `design px / 16` as the rem value, with the
design px kept in a comment:

```css
--sc-scale-0-375: 0.328125rem; /* 5.25px */
--sc-scale-1: 0.875rem;        /* 14px — the base (Kit root font) */
--sc-scale-1-125: 0.984375rem; /* 15.75px */
--sc-scale-12-5: 10.9375rem;   /* 175px = 12.5 × 14 */
```

> The last line used to read `9.578125rem; /* 153.25px */`, which **broke the
> v/14 law stated twelve lines below** (12.5 × 14 = 175, not 153.25) in the very
> document that defines it. Corrected 2026-08-13 against
> `01-primitive.css:341`. If a value here disagrees with the generated block,
> **the generated block wins** — it comes from the Kit export; this file is prose.

**Why rem, not px**: the px→rem conversion is centralized in one point (the
generator), the tokens respect the user's browser font-zoom setting
(accessibility), and the default render is pixel-identical (root 16px).
The design px in the comment is what `tokens:parity` cross-checks.

**Naming is mechanical and unchanged (the v/14 law)**: the suffix is the
multiplier — `|design px| / 14` — with `.` written as `-` (`0.375` →
`0-375`), negatives prefixed `neg-` (`-10.5px` → `--sc-scale-neg-0-75`). So
the name is derivable from the design value alone:
`name(v) = (v < 0 ? "neg-" : "") + |v|/14` with dots → dashes. **Derive
names from the value, never from the export's key string** — flattened
keys are lossy (the decimal point isn't encoded); `v / 14` is unambiguous.

**Why 14, not 8**: the Kit (a clean PrimeNG duplicate) bases its scale on
the 14px root font, so steps land on 3.5 / 5.25 / 7 / 8.75 / 10.5 / 12.25 …,
not on an 8px grid. When an external spec is drawn on an 8px grid, **snap
each value to the nearest 14-base step** rather than forking a parallel
8-grid ramp — keeps one scale.

**Aliases vs. own ramp**: `--sc-spacing-*` are semantic aliases that point
*at* `--sc-scale-*` (one 14-base ramp for spacing/padding) and are **what
components consume** — never the `--sc-scale-*` primitives directly.
**Typography is NOT on that ramp**: `--sc-font-size-*`,
`--sc-line-height-*` and `--sc-icon-size-*` are a **separate round scale in
rem** (`calc(N / 16 * 1rem)`), decoupled from `--sc-scale`.

> **Typography — round, rem, step-named.** The font scale is **round**
> (12/14/16/18/20/24/32/48, mirror of the official Kit) in **rem** root-16
> (16→1, 24→1.5, 32→2), **independent of `--sc-scale`**. Primitives are
> **step-named** in both Figma and code (`typography/font/size/300` =
> `--sc-font-size-300` = 16) — one shared language between design and code.
> `npm run tokens:type-parity` guards Figma↔code drift.

**Radius is a separate scale** — `--sc-radius-*` is **not** 14-based. It
mirrors the Kit's `border.radius` step set, also **emitted in rem**:
`xs` 2 / `sm` 4 / `md` 6 / `lg` 8 / `xl` 12 (px design values), plus two
SC customs without a Kit equivalent: `2xl` (16px → `1rem`) and `full`,
which **stays at `9999px`** because it is a pill clamp, not a metric step
— it must not scale. Numeric aliases (`--sc-radius-50/100/200/300/400/500`)
map onto those steps for call sites that prefer the numeric convention.

## Generated blocks and the Figma→code bridge

**Nine regions across FIVE layer files** are generated from
`kit-export-dtcg.json` and marked with comment fences — never edit any of them
by hand (measured 2026-08-13; this section used to say "three regions of
`01-primitive.css`" and "the single generator", which is how someone ends up
hand-editing a generated block in `02`/`04`/`05`/`07` and losing the work on
the next import):

| Layer file | Generated regions |
|---|---|
| `01-primitive.css` | `@sc-gen:scale` · `@sc-gen:radius` · `@sc-gen:palette` |
| `02-semantic.css` | `@sc-gen:semantic-color-light` |
| `04-component.css` | `@sc-gen:cmp-sizing` · `@sc-gen:cmp-color-light` |
| `05-extensions.css` | `@sc-gen:effects` |
| `07-dark.css` | `@sc-gen:semantic-color-dark` · `@sc-gen:cmp-color-dark` |

**Five generators**, chained by `npm run tokens:import`: `token-gen.mjs`
(primitives) → `token-gen-component.mjs` (sizing, DD-18) →
`token-gen-color.mjs` (semantic color, DD-19) → `token-gen-cmp-color.mjs`
(component color, DD-20) → `token-gen-effects.mjs` (effects).

The primitive generator, `scripts/token-gen.mjs`:

- **`npm run tokens:gen`** — check mode: derives the canonical token set
  from the export (names by the v/14 law, values in rem) and verifies
  `01-primitive.css` matches — **including the naming law, which parity
  doesn't check** (parity only compares values).
- **`npm run tokens:import`** — runs the **five** generators in order and
  rewrites the nine blocks **in place**, between the markers, straight from the
  export. This is the manual seam automated: a Figma change → re-export
  `kit-export-dtcg.json` → `tokens:import` → the cascade propagates. It reaches
  **components too**: the preset references these tokens
  (`paddingX: var(--sc-scale-0-75)`), **never raw px** — every pinned component
  metric follows the generated primitives with no hand-editing.
  **Scoped on purpose**: only the marked regions are touched; aliases, comments
  and hand-curated declarations *outside* the fences stay authored. Idempotent.

> ⚠️ **Brand colour IS auto-imported** — corrected 2026-08-13. This section used
> to say brand colours were "a documented decision … not auto-imported", and
> `guia-tokens.md` repeated it to the design side. That stopped being true with
> **DD-19 / DD-20**: `token-gen-color.mjs` rewrites the semantic colour blocks in
> `02` and `07`, and `token-gen-cmp-color.mjs` the component colour blocks in
> `04` and `07` (read it in each generator's header). What *does* stay
> hand-curated is whatever sits **outside** the fences plus the **conscious
> divergences** — the `DIVERGE` list in `scripts/color-map.mjs` — and those are
> exactly what `tokens:parity` turns red so a human decides.

Two more checks complete the belt:

- **`npm run tokens:guard`** (`scripts/token-guard.mjs`) — the static
  guardrail. Blocks `var(--p-*)` outside the preset, bans the 8-point
  nomenclature (`--sc-space-*` and `--sc-spacing-50/100/200…` — the only
  spacing scale is the 14-base v/14 one: `--sc-spacing-0-5`, `-1`,
  `-1-5`…), forbids `--sc-scale-*` primitives in component styles, and
  blocks new literal `font-size: Npx`/`Nrem` declarations (must be a
  `--sc-font-size-*` token; the allow-list is empty).
- **`npm run audit:theme-scale`** (`scripts/check-theme-scale.mjs`) —
  asserts **zero raw px** in the preset: every metric slot must be a
  `--sc-*` reference.

## Adding a new token

```css
/* layers/01-primitive.css — add the raw value */
--sc-color-magenta-500: #d946ef;

/* layers/02-semantic.css — add a purpose-bound alias */
--sc-bg-magenta: var(--sc-color-magenta-500);
```

```ts
/* theme/sc-preset/ — (optional) expose to PrimeNG components */
primitive: {
  magenta: { 500: 'var(--sc-color-magenta-500)' },
}
```

Dark-mode behaviour: most aliases inherit through the cascade, so a new
semantic token usually does NOT need a dark override. Add an entry in
`07-dark.css` only when the dark variant has a different visual shape
(different surface tint, translucent overlay, etc.).

## Dark mode

Layer 7 (`07-dark.css`) re-declares layers 2 / 3 / 4 under the **`.sc-dark`
class**. The provider's `darkModeSelector` defaults to `.sc-dark` as well,
so PrimeNG's `colorScheme.dark` overrides and our layer-7 overrides
activate together under the same class. When adding a preset override in
`colorScheme.light`, always add the `dark` counterpart — otherwise the
token falls back to Aura defaults in dark mode.

## Token naming

`--sc-<category>-<variant>-<modifier>`

- `<category>`: `color`, `text`, `bg`, `border`, `icon`, `font-size`,
  `line-height`, `font-weight`, `spacing`, `radius`, `shadow`, `z`,
  `transition`, `easing`, `presence`, `priority`, `label`.
- `<variant>`: scale step (`50`, `100`, …, `950`, or a v/14 multiplier
  like `0-5`, `1-125`) or semantic name (`primary`, `danger`, `subtle`,
  `accent`, …).
- `<modifier>`: optional state (`hover`, `active`, `disabled`, `subtle`)
  or shade (`deep`, `available`, `paused`).

Examples: `--sc-color-blue-700`, `--sc-bg-primary-hover`,
`--sc-text-on-error`, `--sc-radius-full`, `--sc-z-modal`,
`--sc-presence-available-deep`.
