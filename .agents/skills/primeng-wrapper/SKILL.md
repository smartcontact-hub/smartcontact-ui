---
name: primeng-wrapper
description: Create SmartContact UI wrappers around PrimeNG 21 components by preserving PrimeNG behavior, applying SmartContact tokens, and aligning with existing Angular 21 repository patterns.
---

# PrimeNG Wrapper

## Purpose
Create a SmartContact UI wrapper component on top of an existing PrimeNG 21 component.

The wrapper must:
- preserve PrimeNG core behavior and accessibility
- expose a SmartContact-aligned API
- apply styling using real CSS tokens
- match patterns from existing wrappers (e.g. sc-button, sc-toggleswitch, sc-inputtext)

## Scope
Use this skill when the desired component:
- already exists in PrimeNG
- only requires styling + API normalization
- does not require custom rendering logic

Do NOT use this skill for composite or layout components.

## Naming (DD-12)
Wrapper selectors are `sc-` + the PrimeNG component name, lowercase, joined
with no hyphen:

- `sc-button`, `sc-inputtext`, `sc-toggleswitch`, `sc-select`,
  `sc-radiobutton`, `sc-progressbar`, `sc-progressspinner`

Custom components (no PrimeNG equivalent) use descriptive kebab-case instead
(`sc-section-card`, `sc-empty-state`) — those belong to component-generator,
not to this skill.

## Mandatory First Step: Inspect References
Before generating any wrapper, inspect (the ones already ported):

- `sc-button`
- `sc-toggleswitch`
- `sc-inputtext`

Wrappers are being ported incrementally. If no wrapper exists yet, derive the
pattern from `AGENTS.md`, the preset (`projects/ui-smartcontact/src/lib/theme/sc-preset/`)
and the token layers.

These define:
- how PrimeNG is wrapped in this repo
- how inputs/outputs are mapped
- how styleClass is used
- how disabled/loading is handled
- how tokens are applied

If the repo pattern differs from this file, the repo wins.

## Required Repository Inspection
Verify:
- how PrimeNG modules are imported
- how styleClass is passed
- how events are re-emitted
- how tokens are applied in SCSS
- export pattern in `public-api.ts`
- demo usage in `projects/sc-demo`

## Input
- PrimeNG component (e.g. Button, InputText)
- desired SmartContact API (inputs/outputs)
- variants, sizes, states (if applicable)

If incomplete:
- infer from existing wrappers
- do not invent unsupported features

## Output
Generate:
- standalone wrapper component (TS, HTML, SCSS)
- mapping from SmartContact API → PrimeNG inputs/outputs
- token-based styles
- export in `public-api.ts`
- demo usage if required by repo pattern

## Core Rules

### 1. Do NOT reimplement PrimeNG logic
- rely on PrimeNG for behavior (interaction, a11y, focus, keyboard)
- do not duplicate internal logic

### 2. Preserve accessibility and behavior
- do not break tab order, focus, aria attributes
- do not override default behavior unless required by design system

### 3. API mapping must be explicit
- expose SmartContact inputs (e.g. variant, size, loading)
- map them clearly to PrimeNG inputs (e.g. severity, size, loading)
- re-emit events using consistent naming (e.g. clicked)

### 4. Styling via tokens only
- use CSS variables from design-tokens (`--sc-*`)
- do not hardcode colors or spacing
- apply styles through classes and styleClass, not inline styles
- preserve the provider boundary: `--sc-*` is the SmartContact contract;
  `--p-*` lives ONLY inside the preset
  (`projects/ui-smartcontact/src/lib/theme/sc-preset/`)
- prefer fixing visuals in the preset over per-wrapper SCSS overrides

### 5. Do not own translations
- Do not add `ngx-translate` to primitive wrappers when labels, placeholders, aria labels, or helper text are supplied by consumer inputs.
- If a wrapper unexpectedly needs fixed internal copy, use `smartcontact-i18n` and confirm the copy is design-system-owned before adding translations.

### 6. Class strategy
- base class: `sc-<primengname>` (matches the selector)
- modifiers: `sc-<primengname>--<variant>`, `--<size>`, state classes
- keep class naming consistent with sc-button

### 7. State handling
Support (when applicable):
- disabled
- loading
- fullWidth
- icon left/right

Ensure:
- disabled/loading block interaction
- visual states match tokens

## Token Usage
Before writing SCSS:
- run token-inspector
- prefer component tokens if available
- fallback to semantic/foundation following repo pattern
- do not leak PrimeNG styled-mode variables outside the preset

Metric tokens are already in rem (14-base scale). Consume them directly:

```scss
padding: var(--sc-spacing-0-75); /* 10.5px de diseño */
font-size: var(--sc-font-size-200);
```

Never use `calc(var(--token) / 16 * 1rem)` or the retired 8-point tokens.

## Integration Checklist
- component files created
- exported in `public-api.ts`
- imports updated (PrimeNG module)
- demo page updated (if required)
- no duplicate exports
- no unused inputs/outputs
- `npm run verify` passes (includes tokens:guard, which blocks raw PrimeNG
  form fields outside wrappers and `--p-*` outside the preset)

## Failure Conditions
Do not generate wrapper if:
- PrimeNG component does not cover required behavior
- required tokens do not exist
- wrapper would heavily override PrimeNG internals

In those cases, prefer a custom component.

## Example

### Input
Create a SmartContact input based on PrimeNG InputText with size and disabled support.

### Output
- `sc-inputtext` wrapping PrimeNG InputText
- inputs: size, disabled
- token-based styling
- consistent API and classes

## Success Criteria
- wrapper feels native to SmartContact UI
- PrimeNG behavior is preserved
- styling uses real tokens
- API is consistent with existing components
