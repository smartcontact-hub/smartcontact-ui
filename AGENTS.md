# SmartContact UI - Agents

## Purpose
This project is a design system built with Angular 21, PrimeNG 21, standalone components, and CSS design tokens.

Before making version-sensitive changes, verify the real baseline in:
- `package.json`
- `projects/ui-smartcontact/package.json`
- `angular.json`

Current workspace baseline:
- Angular `21.x`
- PrimeNG `21.x`
- `@primeuix/themes` `2.x`
- `ng-packagr` `21.x`
- TypeScript `5.9.x`

Agents must generate code that is:
- consistent with existing components
- strictly based on real tokens
- aligned with repository structure
- production-ready without manual fixes

---

## Scope
This configuration applies to:
- `projects/ui-smartcontact`
- `projects/ui-smartcontact-icons`
- `projects/sc-demo`
- `projects/design-tokens`

Agents must NOT invent new architecture.
They must extend the current repository.

---

## Core Principles

### 1. Never invent tokens
Only use tokens defined in the layered token source:
- `projects/design-tokens/src/lib/styles/tokens/layers/01-primitive.css`
- `projects/design-tokens/src/lib/styles/tokens/layers/02-semantic.css`
- `projects/design-tokens/src/lib/styles/tokens/layers/03-palette.css`
- `projects/design-tokens/src/lib/styles/tokens/layers/04-component.css`
- `projects/design-tokens/src/lib/styles/tokens/layers/05-extensions.css`
- `projects/design-tokens/src/lib/styles/tokens/layers/07-dark.css`

Layer 6 is the PrimeNG preset and lives in TypeScript:
- `projects/ui-smartcontact/src/lib/theme/sc-preset/`

Do not:
- guess token names
- create aliases
- hardcode values

---

### 2. Always inspect before generating
Before any component or style change, analyze:

- `sc-button`
- `sc-toggleswitch`
- `sc-inputtext`
- existing tokens (the layer files above)
- demo implementation in `projects/sc-demo`

Components are being ported incrementally. If a reference component does not
exist yet in `projects/ui-smartcontact/src/lib/components`, fall back to:
- the conventions in this file
- the token layers and the preset
- the closest component that does exist

If repo and instructions conflict → repo wins.

---

### 3. Follow naming conventions (DD-12)

Two naming families, by component type:

- **PrimeNG wrappers**: selector is `sc-` + the PrimeNG component name,
  lowercase, joined with no hyphen.
  Examples: `sc-button`, `sc-inputtext`, `sc-toggleswitch`, `sc-select`,
  `sc-radiobutton`, `sc-progressbar`, `sc-progressspinner`.
- **Custom components** (no PrimeNG equivalent): descriptive kebab-case.
  Examples: `sc-section-card`, `sc-empty-state`.

Internal CSS class names keep BEM modifiers:
- `sc-button`
- `sc-button--primary`
- `sc-button--md`

---

### 4. Prefer consistency over creativity
Reuse:
- structure
- API patterns
- styling strategy

Avoid introducing new abstractions.

---

## Component Strategy

### Use PrimeNG wrapper when:
- behavior already exists in PrimeNG
- component is a styled primitive

Examples:
- `sc-button`
- `sc-inputtext`
- basic controls

---

### Use custom component when:
- composite UI
- layout-specific
- not supported by PrimeNG

Examples:
- `sc-section-card`
- `sc-empty-state`
- alerts / banners

---

## Mandatory Workflow

Agents MUST follow this order:

1. Run `token-inspector`
2. Run `component-generator`
3. If needed → run `primeng-wrapper`
4. Run `docs-generator`
5. Run `workspace-sync`
6. Run verification: `npm run verify`

Do not skip steps.

### Verification tooling (mandatory)
Before considering any token/theme/component change done, run:

- `npm run tokens:parity` — cross-checks the Kit DTCG export ↔ `--sc-*` tokens ↔ preset
- `npm run tokens:guard` — token guardrails (`--p-*` only in the preset, semantic spacing alias, no 8-point names, `font-size` via token)
- `npm run tokens:type-parity` — typography parity
- `npm run audit:theme-scale` — zero `px` in the preset, central `css.ts`
- `npm run verify` — runs all of the above plus typecheck and lint

---

## Token Strategy

Priority order:
1. component tokens (layer 4, e.g. `--sc-dialog-bg`)
2. semantic tokens (layer 2, e.g. `--sc-text-primary`, `--sc-bg-surface`)
3. foundation/primitive tokens (layer 1) only through their semantic aliases

### Scale (single source: 14-base v/14)
- The metric scale is generated from the Kit export as `--sc-scale-*`
  primitives, emitted in rem (design px / 16, design px kept in a comment).
- Components consume the semantic alias `--sc-spacing-*`, never `--sc-scale-*`
  directly. Examples: `--sc-spacing-0-5` (7px design), `--sc-spacing-0-75`
  (10.5px), `--sc-spacing-1` (14px), `--sc-spacing-1-5` (21px).
- No manual arithmetic in SCSS: use `var(--sc-spacing-*)` directly. Never
  write `calc(var(--token)/16*1rem)` — tokens are already rem.
- `font-size` ALWAYS comes from a `--sc-font-size-*` token (rounded ramp
  12/14/16/18/20/24/32/48).
- The retired 8-point unitless tokens (`--sc-spacing-50/100/200`,
  `--sc-space-*`) do not exist in this DS. Do not reintroduce them
  (`tokens:guard` blocks them).

### Architecture boundary
- `--sc-*` tokens are the public SmartContact design-system contract.
- `--p-*` PrimeNG variables belong exclusively to the preset
  (`projects/ui-smartcontact/src/lib/theme/sc-preset/`). Components and apps
  never consume `--p-*`.
- PrimeNG palette alignment happens through
  `projects/ui-smartcontact/src/lib/theme/sc-preset/base.ts`, which points
  each PrimeNG color family to `var(--sc-color-*)` (no hex in the preset).
  Do not copy palette values into component SCSS or preset files.
- The default dark mode selector is `.sc-dark` (configured by
  `provideSmartContactUi()`).

If tokens do not exist:
- do not invent
- limit implementation

---

## Output Requirements

Every generated component MUST include:

- standalone Angular component
- TS (typed inputs/outputs)
- HTML (clean structure)
- SCSS using tokens
- export in `public-api.ts`
- documentation page in `sc-demo`

---

## Documentation Rules

Docs MUST:
- match the existing `projects/sc-demo` page style (see `src/app/pages/`)
- use real API
- include variants, states, usage, API
- not invent features

---

## Integration Rules

After generation:

- component exported
- route registered (if needed)
- navigation updated
- demo working
- `npm run verify` passes

No broken imports.
No dead routes.

---

## Agent Usage

Expected workflow:

User prompt:
```
Create a new sc-badge component with success and error variants
```

The agent must:
- inspect tokens
- reuse patterns
- generate component
- generate docs
- integrate into workspace
- run verification

---

## Reference Components

Primary references (ported incrementally; use the ones that exist):
- `sc-button`
- `sc-toggleswitch`
- `sc-inputtext`
- `sc-dynamic-dialog`

These define:
- API shape
- styling
- state handling
- wrapper patterns

While a reference is not yet ported, derive patterns from this file, the
token layers, and the preset.

---

## Anti-Patterns

❌ Hardcoded values  
❌ Inline styles  
❌ Fake tokens  
❌ `calc(var(--token)/16*1rem)` conversions (tokens are already rem)  
❌ 8-point names (`--sc-space-*`, `--sc-spacing-200`)  
❌ `--p-*` outside the preset  
❌ Ignoring reference components  
❌ Duplicating logic  
❌ Breaking PrimeNG behavior  

---

## Failure Conditions

Stop or limit output if:
- tokens do not exist
- API is unclear
- repo structure is inconsistent

Do NOT invent solutions.

---

## Goal

Convert prompts into:

- real components
- fully documented
- token-driven
- production-ready

with zero manual fixes.
