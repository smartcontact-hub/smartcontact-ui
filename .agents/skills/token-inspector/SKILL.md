---
name: token-inspector
description: Inspect and extract real CSS design tokens from the SmartContact design-tokens project and map them to component styling needs.
---

# Token Inspector

## Purpose
Identify and extract the correct CSS tokens from the SmartContact design-tokens package and map them to a specific component's styling needs.

This skill must ensure that all styling decisions are based on real, existing tokens in the repository.

This skill is a prerequisite for any component generation.

## Scope
Use this skill before writing any SCSS.

This skill is responsible for:
- locating real tokens in the repository
- mapping tokens to component parts
- defining token usage strategy
- preventing token invention

This skill does not generate component code.
It only prepares token usage for other skills (mainly component-generator).

## Token Sources (Mandatory)
Always inspect tokens from the layered source files:

- `projects/design-tokens/src/lib/styles/tokens/layers/01-primitive.css` — primitives: color families, `--sc-scale-*`, `--sc-spacing-*` aliases, `--sc-font-size-*`, `--sc-line-height-*`, `--sc-radius-*`, font families/weights
- `projects/design-tokens/src/lib/styles/tokens/layers/02-semantic.css` — purpose-bound aliases (`--sc-text-*`, `--sc-bg-*`, `--sc-border-*`, …)
- `projects/design-tokens/src/lib/styles/tokens/layers/03-palette.css` — domain palettes (labels, presence, priority)
- `projects/design-tokens/src/lib/styles/tokens/layers/04-component.css` — per-component tokens (e.g. `--sc-dialog-*`)
- `projects/design-tokens/src/lib/styles/tokens/layers/05-extensions.css` — extensions
- `projects/design-tokens/src/lib/styles/tokens/layers/07-dark.css` — dark mode overrides (applied under `.sc-dark`)

Layer 6 is the PrimeNG preset, in TypeScript:
- `projects/ui-smartcontact/src/lib/theme/sc-preset/`

Prefer the same layer used by reference components.

## Mandatory First Step
Before suggesting tokens, inspect how tokens are used in:

- `sc-button`
- `sc-toggleswitch`
- `sc-inputtext`
- the closest existing custom component when working on custom components

Components are ported incrementally: if a reference does not exist yet in
`projects/ui-smartcontact/src/lib/components`, derive usage patterns from
`AGENTS.md`, the token layer files, and the preset.

These references define:
- real token usage patterns
- naming conventions
- fallback strategies
- alias usage (if any)

If there is a mismatch between theory and actual usage, follow the implementation.

## Input
The input may include:
- component name
- component type (button, input, badge, etc.)
- variants
- sizes
- states

If input is incomplete, infer from:
- closest existing component
- existing tokens
- current design system patterns

Do not invent unsupported variants.

## Output
The output must be structured and usable by the component-generator.

Provide a mapping like:

- root container
- text
- background
- border
- icon
- spacing
- typography
- radius
- states (hover, active, disabled, focus)

Each mapping must include:
- exact token name
- purpose
- when it applies

Example:

- background (default): `--sc-bg-primary`
- background (hover): `--sc-bg-primary-hover`
- text (default): `--sc-text-on-primary`

## Token Selection Strategy

Always follow this priority order:

### 1. Component tokens (layer 4)
Use tokens specific to the component if they exist.

Example:
- `--sc-dialog-bg`

### 2. Semantic tokens (layer 2)
Use semantic tokens already adopted by the project.

Example:
- `--sc-text-primary`
- `--sc-bg-surface`

### 3. Foundation tokens (layer 1, via semantic aliases)
Use base tokens only if consistent with existing components.

Example:
- spacing: `--sc-spacing-*`
- typography: `--sc-font-size-*`, `--sc-line-height-*`
- radius: `--sc-radius-*`

Do not mix strategies arbitrarily.

## Provider Boundary

Use `--sc-*` tokens as the public SmartContact design-system contract.

PrimeNG styled-mode variables (`--p-*`) are provider-specific implementation details. They live ONLY inside the preset (`projects/ui-smartcontact/src/lib/theme/sc-preset/`). Inspect them only when:
- working in `projects/ui-smartcontact/src/lib/theme/sc-preset`
- creating or maintaining a PrimeNG wrapper

Do not recommend `--p-*` variables for component SCSS or application CSS. `npm run tokens:guard` enforces this boundary.

When aligning PrimeNG colors with SmartContact colors, use:

- `projects/ui-smartcontact/src/lib/theme/sc-preset/base.ts`

`base.ts` points each PrimeNG color family to `var(--sc-color-*)` — no hex values in the preset. Do not duplicate palette values across PrimeNG component preset files. Components must continue using `--sc-*` tokens.

## State Mapping Rules

For each interactive component, check and map:

- default
- hover
- active
- disabled
- focus (if applicable)

If a state token does not exist:
- do not invent it
- reuse closest existing token only if consistent with reference components

## Typography, Spacing and Radius (14-base scale)

The single metric scale is the 14-base v/14 scale:
- `--sc-scale-*` primitives are generated from the Kit export in REM
  (design px / 16, design px in a comment). Components never consume them
  directly.
- Components consume the semantic alias `--sc-spacing-*`:
  `--sc-spacing-0-5` = 7px design, `--sc-spacing-0-75` = 10.5px,
  `--sc-spacing-1` = 14px, `--sc-spacing-1-5` = 21px, …
- `font-size` ALWAYS comes from `--sc-font-size-*` (rounded ramp
  12/14/16/18/20/24/32/48), `line-height` from `--sc-line-height-*`,
  radius from `--sc-radius-*`.

No manual arithmetic in SCSS: use `var(--sc-spacing-*)` directly.
Never recommend `calc(var(--token) / 16 * 1rem)` — tokens are already rem.
The retired 8-point tokens (`--sc-spacing-50/100/200`, `--sc-space-*`) do not
exist in this DS; `npm run tokens:guard` blocks any reintroduction.

## Verification

After any token-related change, the mapping must survive:
- `npm run tokens:parity` (Kit DTCG export ↔ tokens ↔ preset)
- `npm run tokens:guard`
- `npm run tokens:type-parity`

## Failure Conditions

Do not proceed with token mapping if:

- required tokens do not exist
- token naming is unclear
- component has no equivalent reference in the system

In these cases:
- return a constrained mapping
- avoid inventing tokens
- limit styling to what is supported

## Anti-Patterns

❌ Inventing token names  
❌ Guessing semantic meanings  
❌ Mixing unrelated token layers  
❌ Hardcoding colors or spacing  
❌ `calc(var(--token)/16*1rem)` conversions  
❌ 8-point names (`--sc-space-*`, `--sc-spacing-200`)  
❌ Ignoring reference components  

## Example

### Input
Create a badge component with success and error variants.

### Output

- background (success): `--sc-bg-success-subtle`
- text (success): `--sc-text-on-success`
- background (error): `--sc-bg-danger-subtle`
- text (error): `--sc-text-on-error`
- padding: `--sc-spacing-0-5`
- radius: `--sc-radius-200`
- font-size: `--sc-font-size-100`

(Verify each token exists in the layer files before emitting the mapping.)

## Success Criteria

The output must:
- use only real tokens
- match project conventions
- be directly usable in SCSS
- align with existing components
- avoid any invented styling system
