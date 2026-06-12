---
name: component-generator
description: Generate Angular 21 standalone SmartContact UI components by reusing existing project patterns, real CSS tokens, and current reference implementations such as sc-button, sc-toggleswitch, sc-inputtext, and sc-dynamic-dialog.
---

# Component Generator

## Purpose
Generate a production-ready SmartContact UI component for the existing Angular 21 workspace.

This skill must produce code that is consistent with the current repository, not generic scaffolded output.

The generated result must align with:
- Angular 21
- standalone components
- SmartContact naming conventions (DD-12)
- real CSS token usage (14-base scale, `--sc-*` contract)
- existing library architecture
- current demo and documentation patterns

## Scope
Use this skill when creating or refactoring a SmartContact UI component inside:
- `projects/ui-smartcontact`
- `projects/sc-demo`

This skill covers:
- component generation
- component refactoring
- wrapper generation around PrimeNG primitives
- token-based SCSS generation
- component-owned i18n for custom components when they contain fixed copy
- library export updates
- demo/docs integration

This skill does not invent a new architecture for the repo.
It must extend the architecture already present in the workspace.

## Mandatory First Step: Inspect Existing Implementation
Before generating any code, inspect the current project structure and the existing reference components.

Reference components (ported incrementally — inspect the ones that exist):
- `projects/ui-smartcontact/src/lib/components/button`
- `projects/ui-smartcontact/src/lib/components/toggleswitch`
- `projects/ui-smartcontact/src/lib/components/inputtext`
- `projects/ui-smartcontact/src/lib/components/dynamic-dialog`

If a reference component has not been ported yet, derive conventions from
`AGENTS.md`, the token layers in
`projects/design-tokens/src/lib/styles/tokens/layers/`, and the preset in
`projects/ui-smartcontact/src/lib/theme/sc-preset/`.

These references are the source of truth for:
- component folder structure
- selector conventions
- input/output naming
- event naming
- class naming
- state handling
- wrapper style when PrimeNG is involved
- documentation expectations in the demo app

If the current repo patterns differ from this skill text, the repo wins.

## Required Repository Inspection
Before writing code, inspect all relevant existing files and patterns for the target component.

At minimum, verify:
- current component folder conventions
- existing export conventions in `public-api.ts`
- current demo/docs page structure in `projects/sc-demo/src/app/pages/`
- current i18n pattern in custom components and demo pages (if present)
- current route and navigation registration pattern
- available design tokens in `projects/design-tokens/src/lib/styles/tokens/layers/`
- whether the target component should be custom or a wrapper

Do not assume file locations if the repo shows a different pattern.

## Inputs
The user request may provide:
- component name
- selector
- variants
- sizes
- states
- behavior
- whether documentation is needed
- whether the component should wrap PrimeNG

If some of this information is missing, infer only from:
- the repository structure
- existing SmartContact patterns
- existing tokens
- the closest reference component

Do not invent unsupported API surface.

## Output
When applicable, this skill must generate or update:
- component folder
- `*.component.ts`
- `*.component.html`
- `*.component.scss`
- supporting local exports if the repo uses them
- library export in `public-api.ts`
- demo/docs page in `projects/sc-demo`
- component-local i18n file if a custom component owns fixed text
- route registration if required by the current demo architecture
- navigation entry if required by the current demo architecture

Only create files that are consistent with the current project conventions.

## Non-Negotiable Rules

### 1. Never invent tokens
Only use tokens that already exist in the repository.

Primary token sources:
- `projects/design-tokens/src/lib/styles/tokens/layers/01-primitive.css` … `07-dark.css`
- layer 6 is the preset: `projects/ui-smartcontact/src/lib/theme/sc-preset/`

Do not create new token names.
Do not guess token names.
Do not create fake semantic aliases.

### 2. Inspect tokens before writing SCSS
Before writing styles, identify the exact tokens available for:
- component colors
- spacing
- typography
- radii
- states
- icons
- borders

Prefer component-specific tokens when they exist.
Use foundation tokens only when that matches the current project pattern.

### 3. Use exact token names
Use token names exactly as defined in the repo.

If the project already uses a documented alias layer, follow that existing pattern only.
Do not introduce a new alias strategy inside the skill output.

### 4. Consume the 14-base scale directly
All metric tokens are already emitted in rem (design px / 16). Consume them
directly:

```scss
padding: var(--sc-spacing-1); /* 14px de diseño */
gap: var(--sc-spacing-0-5);   /* 7px de diseño */
font-size: var(--sc-font-size-200); /* 14 */
```

Never write `calc(var(--token) / 16 * 1rem)` or any manual arithmetic.
Components consume the semantic alias `--sc-spacing-*`, never the
`--sc-scale-*` primitives. `font-size` ALWAYS comes from a
`--sc-font-size-*` token (rounded ramp 12/14/16/18/20/24/32/48).
The retired 8-point tokens (`--sc-spacing-50/100/200`, `--sc-space-*`)
must not be reintroduced — `npm run tokens:guard` blocks them.

### 5. Follow SmartContact naming strictly (DD-12)
- PrimeNG wrappers: selector is `sc-` + PrimeNG component name, lowercase,
  joined with no hyphen (`sc-button`, `sc-inputtext`, `sc-toggleswitch`,
  `sc-select`, `sc-radiobutton`, `sc-progressbar`, `sc-progressspinner`).
- Custom components (no PrimeNG equivalent): descriptive kebab-case
  (`sc-section-card`, `sc-empty-state`).
- class prefix: `sc-`
- predictable file and folder names
- BEM-style modifiers in CSS classes (`sc-button--primary`)

Generated class names must feel native to the existing repo.

### 6. Respect Angular 21 patterns already used in the repo
Use:
- standalone components
- typed inputs and outputs
- strict template-compatible APIs
- clean template composition
- minimal template logic
- reusable computed class patterns when helpful
- repository-consistent change detection and imports if already established

Do not introduce unrelated abstractions.

### 7. State handling must be fully implemented
If the component supports states such as:
- disabled
- loading
- full width
- icon left / right
- hover
- focus
- active

those states must be represented consistently across:
- public API
- template
- SCSS
- documentation examples

Do not document states that the implementation does not support.
Do not implement states that are not backed by the component API or actual styling.

### 8. Prefer repository consistency over theoretical perfection
Reuse the current SmartContact patterns even if another architecture might be cleaner in theory.

The goal is maintainability inside this repo, not architectural novelty.

### 9. Apply i18n ownership rules
Use `smartcontact-i18n` whenever generating or refactoring a custom component or demo page that contains visible text.

- Custom components with fixed design-system or business copy must own a colocated `i18n/<component>.translations.ts` file.
- Demo page text must use `projects/sc-demo/src/app/i18n/sc-demo.translations.ts` (create the file following the skill pattern if the demo does not have it yet).
- Primitive wrappers should not depend on translation services when text is supplied by consumer inputs.
- Derive supported languages from translation dictionary keys; keep `en` complete as fallback and do not use `es-ES` unless explicitly requested.

## Decision Rules: Custom Component vs PrimeNG Wrapper

### Generate a PrimeNG wrapper when
Use a wrapper when all of the following are true:
- the core interaction already exists in PrimeNG
- the SmartContact component is mainly a design-system API and styling layer
- the repository convention uses PrimeNG wrappers for similar primitives

Typical wrapper candidates:
- `sc-button`
- input-like controls (`sc-inputtext`, `sc-select`)
- simple form primitives (`sc-radiobutton`, `sc-toggleswitch`)

### Generate a custom component when
Use a custom implementation when one or more of the following are true:
- the component is design-system specific
- the structure is composite
- the layout is custom
- the component is not a thin skin over an existing PrimeNG primitive

Typical custom candidates:
- alert
- `sc-section-card`
- `sc-empty-state`
- banner
- layout blocks
- composite informational components

### PrimeNG wrapper rules
When generating a wrapper:
- do not reimplement behavior already handled by PrimeNG
- preserve accessibility and core behavior from the underlying PrimeNG component
- wrap only the API needed by SmartContact
- expose additional SmartContact inputs only when they provide real design-system value
- do not break disabled/loading behavior
- prefer styling through the preset (`sc-preset/`) over per-component overrides

## Token Usage Strategy
Apply this priority order when styling:
1. existing component-specific tokens (layer 4)
2. existing semantic tokens already used by the project (layer 2)
3. existing foundation tokens already used by similar components (layer 1, via semantic aliases)

Keep the provider boundary intact:
- use `--sc-*` tokens as the public SmartContact design-system contract inside SmartContact components
- `--p-*` PrimeNG variables live ONLY inside the preset (`projects/ui-smartcontact/src/lib/theme/sc-preset/`)
- do not make components or apps depend directly on PrimeNG styled-mode variables
- PrimeNG palette alignment happens in `sc-preset/base.ts` (each family points to `var(--sc-color-*)`, no hex)
- the default dark mode selector is `.sc-dark`

If no suitable tokens exist, do not invent a styling system.
Instead, keep the implementation limited to what the existing tokens support.

## Required File and Integration Checklist
When creating or refactoring a component, verify all relevant integration points.

Check and update, when applicable:
- component source files
- component-local i18n files for custom components with fixed copy
- local component exports
- library `public-api.ts`
- demo/docs page
- demo translation entries
- demo examples
- route registration
- navigation configuration
- imports used by demo pages
- references from overview or component index pages if the repo uses them

Do not duplicate exports.
Do not add dead routes.
Do not add navigation entries for pages that do not exist.

## Documentation Requirements
If the component is documented in `sc-demo`, match the existing documentation style already present in `projects/sc-demo/src/app/pages/`.

When applicable, include:
- overview
- variants
- sizes
- icon usage
- states
- usage examples
- code snippets
- API section for inputs and outputs
- supporting sidebar content if that pattern already exists

Documentation must reflect the real implementation exactly.

The docs examples must:
- use the real selector
- use real inputs
- use real outputs
- match actual supported variants and sizes

## Refactoring Rules
When the task is a refactor:
- preserve public API unless the request explicitly allows breaking changes
- reduce duplication where possible
- improve token consistency
- align the component more closely with project standards
- avoid changing behavior silently
- update docs if behavior or API changes

## Quality Checklist
Before finishing, validate all of the following:
- selector follows DD-12 (wrapper: PrimeNG name joined; custom: descriptive kebab)
- file and class names match repo conventions
- all used tokens are real and existing
- no hardcoded colors were introduced
- no arbitrary spacing values were added when tokens exist
- no `calc(...)` rem conversions and no `--sc-scale-*` direct usage in component SCSS
- `font-size` always via `--sc-font-size-*`
- disabled and loading states correctly block interaction when required
- PrimeNG wrappers preserve core behavior
- exports are complete and not duplicated
- documentation matches the real API
- examples compile conceptually against the generated component
- output is consistent with current references such as `sc-button`, `sc-toggleswitch`, `sc-inputtext`, and `sc-dynamic-dialog` (when ported)
- `npm run verify` passes (tokens:parity, tokens:guard, tokens:type-parity, audit:theme-scale, typecheck, lint)

## Failure Conditions
Do not force generation when the repository does not support it cleanly.

Stop or limit the implementation if:
- required tokens do not exist
- the requested API conflicts with project conventions
- the requested behavior is unsupported by the chosen wrapper strategy
- the docs request does not match the current demo structure

In these cases, prefer a constrained implementation over invented code.

## Example Prompts

### Example 1
Create a new `sc-badge` component with variants `neutral`, `success`, and `danger`, following the same conventions as `sc-button`.

### Example 2
Generate a new `sc-inputtext` component as a PrimeNG wrapper, using existing SmartContact tokens and producing full docs in `sc-demo`.

### Example 3
Refactor `sc-button` to reduce duplication, preserve its public API, and make it a stronger reference implementation for future component generation.

## Success Criteria
The final output must feel like code written by the SmartContact UI team for this specific repository.

It must:
- reuse the repo architecture
- respect real tokens
- fit Angular 21 patterns already present
- integrate cleanly with the demo app
- be maintainable by the existing team
